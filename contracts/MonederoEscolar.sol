// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MonederoEscolar - Sistema de Monedero Escolar Optimizado
 * @author OMAR FELIX RIVERA ROSAS
 * @notice Smart Contract para gestionar un sistema de monedero escolar donde los padres
 *         pueden controlar y monitorear los gastos de sus hijos mediante tarjetas digitales
 * @dev Versión optimizada para cumplir con límites de tamaño de contrato (24KB)
 */
contract MonederoEscolar {
    
    // ============= VARIABLES DE CONTROL =============
    
    address public owner;
    mapping(address => bool) private _reentrancyGuard;
    
    // ============= ESTRUCTURAS OPTIMIZADAS =============
    
    /**
     * @notice Categoría de gastos con límite máximo
     * @param nombre Nombre de la categoría
     * @param limiteMaximo Límite máximo diario en wei
     * @param activa Estado de la categoría
     */
    struct Categoria {
        string nombre;
        uint128 limiteMaximo; // Reducido de uint256 a uint128
        bool activa;
    }
    
    /**
     * @notice Transacción realizada por un hijo
     * @param hijo Dirección del hijo
     * @param monto Cantidad gastada
     * @param categoria ID de categoría
     * @param timestamp Momento de la transacción
     * @param comercio Dirección del comercio
     */
    struct Transaccion {
        address hijo;
        uint128 monto; // Reducido de uint256 a uint128
        uint8 categoria; // Reducido de uint256 a uint8 (máximo 255 categorías)
        uint32 timestamp; // Reducido de uint256 a uint32
        address comercio;
    }
    
    /**
     * @notice Perfil de un hijo registrado
     * @param padre Dirección del padre responsable
     * @param limiteDiario Límite diario de gastos
     * @param balance Balance actual disponible
     * @param gastosDiarios Gastos del día actual
     * @param ultimaActividad Timestamp de última actividad
     * @param activo Estado de la cuenta
     */
    struct PerfilHijo {
        address padre;
        uint128 limiteDiario; // Reducido de uint256 a uint128
        uint128 balance; // Reducido de uint256 a uint128
        uint128 gastosDiarios; // Reducido de uint256 a uint128
        uint32 ultimaActividad; // Reducido de uint256 a uint32
        bool activo;
    }
    
    // ============= VARIABLES DE ESTADO OPTIMIZADAS =============
    
    mapping(address => PerfilHijo) public perfilesHijos;
    mapping(address => address[]) public hijosPorPadre;
    Categoria[] public categorias;
    Transaccion[] public transacciones;
    mapping(address => bool) public comerciosRegistrados;
    mapping(address => mapping(uint8 => mapping(uint32 => uint128))) public gastosPorCategoria;
    
    // ============= EVENTOS OPTIMIZADOS =============
    
    event HijoRegistrado(address indexed hijo, address indexed padre, uint128 limiteDiario);
    event TransaccionRealizada(address indexed hijo, address indexed comercio, uint128 monto, uint8 categoria);
    event FondosDepositados(address indexed padre, address indexed hijo, uint128 monto);
    event LimiteDiarioActualizado(address indexed hijo, uint128 nuevoLimite);
    event ComercioRegistrado(address indexed comercio);
    event EstadoCuentaCambiado(address indexed hijo, bool activo);
    
    // ============= MODIFICADORES OPTIMIZADOS =============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Solo owner");
        _;
    }
    
    modifier soloPadre(address _hijo) {
        require(perfilesHijos[_hijo].padre == msg.sender, "Solo padre");
        _;
    }
    
    modifier hijoValido(address _hijo) {
        require(perfilesHijos[_hijo].activo, "Hijo inactivo");
        _;
    }
    
    modifier soloComercioRegistrado() {
        require(comerciosRegistrados[msg.sender], "Comercio no registrado");
        _;
    }
    
    modifier nonReentrant() {
        require(!_reentrancyGuard[msg.sender], "Reentrancia detectada");
        _reentrancyGuard[msg.sender] = true;
        _;
        _reentrancyGuard[msg.sender] = false;
    }
    
    // ============= CONSTRUCTOR =============
    
    constructor() {
        owner = msg.sender;
        
        // Categorías por defecto optimizadas
        categorias.push(Categoria("Transporte", 0.02 ether, true));
        categorias.push(Categoria("Lonchera", 0.025 ether, true));
        categorias.push(Categoria("Materiales", 0.05 ether, true));
        categorias.push(Categoria("Entretenimiento", 0.03 ether, true));
        categorias.push(Categoria("Emergencia", 0.1 ether, true));
    }
    
    // ============= FUNCIONES PRINCIPALES OPTIMIZADAS =============
    
    /**
     * @notice Registra un nuevo hijo en el sistema
     * @param _hijo Dirección del hijo
     * @param _limiteDiario Límite diario en wei
     */
    function registrarHijo(address _hijo, uint128 _limiteDiario) external {
        require(_hijo != address(0) && _limiteDiario > 0, "Parametros invalidos");
        require(!perfilesHijos[_hijo].activo, "Hijo ya registrado");
        
        perfilesHijos[_hijo] = PerfilHijo({
            padre: msg.sender,
            limiteDiario: _limiteDiario,
            balance: 0,
            gastosDiarios: 0,
            ultimaActividad: uint32(block.timestamp),
            activo: true
        });
        
        hijosPorPadre[msg.sender].push(_hijo);
        emit HijoRegistrado(_hijo, msg.sender, _limiteDiario);
    }
    
    /**
     * @notice Deposita fondos para un hijo
     * @param _hijo Dirección del hijo
     */
    function depositarFondos(address _hijo) external payable soloPadre(_hijo) hijoValido(_hijo) {
        require(msg.value > 0, "Valor requerido");
        
        perfilesHijos[_hijo].balance += uint128(msg.value);
        emit FondosDepositados(msg.sender, _hijo, uint128(msg.value));
    }
    
    /**
     * @notice Procesa una compra de un hijo
     * @param _hijo Dirección del hijo
     * @param _monto Cantidad a gastar
     * @param _categoria ID de categoría
     */
    function procesarCompra(
        address _hijo,
        uint128 _monto,
        uint8 _categoria
    ) external soloComercioRegistrado hijoValido(_hijo) nonReentrant {
        require(_monto > 0 && _categoria < categorias.length, "Parametros invalidos");
        require(categorias[_categoria].activa, "Categoria inactiva");
        
        PerfilHijo storage perfil = perfilesHijos[_hijo];
        
        // Resetear gastos si es nuevo día
        if (block.timestamp >= perfil.ultimaActividad + 1 days) {
            perfil.gastosDiarios = 0;
        }
        
        // Verificar límites
        require(perfil.balance >= _monto, "Saldo insuficiente");
        require(perfil.gastosDiarios + _monto <= perfil.limiteDiario, "Excede limite diario");
        
        uint32 diaActual = uint32(block.timestamp / 1 days);
        uint128 gastosCategoriaHoy = gastosPorCategoria[_hijo][_categoria][diaActual];
        require(gastosCategoriaHoy + _monto <= categorias[_categoria].limiteMaximo, "Excede limite categoria");
        
        // Procesar transacción
        perfil.balance -= _monto;
        perfil.gastosDiarios += _monto;
        perfil.ultimaActividad = uint32(block.timestamp);
        
        gastosPorCategoria[_hijo][_categoria][diaActual] += _monto;
        
        transacciones.push(Transaccion({
            hijo: _hijo,
            monto: _monto,
            categoria: _categoria,
            timestamp: uint32(block.timestamp),
            comercio: msg.sender
        }));
        
        (bool success, ) = payable(msg.sender).call{value: _monto}("");
        require(success, "Transferencia fallida");
        
        emit TransaccionRealizada(_hijo, msg.sender, _monto, _categoria);
    }
    
    /**
     * @notice Actualiza límite diario de un hijo
     * @param _hijo Dirección del hijo
     * @param _nuevoLimite Nuevo límite diario
     */
    function actualizarLimiteDiario(address _hijo, uint128 _nuevoLimite) 
        external soloPadre(_hijo) hijoValido(_hijo) {
        require(_nuevoLimite > 0, "Limite invalido");
        
        perfilesHijos[_hijo].limiteDiario = _nuevoLimite;
        emit LimiteDiarioActualizado(_hijo, _nuevoLimite);
    }
    
    /**
     * @notice Registra un comercio autorizado
     * @param _comercio Dirección del comercio
     */
    function registrarComercio(address _comercio) external onlyOwner {
        require(_comercio != address(0) && !comerciosRegistrados[_comercio], "Comercio invalido");
        
        comerciosRegistrados[_comercio] = true;
        emit ComercioRegistrado(_comercio);
    }
    
    /**
     * @notice Agrega nueva categoría
     * @param _nombre Nombre de la categoría
     * @param _limiteMaximo Límite máximo
     */
    function agregarCategoria(string memory _nombre, uint128 _limiteMaximo) external onlyOwner {
        require(bytes(_nombre).length > 0 && _limiteMaximo > 0, "Parametros invalidos");
        
        categorias.push(Categoria(_nombre, _limiteMaximo, true));
    }
    
    // ============= FUNCIONES DE CONSULTA OPTIMIZADAS =============
    
    /**
     * @notice Obtiene balance de un hijo
     * @param _hijo Dirección del hijo
     * @return balance Balance actual
     */
    function obtenerBalance(address _hijo) external view returns (uint128 balance) {
        return perfilesHijos[_hijo].balance;
    }
    
    /**
     * @notice Obtiene gastos diarios de un hijo
     * @param _hijo Dirección del hijo
     * @return gastos Gastos del día actual
     */
    function obtenerGastosDiarios(address _hijo) external view returns (uint128 gastos) {
        PerfilHijo memory perfil = perfilesHijos[_hijo];
        
        if (block.timestamp < perfil.ultimaActividad + 1 days) {
            return perfil.gastosDiarios;
        }
        return 0;
    }
    
    /**
     * @notice Obtiene perfil completo de un hijo
     * @param _hijo Dirección del hijo
     * @return perfil Estructura del perfil
     */
    function obtenerPerfilHijo(address _hijo) external view returns (PerfilHijo memory perfil) {
        return perfilesHijos[_hijo];
    }
    
    /**
     * @notice Obtiene hijos de un padre
     * @param _padre Dirección del padre
     * @return hijos Array de direcciones
     */
    function obtenerHijos(address _padre) external view returns (address[] memory hijos) {
        return hijosPorPadre[_padre];
    }
    
    /**
     * @notice Obtiene información de una categoría
     * @param _categoriaId ID de la categoría
     * @return categoria Estructura de la categoría
     */
    function obtenerCategoria(uint8 _categoriaId) external view returns (Categoria memory categoria) {
        require(_categoriaId < categorias.length, "Categoria inexistente");
        return categorias[_categoriaId];
    }
    
    /**
     * @notice Obtiene total de categorías
     * @return total Número de categorías
     */
    function obtenerTotalCategorias() external view returns (uint256 total) {
        return categorias.length;
    }
    
    /**
     * @notice Obtiene total de transacciones
     * @return total Número de transacciones
     */
    function obtenerTotalTransacciones() external view returns (uint256 total) {
        return transacciones.length;
    }
    
    /**
     * @notice Obtiene gastos por categoría del día actual
     * @param _hijo Dirección del hijo
     * @param _categoria ID de categoría
     * @return gastos Gastos de la categoría hoy
     */
    function obtenerGastosCategoriaHoy(address _hijo, uint8 _categoria) 
        external view returns (uint128 gastos) {
        uint32 diaActual = uint32(block.timestamp / 1 days);
        return gastosPorCategoria[_hijo][_categoria][diaActual];
    }
    
    /**
     * @notice Verifica si es comercio registrado
     * @param _comercio Dirección a verificar
     * @return esComercio True si está registrado
     */
    function esComercioRegistrado(address _comercio) external view returns (bool esComercio) {
        return comerciosRegistrados[_comercio];
    }
    
    // ============= FUNCIONES ADMINISTRATIVAS OPTIMIZADAS =============
    
    /**
     * @notice Pausa cuenta de un hijo
     * @param _hijo Dirección del hijo
     */
    function pausarCuentaHijo(address _hijo) external soloPadre(_hijo) {
        require(perfilesHijos[_hijo].activo, "Ya pausada");
        
        perfilesHijos[_hijo].activo = false;
        emit EstadoCuentaCambiado(_hijo, false);
    }
    
    /**
     * @notice Reactiva cuenta de un hijo
     * @param _hijo Dirección del hijo
     */
    function reactivarCuentaHijo(address _hijo) external soloPadre(_hijo) {
        require(!perfilesHijos[_hijo].activo, "Ya activa");
        
        perfilesHijos[_hijo].activo = true;
        emit EstadoCuentaCambiado(_hijo, true);
    }
    
    /**
     * @notice Retira fondos de la cuenta de un hijo
     * @param _hijo Dirección del hijo
     * @param _monto Cantidad a retirar
     */
    function retirarFondos(address _hijo, uint128 _monto) 
        external soloPadre(_hijo) hijoValido(_hijo) nonReentrant {
        require(_monto > 0 && perfilesHijos[_hijo].balance >= _monto, "Monto invalido");
        
        perfilesHijos[_hijo].balance -= _monto;
        
        (bool success, ) = payable(msg.sender).call{value: _monto}("");
        require(success, "Transferencia fallida");
    }
    
    /**
     * @notice Función de emergencia para retirar fondos del contrato
     * @param _monto Cantidad a retirar
     */
    function retiroEmergencia(uint128 _monto) external onlyOwner nonReentrant {
        require(_monto <= address(this).balance, "Monto excede balance");
        
        (bool success, ) = payable(owner).call{value: _monto}("");
        require(success, "Retiro fallido");
    }
    
    /**
     * @notice Transfiere propiedad del contrato
     * @param _nuevoOwner Nueva dirección propietaria
     */
    function transferirPropiedad(address _nuevoOwner) external onlyOwner {
        require(_nuevoOwner != address(0) && _nuevoOwner != owner, "Owner invalido");
        owner = _nuevoOwner;
    }
    
    // ============= FUNCIONES DE UTILIDAD =============
    
    /**
     * @notice Obtiene balance del contrato
     * @return balance Balance total
     */
    function obtenerBalanceContrato() external view returns (uint256 balance) {
        return address(this).balance;
    }
    
    /**
     * @notice Función para recibir ETH
     */
    receive() external payable {}
    
    /**
     * @notice Función fallback
     */
    fallback() external payable {
        revert("Funcion no encontrada");
    }
}