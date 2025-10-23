# DApp Monedero Digital - Instrucciones para Copilot

## Descripción del Proyecto
DApp (Aplicación Descentralizada) de Monedero Digital con sistema de roles para Padre/Tutor, Hijo y Comercio.

## Stack Tecnológico
- **Frontend**: React 19, Vite, TailwindCSS, Ethers.js
- **Backend**: Node.js, Express, Mongoose
- **Base de Datos**: MongoDB Atlas
- **Smart Contracts**: Solidity (.sol)
- **Blockchain**: Metamask (Web3), Testnets (Ethereum, Sepolia, Holesky, Hoodi)
- **Almacenamiento**: Cloudinary para imágenes

## Roles del Sistema

### 👨‍👩‍👧‍👦 Padre / Tutor
- Crear cuenta y perfil con foto
- Registrar uno o varios hijos
- Asignar límites de gasto diario/semanal con calendario
- Transferir fondos a wallets de hijos
- Ver historial completo

### 👶 Hijo
- Login mediante registro del padre
- Recibir fondos solo del padre
- Ver saldo disponible
- Historial de límites y categorías de gasto
- Realizar pagos en comercios autorizados

### 🏪 Comercio
- Registrar perfil con imágenes
- Subir productos/servicios
- Recibir pagos de hijos
- Ver historial de transacciones

## Funcionalidades Principales
- Gestión de límites con calendario animado
- Categorías de comercio
- Historial detallado de transacciones
- Perfiles con imágenes (Cloudinary)
- Integración completa con Metamask
- Cambio de redes blockchain

## Estructura del Proyecto
```
monedero_digital_v2/
├── frontend/          # React 19 + Vite
├── backend/           # Node.js + Express
├── contracts/         # Smart Contracts Solidity
├── docs/             # Documentación
└── .env.example      # Variables de entorno
```