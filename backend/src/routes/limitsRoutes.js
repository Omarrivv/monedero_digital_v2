const express = require('express');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const SpendingLimit = require('../models/SpendingLimit');
const { auth, requireRole, requirePadre, requireHijo, requireComercio } = require('../middleware/auth');

const router = express.Router();

// ============================================
// NUEVAS RUTAS PARA LÍMITES CON FECHAS
// ============================================

// Crear un nuevo límite con fechas específicas
router.post('/create/:childId', auth, async (req, res) => {
  try {
    console.log('🔵 POST /limits/create/:childId - Iniciando');
    console.log('🔵 User:', req.user);
    console.log('🔵 Body:', req.body);
    console.log('🔵 ChildId:', req.params.childId);

    if (req.user.role !== 'padre') {
      console.log('❌ Usuario no es padre');
      return res.status(403).json({ 
        success: false,
        message: 'Solo los padres pueden crear límites' 
      });
    }

    const { childId } = req.params;
    const { tipo, monto, categoria, fechaInicio, fechaFin, descripcion } = req.body;

    // Verificar que el hijo pertenece al padre
    const child = await User.findOne({
      _id: childId,
      parent: req.user.userId,
      role: 'hijo'
    });

    if (!child) {
      console.log('❌ Hijo no encontrado');
      return res.status(404).json({ 
        success: false,
        message: 'Hijo no encontrado o no autorizado' 
      });
    }

    // Validar datos requeridos
    if (!tipo || !monto || !fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: tipo, monto, fechaInicio, fechaFin'
      });
    }

    // Crear el nuevo límite
    const nuevoLimite = new SpendingLimit({
      hijo: childId,
      tipo,
      monto: parseFloat(monto),
      categoria: categoria || 'general',
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
      descripcion: descripcion || '',
      activo: true,
      gastado: 0
    });

    await nuevoLimite.save();
    console.log('✅ Límite creado:', nuevoLimite);

    res.json({
      success: true,
      message: 'Límite creado exitosamente',
      limit: nuevoLimite
    });

  } catch (error) {
    console.error('❌ Error al crear límite:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error del servidor',
      error: error.message 
    });
  }
});

// Obtener todos los límites de un hijo
router.get('/list/:childId', auth, async (req, res) => {
  try {
    console.log('🔵 GET /limits/list/:childId - Iniciando');
    const { childId } = req.params;

    // Verificar permisos
    if (req.user.role === 'padre') {
      const child = await User.findOne({
        _id: childId,
        parent: req.user.userId
      });
      if (!child) {
        return res.status(404).json({ 
          success: false,
          message: 'Hijo no encontrado' 
        });
      }
    } else if (req.user.role === 'hijo') {
      if (childId !== req.user.userId) {
        return res.status(403).json({ 
          success: false,
          message: 'No tienes permiso para ver estos límites' 
        });
      }
    } else {
      return res.status(403).json({ 
        success: false,
        message: 'Acceso no autorizado' 
      });
    }

    // Obtener todos los límites del hijo
    const limites = await SpendingLimit.find({ hijo: childId })
      .sort({ fechaInicio: -1 });

    console.log('✅ Límites encontrados:', limites.length);

    res.json({
      success: true,
      limits: limites
    });

  } catch (error) {
    console.error('❌ Error al obtener límites:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error del servidor',
      error: error.message 
    });
  }
});

// Actualizar un límite existente
router.put('/update/:limitId', auth, async (req, res) => {
  try {
    console.log('🔵 PUT /limits/update/:limitId - Iniciando');
    
    if (req.user.role !== 'padre') {
      return res.status(403).json({ 
        success: false,
        message: 'Solo los padres pueden actualizar límites' 
      });
    }

    const { limitId } = req.params;
    const { tipo, monto, categoria, fechaInicio, fechaFin, descripcion, activo } = req.body;

    // Buscar el límite
    const limite = await SpendingLimit.findById(limitId);
    if (!limite) {
      return res.status(404).json({ 
        success: false,
        message: 'Límite no encontrado' 
      });
    }

    // Verificar que el hijo pertenece al padre
    const child = await User.findOne({
      _id: limite.hijo,
      parent: req.user.userId
    });

    if (!child) {
      return res.status(403).json({ 
        success: false,
        message: 'No autorizado para modificar este límite' 
      });
    }

    // Actualizar campos
    if (tipo !== undefined) limite.tipo = tipo;
    if (monto !== undefined) limite.monto = parseFloat(monto);
    if (categoria !== undefined) limite.categoria = categoria;
    if (fechaInicio !== undefined) limite.fechaInicio = new Date(fechaInicio);
    if (fechaFin !== undefined) limite.fechaFin = new Date(fechaFin);
    if (descripcion !== undefined) limite.descripcion = descripcion;
    if (activo !== undefined) limite.activo = activo;

    await limite.save();
    console.log('✅ Límite actualizado:', limite);

    res.json({
      success: true,
      message: 'Límite actualizado exitosamente',
      limit: limite
    });

  } catch (error) {
    console.error('❌ Error al actualizar límite:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error del servidor',
      error: error.message 
    });
  }
});

