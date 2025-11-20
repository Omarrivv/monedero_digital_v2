// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TransferenciasBasicas - Sistema Básico de Transferencias
 * @author OMAR FELIX RIVERA ROSAS
 * @notice Smart Contract básico para transferencias simples
 */
contract TransferenciasBasicas {
    
    address public owner;
    uint256 public totalTransferencias;
    
    // Estructura básica de transferencia
    struct Transferencia {
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
    }
    
    // Mapeos básicos
    mapping(uint256 => Transferencia) public transferencias;
    mapping(address => uint256) public balances;
    
    // Eventos
    event TransferenciaRealizada(address indexed from, address indexed to, uint256 amount);
    event DepositoRealizado(address indexed usuario, uint256 amount);
    event RetiroRealizado(address indexed usuario, uint256 amount);
    
    // Constructor
    constructor() {
        owner = msg.sender;
        totalTransferencias = 0;
    }
    
    // Depositar ETH al contrato
    function depositar() external payable {
        require(msg.value > 0, "Valor debe ser mayor a 0");
        balances[msg.sender] += msg.value;
        emit DepositoRealizado(msg.sender, msg.value);
    }
    
    // Transferir entre usuarios
    function transferir(address to, uint256 amount) external {
        require(to != address(0), "Direccion invalida");
        require(amount > 0, "Monto invalido");
        require(balances[msg.sender] >= amount, "Saldo insuficiente");
        
        balances[msg.sender] -= amount;
        balances[to] += amount;
        
        transferencias[totalTransferencias] = Transferencia({
            from: msg.sender,
            to: to,
            amount: amount,
            timestamp: block.timestamp
        });
        
        totalTransferencias++;
        
        emit TransferenciaRealizada(msg.sender, to, amount);
    }
    
    // Retirar ETH del contrato
    function retirar(uint256 amount) external {
        require(amount > 0, "Monto invalido");
        require(balances[msg.sender] >= amount, "Saldo insuficiente");
        
        balances[msg.sender] -= amount;
        
        // Usar call en lugar de transfer para mayor seguridad
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transferencia fallida");
        
        emit RetiroRealizado(msg.sender, amount);
    }
    
    // Ver balance de usuario
    function obtenerBalance(address usuario) external view returns (uint256) {
        return balances[usuario];
    }
    
    // Ver balance propio
    function miBalance() external view returns (uint256) {
        return balances[msg.sender];
    }
    
    // Ver transferencia específica
    function obtenerTransferencia(uint256 id) external view returns (
        address from,
        address to, 
        uint256 amount,
        uint256 timestamp
    ) {
        require(id < totalTransferencias, "Transferencia no existe");
        Transferencia memory t = transferencias[id];
        return (t.from, t.to, t.amount, t.timestamp);
    }
    
    // Ver balance del contrato
    function balanceContrato() external view returns (uint256) {
        return address(this).balance;
    }
    
    // Función de emergencia solo para el owner
    function retiroEmergencia() external {
        require(msg.sender == owner, "Solo el owner");
        uint256 balance = address(this).balance;
        require(balance > 0, "No hay fondos");
        
        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Transferencia fallida");
    }
    
    // Recibir ETH directamente
    receive() external payable {
        if (msg.value > 0) {
            balances[msg.sender] += msg.value;
            emit DepositoRealizado(msg.sender, msg.value);
        }
    }
    
    // Fallback
    fallback() external payable {
        revert("Funcion no encontrada");
    }
}