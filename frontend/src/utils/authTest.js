// Utilidad para probar la autenticación
export const testAuth = () => {
  const token = localStorage.getItem('authToken');
  console.log('🔍 Token actual:', token ? 'Existe' : 'No existe');
  
  if (token) {
    try {
      // Decodificar el token (sin verificar la firma)
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('📋 Payload del token:', payload);
      console.log('⏰ Expira en:', new Date(payload.exp * 1000));
      console.log('🕐 Tiempo actual:', new Date());
      console.log('✅ Token válido:', payload.exp * 1000 > Date.now());
    } catch (error) {
      console.error('❌ Error al decodificar token:', error);
    }
  }
};

export const clearAuth = () => {
  localStorage.removeItem('authToken');
  console.log('🧹 Token eliminado');
};

export const setTestToken = (userId, role, walletAddress) => {
  // Solo para testing - NO usar en producción
  const testPayload = {
    userId,
    role,
    walletAddress,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 horas
  };
  
  const testToken = btoa(JSON.stringify(testPayload));
  localStorage.setItem('authToken', `test.${testToken}.test`);
  console.log('🧪 Token de prueba establecido');
};