// Eliminar un límite
router.delete('/delete/:limitId', auth, async (req, res) => {
  try {
    console.log('🔵 DELETE /limits/delete/:limitId - Iniciando');
    
    if (req.user.role !== 'padre') {
      return res.status(403).json({ 
        success: false,
        message: 'Solo los padres pueden eliminar límites' 
      });
    }

    const { limitId } = req.params;

    // Buscar el límite
    const limite = await SpendingLimit.findById(limitId);
    if (!limite) {
      return res.status(404).json({ 
        success: false,
        message: 'Límite no encontrado' 
      });
    }

    // Verificar que el hijo pertenece al padre
    const child = await User.findOne({
      _id: limite.hijo,
      parent: req.user.userId
    });

    if (!child) {
      return res.status(403).json({ 
        success: false,
        message: 'No autorizado para eliminar este límite' 
      });
    }

    await SpendingLimit.findByIdAndDelete(limitId);
    console.log('✅ Límite eliminado');

    res.json({
      success: true,
      message: 'Límite eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error al eliminar límite:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error del servidor',
      error: error.message 
    });
  }
});

// ============================================
// RUTAS ANTIGUAS (mantener compatibilidad)
// ============================================

// Establecer límites para un hijo
router.put('/set/:childId', auth, async (req, res) => {
  try {
    console.log('🔵 PUT /limits/set/:childId - Iniciando')
    console.log('🔵 User:', req.user)
    console.log('🔵 Body:', req.body)
    console.log('🔵 ChildId:', req.params.childId)

    if (req.user.role !== 'padre') {
      console.log('❌ Usuario no es padre')
      return res.status(403).json({ 
        message: 'Solo los padres pueden establecer límites' 
      });
    }

    const { childId } = req.params;
    const { 
      dailyLimit, 
      weeklyLimit, 
      monthlyLimit, 
      allowedCategories,
      allowedCommerces,
      timeRestrictions 
    } = req.body;

    // Verificar que el hijo pertenece al padre
    const child = await User.findOne({
      _id: childId,
      parent: req.user.userId,
      role: 'hijo'
    });

    if (!child) {
      return res.status(404).json({ 
        message: 'Hijo no encontrado o no autorizado' 
      });
    }

    // Validar límites
    if (dailyLimit && dailyLimit < 0) {
      return res.status(400).json({ 
        message: 'El límite diario debe ser mayor o igual a 0' 
      });
    }

    if (weeklyLimit && weeklyLimit < 0) {
      return res.status(400).json({ 
        message: 'El límite semanal debe ser mayor o igual a 0' 
      });
    }

    if (monthlyLimit && monthlyLimit < 0) {
      return res.status(400).json({ 
        message: 'El límite mensual debe ser mayor o igual a 0' 
      });
    }

    // Actualizar límites
    const updateData = {};
    
    if (dailyLimit !== undefined) updateData.dailyLimit = dailyLimit;
    if (weeklyLimit !== undefined) updateData.weeklyLimit = weeklyLimit;
    if (monthlyLimit !== undefined) updateData.monthlyLimit = monthlyLimit;
    if (allowedCategories) updateData.allowedCategories = allowedCategories;
    if (allowedCommerces) updateData.allowedCommerces = allowedCommerces;
    if (timeRestrictions) updateData.timeRestrictions = timeRestrictions;

    updateData.limitsUpdatedAt = new Date();

    console.log('🔵 Update data:', updateData)

    const updatedChild = await User.findByIdAndUpdate(
      childId, 
      updateData,
      { new: true }
    ).select('-password');

    console.log('✅ Hijo actualizado:', updatedChild)

    res.json({
      success: true,
      message: 'Límites actualizados exitosamente',
      child: updatedChild
    });

  } catch (error) {
    console.error('Error al establecer límites:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener límites de un hijo
router.get('/:childId', auth, async (req, res) => {
  try {
    const { childId } = req.params;

    // Verificar permisos
    let query = { _id: childId };
    
    if (req.user.role === 'padre') {
      query.parent = req.user.userId;
    } else if (req.user.role === 'hijo') {
      // Los hijos solo pueden ver sus propios límites
      if (childId !== req.user.userId) {
        return res.status(403).json({ 
          message: 'No tienes permiso para ver estos límites' 
        });
      }
    } else {
      return res.status(403).json({ 
        message: 'Acceso no autorizado' 
      });
    }

    const child = await User.findOne(query)
      .select('name dailyLimit weeklyLimit monthlyLimit allowedCategories allowedCommerces timeRestrictions limitsUpdatedAt');

    if (!child) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }

    res.json({
      success: true,
      limits: {
        childId: child._id,
        name: child.name,
        dailyLimit: child.dailyLimit || 0,
        weeklyLimit: child.weeklyLimit || 0,
        monthlyLimit: child.monthlyLimit || 0,
        allowedCategories: child.allowedCategories || [],
        allowedCommerces: child.allowedCommerces || [],
        timeRestrictions: child.timeRestrictions || {},
        updatedAt: child.limitsUpdatedAt
      }
    });

  } catch (error) {
    console.error('Error al obtener límites:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Verificar si una transacción está dentro de los límites
router.post('/check', auth, async (req, res) => {
  try {
    const { amount, category, commerceId } = req.body;

    if (req.user.role !== 'hijo') {
      return res.status(403).json({ 
        message: 'Solo disponible para hijos' 
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        message: 'Usuario no encontrado' 
      });
    }

    const checks = {
      isAllowed: true,
      violations: [],
      remainingLimits: {}
    };

    // Verificar límite diario
    if (user.dailyLimit && user.dailyLimit > 0) {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
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

      const totalSpentToday = dailySpent.length > 0 ? dailySpent[0].total : 0;
      const remainingDaily = user.dailyLimit - totalSpentToday;

      checks.remainingLimits.daily = remainingDaily;

      if ((totalSpentToday + amount) > user.dailyLimit) {
        checks.isAllowed = false;
        checks.violations.push({
          type: 'dailyLimit',
          limit: user.dailyLimit,
          current: totalSpentToday,
          attempted: amount,
          message: `Excede el límite diario de $${user.dailyLimit}`
        });
      }
    }

    // Verificar límite semanal
    if (user.weeklyLimit && user.weeklyLimit > 0) {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

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

      const totalSpentThisWeek = weeklySpent.length > 0 ? weeklySpent[0].total : 0;
      const remainingWeekly = user.weeklyLimit - totalSpentThisWeek;

      checks.remainingLimits.weekly = remainingWeekly;

      if ((totalSpentThisWeek + amount) > user.weeklyLimit) {
        checks.isAllowed = false;
        checks.violations.push({
          type: 'weeklyLimit',
          limit: user.weeklyLimit,
          current: totalSpentThisWeek,
          attempted: amount,
          message: `Excede el límite semanal de $${user.weeklyLimit}`
        });
      }
    }

    // Verificar límite mensual
    if (user.monthlyLimit && user.monthlyLimit > 0) {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

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

      const totalSpentThisMonth = monthlySpent.length > 0 ? monthlySpent[0].total : 0;
      const remainingMonthly = user.monthlyLimit - totalSpentThisMonth;

      checks.remainingLimits.monthly = remainingMonthly;

      if ((totalSpentThisMonth + amount) > user.monthlyLimit) {
        checks.isAllowed = false;
        checks.violations.push({
          type: 'monthlyLimit',
          limit: user.monthlyLimit,
          current: totalSpentThisMonth,
          attempted: amount,
          message: `Excede el límite mensual de $${user.monthlyLimit}`
        });
      }
    }

    // Verificar categorías permitidas
    if (user.allowedCategories && user.allowedCategories.length > 0 && category) {
      if (!user.allowedCategories.includes(category)) {
        checks.isAllowed = false;
        checks.violations.push({
          type: 'categoryRestriction',
          category,
          allowedCategories: user.allowedCategories,
          message: `La categoría "${category}" no está permitida`
        });
      }
    }

    // Verificar comercios permitidos
    if (user.allowedCommerces && user.allowedCommerces.length > 0 && commerceId) {
      if (!user.allowedCommerces.includes(commerceId)) {
        checks.isAllowed = false;
        checks.violations.push({
          type: 'commerceRestriction',
          commerceId,
          allowedCommerces: user.allowedCommerces,
          message: 'Este comercio no está en la lista de comercios permitidos'
        });
      }
    }

    // Verificar restricciones de tiempo
    if (user.timeRestrictions && Object.keys(user.timeRestrictions).length > 0) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.getDay(); // 0 = domingo, 1 = lunes, etc.

      const timeRestrictions = user.timeRestrictions;

      if (timeRestrictions.allowedHours) {
        const { start, end } = timeRestrictions.allowedHours;
        if (currentHour < start || currentHour > end) {
          checks.isAllowed = false;
          checks.violations.push({
            type: 'timeRestriction',
            currentHour,
            allowedHours: timeRestrictions.allowedHours,
            message: `Solo se permiten compras entre las ${start}:00 y ${end}:00`
          });
        }
      }

      if (timeRestrictions.allowedDays) {
        if (!timeRestrictions.allowedDays.includes(currentDay)) {
          const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
          checks.isAllowed = false;
          checks.violations.push({
            type: 'dayRestriction',
            currentDay: dayNames[currentDay],
            allowedDays: timeRestrictions.allowedDays.map(d => dayNames[d]),
            message: 'No se permiten compras en este día de la semana'
          });
        }
      }
    }

    res.json({
      success: true,
      checks
    });

  } catch (error) {
    console.error('Error al verificar límites:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener resumen de gastos vs límites
router.get('/summary/:childId', auth, async (req, res) => {
  try {
    const { childId } = req.params;

    // Verificar permisos
    if (req.user.role === 'padre') {
      const child = await User.findOne({
        _id: childId,
        parent: req.user.userId
      });
      if (!child) {
        return res.status(404).json({ message: 'Hijo no encontrado' });
      }
    } else if (req.user.role === 'hijo') {
      if (childId !== req.user.userId) {
        return res.status(403).json({ message: 'Acceso no autorizado' });
      }
    } else {
      return res.status(403).json({ message: 'Acceso no autorizado' });
    }

    const user = await User.findById(childId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const today = new Date();
    
    // Calcular fechas de inicio
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Obtener gastos por período
    const [dailySpent, weeklySpent, monthlySpent] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            from: childId,
            type: 'payment',
            status: 'completed',
            createdAt: { $gte: startOfDay }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        {
          $match: {
            from: childId,
            type: 'payment',
            status: 'completed',
            createdAt: { $gte: startOfWeek }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        {
          $match: {
            from: childId,
            type: 'payment',
            status: 'completed',
            createdAt: { $gte: startOfMonth }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const summary = {
      daily: {
        spent: dailySpent.length > 0 ? dailySpent[0].total : 0,
        limit: user.dailyLimit || 0,
        remaining: Math.max(0, (user.dailyLimit || 0) - (dailySpent.length > 0 ? dailySpent[0].total : 0))
      },
      weekly: {
        spent: weeklySpent.length > 0 ? weeklySpent[0].total : 0,
        limit: user.weeklyLimit || 0,
        remaining: Math.max(0, (user.weeklyLimit || 0) - (weeklySpent.length > 0 ? weeklySpent[0].total : 0))
      },
      monthly: {
        spent: monthlySpent.length > 0 ? monthlySpent[0].total : 0,
        limit: user.monthlyLimit || 0,
        remaining: Math.max(0, (user.monthlyLimit || 0) - (monthlySpent.length > 0 ? monthlySpent[0].total : 0))
      }
    };

    // Calcular porcentajes
    summary.daily.percentage = summary.daily.limit > 0 ? 
      Math.round((summary.daily.spent / summary.daily.limit) * 100) : 0;
    summary.weekly.percentage = summary.weekly.limit > 0 ? 
      Math.round((summary.weekly.spent / summary.weekly.limit) * 100) : 0;
    summary.monthly.percentage = summary.monthly.limit > 0 ? 
      Math.round((summary.monthly.spent / summary.monthly.limit) * 100) : 0;

    res.json({
      success: true,
      summary,
      restrictions: {
        allowedCategories: user.allowedCategories || [],
        allowedCommerces: user.allowedCommerces || [],
        timeRestrictions: user.timeRestrictions || {}
      }
    });

  } catch (error) {
    console.error('Error al obtener resumen de límites:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Remover límites
router.delete('/:childId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'padre') {
      return res.status(403).json({ 
        message: 'Solo los padres pueden remover límites' 
      });
    }

    const { childId } = req.params;

    const child = await User.findOne({
      _id: childId,
      parent: req.user.userId,
      role: 'hijo'
    });

    if (!child) {
      return res.status(404).json({ 
        message: 'Hijo no encontrado' 
      });
    }

    await User.findByIdAndUpdate(childId, {
      $unset: {
        dailyLimit: 1,
        weeklyLimit: 1,
        monthlyLimit: 1,
        allowedCategories: 1,
        allowedCommerces: 1,
        timeRestrictions: 1
      }
    });

    res.json({
      success: true,
      message: 'Límites removidos exitosamente'
    });

  } catch (error) {
    console.error('Error al remover límites:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;