// 🔧 Load environment variables FIRST
const dotenv = require('dotenv');
dotenv.config({ path: '../.env' }); // Usar .env del directorio raíz

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// 📋 Import centralized configuration
const config = require('./src/config');
const connectDB = require('./src/utils/database');

// Import routes AFTER loading environment variables
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const productRoutes = require('./src/routes/productRoutes');
const limitsRoutes = require('./src/routes/limitsRoutes');
const limitesNuevos = require('./src/routes/limitesNuevos');
const limitesSimples = require('./src/routes/limitesSimples');
const transaccionesSimples = require('./src/routes/transaccionesSimples');
const uploadSimple = require('./src/routes/uploadSimple');
const comercioRoutes = require('./src/routes/comercioRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');

const app = express()
const PORT = config.PORT

// 📊 Log configuration on startup
console.log('🚀 Starting Monedero Digital Backend...')
console.log('📋 Configuration:')
console.log(`   Environment: ${config.NODE_ENV}`)
console.log(`   Port: ${PORT}`)
console.log(`   Frontend URL: ${config.FRONTEND_URL}`)
console.log(`   Backend URL: ${config.BACKEND_URL}`)
console.log(`   MongoDB: ${config.MONGODB_URI ? '✅ Configured' : '❌ Missing'}`)
console.log(`   Cloudinary: ${config.CLOUDINARY.CONFIGURED ? '✅ Configured' : '❌ Missing'}`)
console.log(`   Debug Mode: ${config.DEBUG ? '✅ Enabled' : '❌ Disabled'}`)

// Connect to MongoDB
connectDB()

// 🚦 Rate Limiting - Dynamic configuration
const limiter = rateLimit({
  windowMs: config.SECURITY.RATE_LIMIT.WINDOW_MS,
  max: config.IS_PRODUCTION 
    ? config.SECURITY.RATE_LIMIT.MAX_REQUESTS_PROD
    : config.SECURITY.RATE_LIMIT.MAX_REQUESTS_DEV,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(config.SECURITY.RATE_LIMIT.WINDOW_MS / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health'
  }
})

// 🛡️ Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}))

// 🌐 CORS Configuration - Dynamic for development and production
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = config.CORS_ORIGINS

    // En desarrollo, ser más permisivo
    if (config.IS_DEVELOPMENT) {
      // Permitir localhost con cualquier puerto
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true)
      }
    }

    // Permitir requests sin origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`)
      console.log(`✅ Allowed origins:`, allowedOrigins)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400 // 24 hours
}

app.use(cors(corsOptions))
app.use(morgan('combined'))
// Aplicar rate limiting solo en producción para ciertos endpoints
if (process.env.NODE_ENV === 'production') {
  app.use(limiter)
} else {
  // En desarrollo, rate limiting muy permisivo
  const devLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 10000, // 10000 requests por minuto en desarrollo
    message: 'Too many requests from this IP, please try again later.'
  })
  app.use(devLimiter)
}
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve temporary images in development
app.use('/temp-images', express.static(path.join(__dirname, 'temp-images')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Monedero Digital API is running',
    timestamp: new Date().toISOString()
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/products', productRoutes)
app.use('/api/limits', limitsRoutes)
app.use('/api/limites', limitesNuevos)
app.use('/api/limites-simples', limitesSimples)
app.use('/api/transacciones-simples', transaccionesSimples)
app.use('/api/upload-simple', uploadSimple)
app.use('/api/comercio', comercioRoutes)
app.use('/api/upload', uploadRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// 404 handler
app.use('*', (req, res) => {
  console.log(`❌ Route not found: ${req.method} ${req.originalUrl}`)
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
})