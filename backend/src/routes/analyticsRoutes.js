const express = require('express');
const { auth } = require('../middleware/auth');
const router = express.Router();

// 📊 GET /analytics - Ruta básica funcional
router.get('/', auth, async (req, res) => {
  try {
    const { period = 'mes' } = req.query;
    
    console.log('📊 Analytics solicitado para período:', period);
    
    // Respuesta básica funcional
    const analytics = {
      success: true,
      period,
      resumen: {
        totalGastado: 0,
        totalRecibido: 0,
        numeroTransacciones: 0,
        saldoNeto: 0
      },
      categorias: {},
      limites: {
        totalAsignado: 0,
        totalGastado: 0,
        porcentajeUsado: 0
      },
      transaccionesPorDia: {},
      transaccionesRecientes: []
    };
    
    console.log('✅ Analytics enviado exitosamente');
    res.json(analytics);
    
  } catch (error) {
    console.error('❌ Error en analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener analytics',
      error: error.message
    });
  }
});

// 📊 GET /analytics/dashboard - Dashboard básico
router.get('/dashboard', auth, async (req, res) => {
  try {
    const dashboard = {
      success: true,
      transaccionesRecientes: 0,
      limitesActivos: 0,
      gastosMes: 0,
      ingresosMes: 0
    };
    
    res.json(dashboard);
  } catch (error) {
    console.error('❌ Error en dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener dashboard',
      error: error.message
    });
  }
});

module.exports = router;