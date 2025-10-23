const express = require('express');
const mongoose = require('mongoose');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Esquema simple para transacciones
const transaccionSchema = new mongoose.Schema({
  from: String,
  to: String,
  amount: Number,
  type: String,
  description: String,
  status: { type: String, default: 'pending' },
  txHash: String,
  chainId: String,
  network: String
}, { timestamps: true });

const TransaccionSimple = mongoose.model('TransaccionSimple', transaccionSchema);

// Crear transacción simple
router.post('/crear', auth, async (req, res) => {
  try {
    console.log('🔵 POST /transacciones-simples/crear');
    console.log('🔵 User:', req.user);
    console.log('🔵 Body:', req.body);

    const { to, amount, type, description, chainId, network } = req.body;

    // Validaciones básicas
    if (!to || !amount || !type) {
      console.log('❌ Faltan campos');
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }

    // Crear transacción simple
    const transaccion = new TransaccionSimple({
      from: req.user.userId,
      to: to,
      amount: parseFloat(amount),
      type: type,
      description: description || '',
      status: 'pending',
      chainId: chainId || '',
      network: network || ''
    });

    await transaccion.save();
    console.log('✅ Transacción simple creada:', transaccion._id);

    res.json({
      success: true,
      transaction: transaccion
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Confirmar transacción
router.put('/confirmar/:id', auth, async (req, res) => {
  try {
    console.log('🔵 PUT /transacciones-simples/confirmar');
    
    const { txHash, chainId, network } = req.body;
    const transaccion = await TransaccionSimple.findById(req.params.id);

    if (!transaccion) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }

    transaccion.status = 'completed';
    transaccion.txHash = txHash;
    if (chainId) transaccion.chainId = chainId;
    if (network) transaccion.network = network;
    await transaccion.save();

    console.log('✅ Transacción confirmada:', transaccion._id);

    res.json({
      success: true,
      transaction: transaccion
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Cancelar transacción
router.put('/cancelar/:id', auth, async (req, res) => {
  try {
    console.log('🔵 PUT /transacciones-simples/cancelar');
    
    const transaccion = await TransaccionSimple.findById(req.params.id);

    if (!transaccion) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }

    transaccion.status = 'cancelled';
    await transaccion.save();

    console.log('✅ Transacción cancelada:', transaccion._id);

    res.json({
      success: true,
      transaction: transaccion
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Obtener detalles de una transacción específica
router.get('/detalle/:id', auth, async (req, res) => {
  try {
    console.log('🔵 GET /transacciones-simples/detalle/:id');
    
    const { id } = req.params;
    const transaccion = await TransaccionSimple.findById(id);

    if (!transaccion) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }

    // Verificar que el usuario tiene acceso a esta transacción
    if (transaccion.from !== req.user.userId && transaccion.to !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta transacción'
      });
    }

    console.log('✅ Transacción encontrada:', transaccion._id);

    res.json({
      success: true,
      transaction: transaccion
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Obtener transacciones del usuario
router.get('/mis-transacciones', auth, async (req, res) => {
  try {
    console.log('🔵 GET /transacciones-simples/mis-transacciones');
    
    const transacciones = await TransaccionSimple.find({
      $or: [
        { from: req.user.userId },
        { to: req.user.userId }
      ]
    }).sort({ createdAt: -1 });

    console.log('✅ Transacciones encontradas:', transacciones.length);

    res.json({
      success: true,
      transactions: transacciones
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