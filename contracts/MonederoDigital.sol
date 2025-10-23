// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title MonederoDigital
 * @dev Smart Contract para gestionar el monedero digital con roles de Padre, Hijo y Comercio
 */
contract MonederoDigital is ReentrancyGuard, Ownable, Pausable {
    
    // Estructura para representar un usuario
    struct Usuario {
        address walletAddress;
        string nombre;
        Rol role;
        bool activo;
        uint256 saldo;
        uint256 fechaRegistro;
    }
    
    // Estructura para límites de gasto de hijos
    struct LimiteGasto {
        uint256 limiteDiario;
        uint256 limiteSemanal;
        uint256 limiteMensual;
        uint256 gastoHoy;
        uint256 gastoSemana;
        uint256 gastoMes;
        uint256 ultimoResetDiario;
        uint256 ultimoResetSemanal;
        uint256 ultimoResetMensual;
    }
    
    // Estructura para transacciones
    struct Transaccion {
        address from;
        address to;
        uint256 monto;
        string concepto;
        CategoriaGasto categoria;
        uint256 timestamp;
        bool confirmada;
    }
    
    // Enums
    enum Rol { Padre, Hijo, Comercio }
    enum CategoriaGasto { 
        Alimentacion, 
        Educacion, 
        Entretenimiento, 
        Deportes, 
        Tecnologia, 
        Ropa, 
        Salud, 
        Transporte, 
        Otros 
    }
    
    // Estado del contrato
    mapping(address => Usuario) public usuarios;
    mapping(address => address) public hijoPadre; // hijo => padre
    mapping(address => address[]) public padreHijos; // padre => [hijos]
    mapping(address => LimiteGasto) public limitesGasto;
    mapping(address => mapping(CategoriaGasto => uint256)) public limitesPorCategoria;
    mapping(address => mapping(CategoriaGasto => uint256)) public gastoPorCategoria;
    
    Transaccion[] public transacciones;
    mapping(address => uint256[]) public transaccionesUsuario;
    
    // Eventos
    event UsuarioRegistrado(address indexed wallet, string nombre, Rol role);
    event HijoRegistrado(address indexed padre, address indexed hijo, string nombre);
    event DepositoRealizado(address indexed padre, address indexed hijo, uint256 monto);
    event PagoRealizado(address indexed hijo, address indexed comercio, uint256 monto, CategoriaGasto categoria);
    event LimiteEstablecido(address indexed hijo, uint256 limiteDiario, uint256 limiteSemanal, uint256 limiteMensual);
    event LimiteCategoriaEstablecido(address indexed hijo, CategoriaGasto categoria, uint256 limite);
    event SaldoInsuficiente(address indexed usuario, uint256 montoRequerido, uint256 saldoDisponible);
    event LimiteExcedido(address indexed hijo, string tipoLimite, uint256 monto, uint256 limite);
    
    // Modificadores
    modifier soloRegistrado() {
        require(usuarios[msg.sender].activo, "Usuario no registrado");
        _;
    }
    
    modifier soloPadre() {
        require(usuarios[msg.sender].role == Rol.Padre, "Solo padres pueden ejecutar esta funcion");
        _;
    }
    
    modifier soloHijo() {
        require(usuarios[msg.sender].role == Rol.Hijo, "Solo hijos pueden ejecutar esta funcion");
        _;
    }
    
    modifier soloComercio() {
        require(usuarios[msg.sender].role == Rol.Comercio, "Solo comercios pueden ejecutar esta funcion");
        _;
    }
    
    modifier hijoDelPadre(address hijo) {
        require(hijoPadre[hijo] == msg.sender, "No eres el padre de este hijo");
        _;
    }
    
    constructor() {}
    
    /**
     * @dev Registrar un padre/tutor
     */
    function registrarPadre(string memory _nombre) external {
        require(!usuarios[msg.sender].activo, "Usuario ya registrado");
        require(bytes(_nombre).length > 0, "Nombre requerido");
        
        usuarios[msg.sender] = Usuario({
            walletAddress: msg.sender,
            nombre: _nombre,
            role: Rol.Padre,
            activo: true,
            saldo: 0,
            fechaRegistro: block.timestamp
        });
        
        emit UsuarioRegistrado(msg.sender, _nombre, Rol.Padre);
    }
    
    /**
     * @dev Registrar un hijo (solo puede hacerlo un padre)
     */
    function registrarHijo(address _hijoWallet, string memory _nombre) external soloPadre {
        require(!usuarios[_hijoWallet].activo, "Hijo ya registrado");
        require(_hijoWallet != msg.sender, "No puedes registrarte como tu propio hijo");
        require(bytes(_nombre).length > 0, "Nombre requerido");
        
        usuarios[_hijoWallet] = Usuario({
            walletAddress: _hijoWallet,
            nombre: _nombre,
            role: Rol.Hijo,
            activo: true,
            saldo: 0,
            fechaRegistro: block.timestamp
        });
        
        hijoPadre[_hijoWallet] = msg.sender;
        padreHijos[msg.sender].push(_hijoWallet);
        
        // Inicializar límites de gasto
        limitesGasto[_hijoWallet] = LimiteGasto({
            limiteDiario: 0,
            limiteSemanal: 0,
            limiteMensual: 0,
            gastoHoy: 0,
            gastoSemana: 0,
            gastoMes: 0,
            ultimoResetDiario: block.timestamp,
            ultimoResetSemanal: block.timestamp,
            ultimoResetMensual: block.timestamp
        });
        
        emit HijoRegistrado(msg.sender, _hijoWallet, _nombre);
    }
    
    /**
     * @dev Registrar un comercio
     */
    function registrarComercio(string memory _nombre) external {
        require(!usuarios[msg.sender].activo, "Usuario ya registrado");
        require(bytes(_nombre).length > 0, "Nombre requerido");
        
        usuarios[msg.sender] = Usuario({
            walletAddress: msg.sender,
            nombre: _nombre,
            role: Rol.Comercio,
            activo: true,
            saldo: 0,
            fechaRegistro: block.timestamp
        });
        
        emit UsuarioRegistrado(msg.sender, _nombre, Rol.Comercio);
    }
    
    /**
     * @dev Depositar fondos a la wallet de un hijo
     */
    function depositarAHijo(address _hijo) external payable soloPadre hijoDelPadre(_hijo) nonReentrant {
        require(msg.value > 0, "El monto debe ser mayor a 0");
        require(usuarios[_hijo].activo, "Hijo no registrado");
        
        usuarios[_hijo].saldo += msg.value;
        
        // Registrar transacción
        _registrarTransaccion(
            msg.sender, 
            _hijo, 
            msg.value, 
            "Deposito de padre a hijo", 
            CategoriaGasto.Otros
        );
        
        emit DepositoRealizado(msg.sender, _hijo, msg.value);
    }
    
    /**
     * @dev Establecer límites de gasto para un hijo
     */
    function establecerLimites(
        address _hijo,
        uint256 _limiteDiario,
        uint256 _limiteSemanal,
        uint256 _limiteMensual
    ) external soloPadre hijoDelPadre(_hijo) {
        require(usuarios[_hijo].activo, "Hijo no registrado");
        
        LimiteGasto storage limite = limitesGasto[_hijo];
        limite.limiteDiario = _limiteDiario;
        limite.limiteSemanal = _limiteSemanal;
        limite.limiteMensual = _limiteMensual;
        
        emit LimiteEstablecido(_hijo, _limiteDiario, _limiteSemanal, _limiteMensual);
    }
    
    /**
     * @dev Establecer límite por categoría
     */
    function establecerLimiteCategoria(
        address _hijo,
        CategoriaGasto _categoria,
        uint256 _limite
    ) external soloPadre hijoDelPadre(_hijo) {
        require(usuarios[_hijo].activo, "Hijo no registrado");
        
        limitesPorCategoria[_hijo][_categoria] = _limite;
        
        emit LimiteCategoriaEstablecido(_hijo, _categoria, _limite);
    }
    
    /**
     * @dev Realizar un pago a un comercio (solo hijos)
     */
    function pagarComercio(
        address _comercio, 
        uint256 _monto, 
        string memory _concepto,
        CategoriaGasto _categoria
    ) external soloHijo nonReentrant {
        require(usuarios[_comercio].activo && usuarios[_comercio].role == Rol.Comercio, "Comercio no valido");
        require(_monto > 0, "El monto debe ser mayor a 0");
        require(usuarios[msg.sender].saldo >= _monto, "Saldo insuficiente");
        
        // Verificar límites antes de proceder
        require(_verificarLimites(msg.sender, _monto, _categoria), "Limite de gasto excedido");
        
        // Realizar la transferencia
        usuarios[msg.sender].saldo -= _monto;
        usuarios[_comercio].saldo += _monto;
        
        // Actualizar gastos
        _actualizarGastos(msg.sender, _monto, _categoria);
        
        // Registrar transacción
        _registrarTransaccion(msg.sender, _comercio, _monto, _concepto, _categoria);
        
        emit PagoRealizado(msg.sender, _comercio, _monto, _categoria);
    }
    
    /**
     * @dev Retirar fondos (solo comercios)
     */
    function retirarFondos(uint256 _monto) external soloComercio nonReentrant {
        require(_monto > 0, "El monto debe ser mayor a 0");
        require(usuarios[msg.sender].saldo >= _monto, "Saldo insuficiente");
        
        usuarios[msg.sender].saldo -= _monto;
        
        (bool success, ) = payable(msg.sender).call{value: _monto}("");
        require(success, "Error al retirar fondos");
    }
    
    /**
     * @dev Verificar límites de gasto
     */
    function _verificarLimites(address _hijo, uint256 _monto, CategoriaGasto _categoria) internal returns (bool) {
        LimiteGasto storage limite = limitesGasto[_hijo];
        
        // Reset de contadores si es necesario
        _resetContadores(_hijo);
        
        // Verificar límite diario
        if (limite.limiteDiario > 0 && (limite.gastoHoy + _monto) > limite.limiteDiario) {
            emit LimiteExcedido(_hijo, "diario", _monto, limite.limiteDiario);
            return false;
        }
        
        // Verificar límite semanal
        if (limite.limiteSemanal > 0 && (limite.gastoSemana + _monto) > limite.limiteSemanal) {
            emit LimiteExcedido(_hijo, "semanal", _monto, limite.limiteSemanal);
            return false;
        }
        
        // Verificar límite mensual
        if (limite.limiteMensual > 0 && (limite.gastoMes + _monto) > limite.limiteMensual) {
            emit LimiteExcedido(_hijo, "mensual", _monto, limite.limiteMensual);
            return false;
        }
        
        // Verificar límite por categoría
        uint256 limiteCat = limitesPorCategoria[_hijo][_categoria];
        if (limiteCat > 0 && (gastoPorCategoria[_hijo][_categoria] + _monto) > limiteCat) {
            emit LimiteExcedido(_hijo, "categoria", _monto, limiteCat);
            return false;
        }
        
        return true;
    }
    
    /**
     * @dev Actualizar gastos después de una transacción
     */
    function _actualizarGastos(address _hijo, uint256 _monto, CategoriaGasto _categoria) internal {
        LimiteGasto storage limite = limitesGasto[_hijo];
        
        limite.gastoHoy += _monto;
        limite.gastoSemana += _monto;
        limite.gastoMes += _monto;
        
        gastoPorCategoria[_hijo][_categoria] += _monto;
    }
    
    /**
     * @dev Reset de contadores de gasto basado en tiempo
     */
    function _resetContadores(address _hijo) internal {
        LimiteGasto storage limite = limitesGasto[_hijo];
        uint256 tiempoActual = block.timestamp;
        
        // Reset diario (24 horas)
        if (tiempoActual >= limite.ultimoResetDiario + 1 days) {
            limite.gastoHoy = 0;
            limite.ultimoResetDiario = tiempoActual;
        }
        
        // Reset semanal (7 días)
        if (tiempoActual >= limite.ultimoResetSemanal + 7 days) {
            limite.gastoSemana = 0;
            limite.ultimoResetSemanal = tiempoActual;
        }
        
        // Reset mensual (30 días)
        if (tiempoActual >= limite.ultimoResetMensual + 30 days) {
            limite.gastoMes = 0;
            limite.ultimoResetMensual = tiempoActual;
            
            // Reset también los gastos por categoría mensualmente
            for (uint i = 0; i < 9; i++) {
                gastoPorCategoria[_hijo][CategoriaGasto(i)] = 0;
            }
        }
    }
    
    /**
     * @dev Registrar una transacción
     */
    function _registrarTransaccion(
        address _from,
        address _to,
        uint256 _monto,
        string memory _concepto,
        CategoriaGasto _categoria
    ) internal {
        Transaccion memory nuevaTransaccion = Transaccion({
            from: _from,
            to: _to,
            monto: _monto,
            concepto: _concepto,
            categoria: _categoria,
            timestamp: block.timestamp,
            confirmada: true
        });
        
        transacciones.push(nuevaTransaccion);
        uint256 transaccionId = transacciones.length - 1;
        
        transaccionesUsuario[_from].push(transaccionId);
        transaccionesUsuario[_to].push(transaccionId);
    }
    
    // Funciones de vista
    function obtenerHijosDePadre(address _padre) external view returns (address[] memory) {
        return padreHijos[_padre];
    }
    
    function obtenerPadreDe(address _hijo) external view returns (address) {
        return hijoPadre[_hijo];
    }
    
    function obtenerSaldo(address _usuario) external view returns (uint256) {
        return usuarios[_usuario].saldo;
    }
    
    function obtenerLimites(address _hijo) external view returns (LimiteGasto memory) {
        return limitesGasto[_hijo];
    }
    
    function obtenerTransaccionesUsuario(address _usuario) external view returns (uint256[] memory) {
        return transaccionesUsuario[_usuario];
    }
    
    function obtenerTransaccion(uint256 _id) external view returns (Transaccion memory) {
        require(_id < transacciones.length, "Transaccion no existe");
        return transacciones[_id];
    }
    
    function totalTransacciones() external view returns (uint256) {
        return transacciones.length;
    }
    
    // Funciones de administración
    function pausar() external onlyOwner {
        _pause();
    }
    
    function despausar() external onlyOwner {
        _unpause();
    }
    
    function retirarContrato() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Error al retirar fondos del contrato");
    }
    
    // Función para recibir ETH
    receive() external payable {}
    
    fallback() external payable {}
}