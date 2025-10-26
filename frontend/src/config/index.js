// 🔧 CONFIGURACIÓN DEL FRONTEND
// Este archivo maneja las variables de entorno del frontend

// 🔍 Auto-detect frontend environment
const detectFrontendEnvironment = () => {
  const hostname = window.location.hostname
  const protocol = window.location.protocol
  
  // Codespaces
  if (hostname.includes('app.github.dev')) {
    const codespaceName = hostname.split('-')[0]
    return {
      type: 'codespaces',
      name: codespaceName,
      backendUrl: `https://${codespaceName}-5000.app.github.dev`,
      apiUrl: `https://${codespaceName}-5000.app.github.dev/api`
    }
  }
  
  // Vercel
  if (hostname.includes('vercel.app')) {
    return {
      type: 'vercel',
      name: hostname.split('.')[0],
      backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    }
  }
  
  // Netlify
  if (hostname.includes('netlify.app')) {
    return {
      type: 'netlify',
      name: hostname.split('.')[0],
      backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    }
  }
  
  // Render
  if (hostname.includes('onrender.com')) {
    return {
      type: 'render',
      name: hostname.split('.')[0],
      backendUrl: `${protocol}//${hostname}`,
      apiUrl: `${protocol}//${hostname}/api`
    }
  }
  
  // Railway
  if (hostname.includes('up.railway.app')) {
    return {
      type: 'railway',
      name: hostname.split('.')[0],
      backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    }
  }
  
  // Heroku
  if (hostname.includes('herokuapp.com')) {
    return {
      type: 'heroku',
      name: hostname.split('.')[0],
      backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    }
  }
  
  // Production (custom domain)
  if (import.meta.env.MODE === 'production') {
    return {
      type: 'production',
      name: hostname,
      backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    }
  }
  
  // Local development
  return {
    type: 'local',
    name: 'localhost',
    backendUrl: 'http://localhost:5000',
    apiUrl: 'http://localhost:5000/api'
  }
}

const environment = detectFrontendEnvironment()

const config = {
  // 🌍 Environment
  NODE_ENV: import.meta.env.MODE || 'development',
  ENVIRONMENT: environment,
  
  // 🖥️ API Configuration
  API_BASE_URL: import.meta.env.VITE_API_URL || environment.apiUrl,
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || environment.backendUrl,
  
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
  console.log('   Platform:', `${environment.type} (${environment.name})`)
  console.log('   API URL:', config.API_BASE_URL)
  console.log('   Backend URL:', config.BACKEND_URL)
  console.log('   Debug Mode:', config.DEBUG)
  console.log('   Current URL:', window.location.href)
}

export default config