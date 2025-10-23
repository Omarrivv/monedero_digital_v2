// Script para generar un token JWT válido para testing
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Datos del usuario de la BD
const userData = {
  userId: '68f5a9a0f8c9ac6ba827c579',
  role: 'padre',
  walletAddress: '0x0b9147dd08d69bb11e4d17624308b33ef99d53c6'
};

// Generar token
const token = jwt.sign(userData, process.env.JWT_SECRET, { 
  expiresIn: '24h' 
});

console.log('🎫 Token generado:');
console.log(token);
console.log('');
console.log('📋 Para usar en el frontend, ejecuta en la consola del navegador:');
console.log(`localStorage.setItem('authToken', '${token}');`);
console.log('');
console.log('🔍 Datos del token:');
console.log('- User ID:', userData.userId);
console.log('- Role:', userData.role);
console.log('- Wallet:', userData.walletAddress);
console.log('- Expira en: 24 horas');