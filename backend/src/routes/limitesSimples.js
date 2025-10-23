const express = require('express');
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Esquema simple para límites
const limiteSchema = new mongoose.Schema({
  hijoId: String,
  fecha: Date,
  monto: Number,
  categoria: { type: String, default: 'general' },
  gastado: { type: Number, default: 0 },
  activo: { type: Boolean, default: true },
  descripcion: String
}, { timestamps: true });

const LimiteSimple = mongoose.model('LimiteSimple', limiteSchema);

// Crear límite
router.post('/crear/:hijoId', auth, async (req, res) => {
  try {
    console.log('🔵 Creando límite simple');
    console.log('🔵 HijoId:', req.params.hijoId);
    console.log('🔵 Body:', req.body);

    const { hijoId } = req.params;
    const { fecha, monto, categoria, descripcion } = req.body;

    const nuevoLimite = new LimiteSimple({
      hijoId: hijoId,
      fecha: new Date(fecha),
      monto: parseFloat(monto),
      categoria: categoria || 'general',
      descripcion: descripcion || '',
      gastado: 0,
      activo: true
    });

    await nuevoLimite.save();
    console.log('✅ Límite simple creado:', nuevoLimite._id);

    res.json({
      success: true,
      message: 'Límite creado exitosamente',
      limite: nuevoLimite
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Obtener límites
router.get('/hijo/:hijoId', auth, async (req, res) => {
  try {
    console.log('🔵 Obteniendo límites simples para:', req.params.hijoId);

    const limites = await LimiteSimple.find({ 
      hijoId: req.params.hijoId 
    }).sort({ fecha: -1 });

    console.log('✅ Límites encontrados:', limites.length);

    res.json({
      success: true,
      limites: limites
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Eliminar límite
router.delete('/eliminar/:limiteId', auth, async (req, res) => {
  try {
    console.log('🔵 Eliminando límite:', req.params.limiteId);

    await LimiteSimple.findByIdAndDelete(req.params.limiteId);
    console.log('✅ Límite eliminado');

    res.json({
      success: true,
      message: 'Límite eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;