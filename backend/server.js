// Load environment variables FIRST
const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/utils/database');
const path = require('path');

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
const PORT = process.env.PORT || 5000

// Connect to MongoDB
connectDB()

// Rate limiting - más permisivo en desarrollo
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 en desarrollo, 100 en producción
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
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