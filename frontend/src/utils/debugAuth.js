// Utilidad para debug de autenticación

export const debugAuth = () => {
  console.log('🔍 DEBUG AUTH - Estado actual:')
  
  const authToken = localStorage.getItem('authToken')
  const token = localStorage.getItem('token')
  
  console.log('📋 Tokens en localStorage:')
  console.log('  - authToken:', authToken ? `${authToken.substring(0, 20)}...` : 'No encontrado')
  console.log('  - token:', token ? `${token.substring(0, 20)}...` : 'No encontrado')
  
  // Verificar si el token es válido (básico)
  if (authToken) {
    try {
      const payload = JSON.parse(atob(authToken.split('.')[1]))
      console.log('🔓 Payload del token:')
      console.log('  - userId:', payload.userId)
      console.log('  - exp:', new Date(payload.exp * 1000))
      console.log('  - iat:', new Date(payload.iat * 1000))
      console.log('  - Expirado:', Date.now() > payload.exp * 1000)
    } catch (e) {
      console.log('❌ Token inválido o malformado')
    }
  }
  
  // Verificar cookies
  console.log('🍪 Cookies:', document.cookie)
  
  return {
    authToken,
    token,
    hasValidToken: !!authToken
  }
}

export const clearAllTokens = () => {
  console.log('🧹 Limpiando todos los tokens...')
  localStorage.removeItem('authToken')
  localStorage.removeItem('token')
  sessionStorage.clear()
  console.log('✅ Tokens limpiados')
}

export const setDebugToken = (token) => {
  console.log('🔧 Estableciendo token de debug...')
  localStorage.setItem('authToken', token)
  console.log('✅ Token establecido')
}