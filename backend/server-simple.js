// 🔧 SERVIDOR SIMPLE - SIN COMPLICACIONES
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./src/utils/database');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const productRoutes = require('./src/routes/productRoutes');
const limitesNuevos = require('./src/routes/limitesNuevos');
const limitesSimples = require('./src/routes/limitesSimples');
const transaccionesSimples = require('./src/routes/transaccionesSimples');
const uploadSimple = require('./src/routes/uploadSimple');
const comercioRoutes = require('./src/routes/comercioRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy para cloud
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// Middleware básico
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// CORS temporal hasta que funcione el proxy
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve temporary images
app.use("/temp-images", express.static(path.join(__dirname, "temp-images")));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Monedero Digital API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Monedero Digital API',
    version: '2.0.0',
    status: 'running'
  });
});

// Endpoint para que el frontend obtenga las URLs del .env
app.get('/config', (req, res) => {
  res.json({
    BACKEND_URL: process.env.BACKEND_URL || `http://localhost:${PORT}`,
    API_URL: `${process.env.BACKEND_URL || `http://localhost:${PORT}`}/api`
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/limites', limitesNuevos);
app.use('/api/limites-simples', limitesSimples);
app.use('/api/transacciones-simples', transaccionesSimples);
app.use('/api/upload', uploadSimple);
app.use('/api/comercio', comercioRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
});