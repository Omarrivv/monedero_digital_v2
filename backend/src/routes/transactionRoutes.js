const express = require('express');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Product = require('../models/Product');
const { auth, requireRole, requirePadre, requireHijo, requireComercio } = require('../middleware/auth');

const router = express.Router();

// Crear una nueva transacción
router.post('/create', auth, async (req, res) => {
  try {
    console.log('🔵 POST /transactions/create - Iniciando');
    console.log('🔵 User:', req.user);
    console.log('🔵 Body:', req.body);

    const { to, amount, type, productId, description } = req.body;

    // Validaciones básicas
    if (!to || !amount || !type) {
      console.log('❌ Faltan campos requeridos:', { to, amount, type });
      return res.status(400).json({ 
        success: false,
        message: 'Faltan campos requeridos' 
      });
    }

    if (amount <= 0) {
      console.log('❌ Monto inválido:', amount);
      return res.status(400).json({ 
        success: false,
        message: 'El monto debe ser mayor a 0' 
      });
    }

    // Verificar que el destinatario existe
    console.log('🔍 Buscando destinatario:', to);
    const recipient = await User.findById(to);
    if (!recipient) {
      console.log('❌ Destinatario no encontrado:', to);
      return res.status(404).json({ 
        success: false,
        message: 'Destinatario no encontrado' 
      });
    }

    console.log('✅ Destinatario encontrado:', recipient.name, recipient.role);

    // Validaciones específicas por tipo de transacción
    if (type === 'transfer') {
      console.log('🔍 Validando transferencia...');
      
      // Solo padres pueden hacer transferencias a hijos
      if (req.user.role !== 'padre') {
        console.log('❌ Usuario no es padre:', req.user.role);
        return res.status(403).json({ 
          success: false,
          message: 'Solo los padres pueden transferir fondos' 
        });
      }

      // Verificar que el destinatario es hijo del padre
      console.log('🔍 Verificando relación padre-hijo...');
      console.log('Recipient parent:', recipient.parent?.toString());
      console.log('User ID:', req.user.userId);
      
      if (!recipient.parent || recipient.parent.toString() !== req.user.userId) {
        console.log('❌ El destinatario no es hijo del padre');
        return res.status(403).json({ 
          success: false,
          message: 'Solo puedes transferir a tus hijos' 
        });
      }

      console.log('✅ Validación de transferencia exitosa');

    } else if (type === 'payment') {
      // Solo hijos pueden hacer pagos a comercios
      if (req.user.role !== 'hijo') {
        return res.status(403).json({ 
          message: 'Solo los hijos pueden realizar pagos' 
        });
      }

      // Verificar que el destinatario es un comercio
      if (recipient.role !== 'comercio') {
        return res.status(403).json({ 
          message: 'Solo puedes pagar a comercios' 
        });
      }

      // Verificar límites de gasto del hijo
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const dailySpent = await Transaction.aggregate([
        {
          $match: {
            from: req.user.userId,
            type: 'payment',
            createdAt: { $gte: startOfDay }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const totalSpentToday = dailySpent.length > 0 ? dailySpent[0].total : 0;
      const user = await User.findById(req.user.userId);

      if (user.dailyLimit && (totalSpentToday + amount) > user.dailyLimit) {
        return res.status(403).json({ 
          message: 'Excede el límite diario de gasto' 
        });
      }
    }

    // Crear la transacción
    console.log('📝 Creando transacción en BD...');
    const transaction = new Transaction({
      from: req.user.userId,
      to,
      amount,
      type,
      product: productId || null,
      description: description || '',
      status: 'pending'
    });

    console.log('💾 Guardando transacción...');
    await transaction.save();
    console.log('✅ Transacción guardada con ID:', transaction._id);

    // Poblar los datos para la respuesta
    await transaction.populate('from', 'name walletAddress');
    await transaction.populate('to', 'name walletAddress');
    if (productId) {
      await transaction.populate('product', 'name price');
    }

    console.log('✅ Transacción creada exitosamente');
    res.status(201).json({
      success: true,
      transaction
    });

  } catch (error) {
    console.error('❌ Error al crear transacción:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      success: false,
      message: 'Error del servidor',
      error: error.message 
    });
  }
});

// Confirmar una transacción (cambiar estado a completed)
router.put('/confirm/:transactionId', auth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { txHash } = req.body;

    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ 
        message: 'Transacción no encontrada' 
      });
    }

    // Verificar que el usuario tiene permiso para confirmar
    if (transaction.from.toString() !== req.user.userId && 
        transaction.to.toString() !== req.user.userId) {
      return res.status(403).json({ 
        message: 'No tienes permiso para confirmar esta transacción' 
      });
    }

    // Actualizar estado
    transaction.status = 'completed';
    transaction.txHash = txHash;
    transaction.completedAt = new Date();

    await transaction.save();

    await transaction.populate('from', 'name walletAddress');
    await transaction.populate('to', 'name walletAddress');
    await transaction.populate('product', 'name price');

    res.json({
      success: true,
      transaction
    });

  } catch (error) {
    console.error('Error al confirmar transacción:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Cancelar una transacción
router.put('/cancel/:transactionId', auth, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ 
        message: 'Transacción no encontrada' 
      });
    }

    // Verificar que el usuario tiene permiso para cancelar
    if (transaction.from.toString() !== req.user.userId) {
      return res.status(403).json({ 
        message: 'Solo el remitente puede cancelar la transacción' 
      });
    }

    // Solo se pueden cancelar transacciones pendientes
    if (transaction.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Solo se pueden cancelar transacciones pendientes' 
      });
    }

    transaction.status = 'cancelled';
    transaction.cancelledAt = new Date();

    await transaction.save();

    res.json({
      success: true,
      transaction
    });

  } catch (error) {
    console.error('Error al cancelar transacción:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener transacciones del usuario
router.get('/my-transactions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;

    let query = {
      $or: [
        { from: req.user.userId },
        { to: req.user.userId }
      ]
    };

    if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .populate('from', 'name role walletAddress')
      .populate('to', 'name role walletAddress')
      .populate('product', 'name price description')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener detalles de una transacción específica
router.get('/:transactionId', auth, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId)
      .populate('from', 'name role walletAddress')
      .populate('to', 'name role walletAddress')
      .populate('product', 'name price description images');

    if (!transaction) {
      return res.status(404).json({ 
        message: 'Transacción no encontrada' 
      });
    }

    // Verificar que el usuario tiene permiso para ver la transacción
    if (transaction.from._id.toString() !== req.user.userId && 
        transaction.to._id.toString() !== req.user.userId) {
      return res.status(403).json({ 
        message: 'No tienes permiso para ver esta transacción' 
      });
    }

    res.json({
      success: true,
      transaction
    });

  } catch (error) {
    console.error('Error al obtener transacción:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener resumen de gastos (para hijos)
router.get('/spending/summary', auth, async (req, res) => {
  try {
    if (req.user.role !== 'hijo') {
      return res.status(403).json({ 
        message: 'Solo disponible para hijos' 
      });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Gasto diario
    const dailySpent = await Transaction.aggregate([
      {
        $match: {
          from: req.user.userId,
          type: 'payment',
          status: 'completed',
          createdAt: { $gte: startOfDay }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Gasto semanal
    const weeklySpent = await Transaction.aggregate([
      {
        $match: {
          from: req.user.userId,
          type: 'payment',
          status: 'completed',
          createdAt: { $gte: startOfWeek }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Gasto mensual
    const monthlySpent = await Transaction.aggregate([
      {
        $match: {
          from: req.user.userId,
          type: 'payment',
          status: 'completed',
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Obtener límites del usuario
    const user = await User.findById(req.user.userId);

    res.json({
      success: true,
      summary: {
        daily: {
          spent: dailySpent.length > 0 ? dailySpent[0].total : 0,
          limit: user.dailyLimit || 0
        },
        weekly: {
          spent: weeklySpent.length > 0 ? weeklySpent[0].total : 0,
          limit: user.weeklyLimit || 0
        },
        monthly: {
          spent: monthlySpent.length > 0 ? monthlySpent[0].total : 0,
          limit: user.monthlyLimit || 0
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener resumen de gastos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener ingresos (para comercios)
router.get('/income/summary', auth, async (req, res) => {
  try {
    if (req.user.role !== 'comercio') {
      return res.status(403).json({ 
        message: 'Solo disponible para comercios' 
      });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Ingresos diarios
    const dailyIncome = await Transaction.aggregate([
      {
        $match: {
          to: req.user.userId,
          type: 'payment',
          status: 'completed',
          createdAt: { $gte: startOfDay }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Ingresos mensuales
    const monthlyIncome = await Transaction.aggregate([
      {
        $match: {
          to: req.user.userId,
          type: 'payment',
          status: 'completed',
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      summary: {
        daily: {
          income: dailyIncome.length > 0 ? dailyIncome[0].total : 0,
          sales: dailyIncome.length > 0 ? dailyIncome[0].count : 0
        },
        monthly: {
          income: monthlyIncome.length > 0 ? monthlyIncome[0].total : 0,
          sales: monthlyIncome.length > 0 ? monthlyIncome[0].count : 0
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener resumen de ingresos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;