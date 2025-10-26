// 🔧 CONFIGURACIÓN CENTRALIZADA
// Este archivo centraliza todas las configuraciones del proyecto

// 🔍 Auto-detect environment
const detectEnvironment = () => {
  // Codespaces
  if (process.env.CODESPACE_NAME) {
    return {
      type: 'codespaces',
      name: process.env.CODESPACE_NAME,
      backendUrl: `https://${process.env.CODESPACE_NAME}-5000.app.github.dev`,
      frontendUrl: `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`
    }
  }
  
  // Render
  if (process.env.RENDER_SERVICE_NAME || process.env.RENDER) {
    return {
      type: 'render',
      name: process.env.RENDER_SERVICE_NAME,
      backendUrl: process.env.RENDER_EXTERNAL_URL || `https://${process.env.RENDER_SERVICE_NAME}.onrender.com`,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    }
  }
  
  // Railway
  if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_NAME) {
    return {
      type: 'railway',
      name: process.env.RAILWAY_PROJECT_NAME,
      backendUrl: process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : `http://localhost:${process.env.PORT || 5000}`,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    }
  }
  
  // Heroku
  if (process.env.DYNO || process.env.HEROKU_APP_NAME) {
    return {
      type: 'heroku',
      name: process.env.HEROKU_APP_NAME,
      backendUrl: `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    }
  }
  
  // Vercel (usually frontend only, but could be used for API)
  if (process.env.VERCEL || process.env.VERCEL_URL) {
    return {
      type: 'vercel',
      name: process.env.VERCEL_PROJECT_NAME,
      backendUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT || 5000}`,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    }
  }
  
  // Netlify
  if (process.env.NETLIFY || process.env.DEPLOY_URL) {
    return {
      type: 'netlify',
      name: process.env.SITE_NAME,
      backendUrl: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`,
      frontendUrl: process.env.DEPLOY_URL || process.env.URL || 'http://localhost:3000'
    }
  }
  
  // Production (generic cloud)
  if (process.env.NODE_ENV === 'production') {
    return {
      type: 'production',
      name: 'cloud',
      backendUrl: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    }
  }
  
  // Local development
  return {
    type: 'local',
    name: 'localhost',
    backendUrl: `http://localhost:${process.env.PORT || 5000}`,
    frontendUrl: 'http://localhost:3000'
  }
}

const environment = detectEnvironment()

const config = {
  // 🌍 Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEBUG: process.env.DEBUG === 'true',
  ENVIRONMENT: environment,
  
  // 🖥️ Server
  PORT: parseInt(process.env.PORT) || 5000,
  BACKEND_URL: process.env.BACKEND_URL || environment.backendUrl,
  FRONTEND_URL: process.env.FRONTEND_URL || environment.frontendUrl,
  
  // 🗄️ Database
  MONGODB_URI: process.env.MONGODB_URI,
  
  // 🔐 JWT
  JWT: {
    SECRET: process.env.JWT_SECRET || 'fallback_secret_key',
    EXPIRE: process.env.JWT_EXPIRE || '7d'
  },
  
  // ☁️ Cloudinary
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    API_KEY: process.env.CLOUDINARY_API_KEY,
    API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CONFIGURED: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
  },
  
  // 🔗 Blockchain
  BLOCKCHAIN: {
    ETHEREUM_RPC: process.env.ETHEREUM_RPC_URL,
    HOLESKY_RPC: process.env.HOLESKY_RPC_URL,
    SEPOLIA_RPC: process.env.SEPOLIA_RPC_URL,
    HOODI_RPC: process.env.HOODI_RPC_URL
  },
  
  // 🛡️ Security
  SECURITY: {
    RATE_LIMIT: {
      WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
      MAX_REQUESTS_DEV: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_DEV) || 1000,
      MAX_REQUESTS_PROD: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_PROD) || 100
    }
  },
  
  // 🌐 CORS Origins - Dynamic based on environment
  CORS_ORIGINS: (() => {
    const origins = [
      // Explicit environment variables
      process.env.FRONTEND_URL,
      
      // Local development
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      
      // Auto-detected environment URLs
      environment.frontendUrl
    ]
    
    // Add environment-specific origins
    switch (environment.type) {
      case 'codespaces':
        origins.push(
          `https://${environment.name}-3000.app.github.dev`,
          `https://${environment.name}-5173.app.github.dev`,
          // Permitir cualquier codespace de github.dev
          'https://*.app.github.dev'
        )
        // Agregar patrón wildcard para todos los codespaces
        origins.push(/^https:\/\/.*\.app\.github\.dev$/)
        break
      case 'render':
        // Render apps usually have predictable URLs
        if (environment.name) {
          origins.push(`https://${environment.name}.onrender.com`)
        }
        break
      case 'railway':
        // Railway generates random domains, rely on FRONTEND_URL
        break
      case 'heroku':
        if (environment.name) {
          origins.push(`https://${environment.name}.herokuapp.com`)
        }
        break
      case 'vercel':
        // Vercel has multiple possible URLs
        origins.push(
          `https://${environment.name}.vercel.app`,
          `https://${environment.name}-git-main.vercel.app`
        )
        break
      case 'netlify':
        if (environment.name) {
          origins.push(`https://${environment.name}.netlify.app`)
        }
        break
    }
    
    return origins.filter(Boolean) // Remove undefined values
  })(),
  
  // 📧 Email (opcional)
  EMAIL: {
    SERVICE: process.env.EMAIL_SERVICE,
    USER: process.env.EMAIL_USER,
    PASS: process.env.EMAIL_PASS,
    CONFIGURED: !!(process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS)
  },
  
  // 🔴 Redis (opcional)
  REDIS: {
    URL: process.env.REDIS_URL,
    CONFIGURED: !!process.env.REDIS_URL
  },
  
  // 📊 Monitoring (opcional)
  MONITORING: {
    SENTRY_DSN: process.env.SENTRY_DSN,
    ANALYTICS_ID: process.env.ANALYTICS_ID
  },
  
  // 🚀 Deployment helpers
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test'
}

// 🔍 Validación de configuraciones críticas
const validateConfig = () => {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing)
    process.exit(1)
  }
  
  // Warnings para configuraciones opcionales pero recomendadas
  if (!config.CLOUDINARY.CONFIGURED) {
    console.warn('⚠️ Cloudinary not configured - image uploads will not work')
  }
  
  if (config.IS_PRODUCTION && config.JWT.SECRET === 'fallback_secret_key') {
    console.error('❌ Using fallback JWT secret in production!')
    process.exit(1)
  }
}

// Ejecutar validación al importar
validateConfig()

module.exports = config