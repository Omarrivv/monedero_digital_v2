// Script para establecer el token en el navegador
// Ejecuta esto en la consola del navegador (F12)

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGY1YTlhMGY4YzlhYzZiYTgyN2M1NzkiLCJyb2xlIjoicGFkcmUiLCJ3YWxsZXRBZGRyZXNzIjoiMHgwYjkxNDdkZDA4ZDY5YmIxMWU0ZDE3NjI0MzA4YjMzZWY5OWQ1M2M2IiwiaWF0IjoxNzYwOTQxNTMxLCJleHAiOjE3NjEwMjc5MzF9.yke-1r7sJQJt4CmoRpqP5aPffW6zVma4pCimzpqUKWk';

// Establecer el token
localStorage.setItem('authToken', token);

// Verificar que se estableció correctamente
console.log('✅ Token establecido:', localStorage.getItem('authToken') ? 'Sí' : 'No');

// Decodificar y mostrar información del token
try {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('📋 Información del token:');
  console.log('- User ID:', payload.userId);
  console.log('- Role:', payload.role);
  console.log('- Wallet:', payload.walletAddress);
  console.log('- Expira:', new Date(payload.exp * 1000));
  console.log('- Válido hasta:', payload.exp * 1000 > Date.now() ? 'Sí' : 'No');
} catch (error) {
  console.error('❌ Error al decodificar token:', error);
}

console.log('🔄 Recarga la página para que los cambios tomen efecto');