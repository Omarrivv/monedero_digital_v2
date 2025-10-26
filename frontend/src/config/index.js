// 🔧 CONFIGURACIÓN DEL FRONTEND
// Este archivo maneja las variables de entorno del frontend

const config = {
  // 🌍 Environment
  NODE_ENV: import.meta.env.MODE || 'development',
  
  // 🖥️ API Configuration
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
  
  // 🔗 Blockchain
  ETHEREUM_RPC: import.meta.env.VITE_ETHEREUM_RPC_URL || 'https://ethereum.publicnode.com',
  HOLESKY_RPC: import.meta.env.VITE_HOLESKY_RPC_URL || 'https://ethereum-holesky.publicnode.com',
  SEPOLIA_RPC: import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://ethereum-sepolia.publicnode.com',
  HOODI_RPC: import.meta.env.VITE_HOODI_RPC_URL || 'https://hoodi.drpc.org',
  
  // 📊 Analytics (opcional)
  ANALYTICS_ID: import.meta.env.VITE_ANALYTICS_ID,
  
  // 🚀 Deployment helpers
  IS_PRODUCTION: import.meta.env.MODE === 'production',
  IS_DEVELOPMENT: import.meta.env.MODE === 'development',
  
  // 🔧 Debug
  DEBUG: import.meta.env.VITE_DEBUG === 'true' || import.meta.env.MODE === 'development'
}

// 📊 Log configuration in development
if (config.IS_DEVELOPMENT) {
  console.log('🎨 Frontend Configuration:')
  console.log('   Environment:', config.NODE_ENV)
  console.log('   API URL:', config.API_BASE_URL)
  console.log('   Backend URL:', config.BACKEND_URL)
  console.log('   Debug Mode:', config.DEBUG)
}

export default config