// 🔧 CONFIGURACIÓN CENTRALIZADA
// Este archivo centraliza todas las configuraciones del proyecto

const config = {
  // 🌍 Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEBUG: process.env.DEBUG === 'true',
  
  // 🖥️ Server
  PORT: parseInt(process.env.PORT) || 5000,
  BACKEND_URL: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
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
  
  // 🌐 CORS Origins
  CORS_ORIGINS: [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ].filter(Boolean), // Remove undefined values
  
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