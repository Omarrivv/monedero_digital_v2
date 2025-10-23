const express = require('express');
const Limite = require('../models/Limite');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Crear un nuevo límite
router.post('/crear/:hijoId', auth, async (req, res) => {
  try {
    console.log('🔵 POST /limites/crear - Iniciando');
    console.log('🔵 User role:', req.user.role);
    console.log('🔵 HijoId:', req.params.hijoId);
    console.log('🔵 Body:', req.body);

    // Verificar que es padre
    if (req.user.role !== 'padre') {
      return res.status(403).json({
        success: false,
        message: 'Solo los padres pueden crear límites'
      });
    }

    const { hijoId } = req.params;
    const { fecha, monto, categoria, descripcion } = req.body;

    // Validar datos requeridos
    if (!fecha || !monto) {
      return res.status(400).json({
        success: false,
        message: 'Fecha y monto son requeridos'
      });
    }

    // Verificar que el hijo pertenece al padre
    const hijo = await User.findOne({
      _id: hijoId,
      parent: req.user.userId,
      role: 'hijo'
    });

    if (!hijo) {
      return res.status(404).json({
        success: false,
        message: 'Hijo no encontrado o no autorizado'
      });
    }

    // Verificar si ya existe un límite para esa fecha
    const fechaObj = new Date(fecha);
    const limiteExistente = await Limite.obtenerPorFecha(hijoId, fechaObj);
    
    if (limiteExistente.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un límite para esta fecha'
      });
    }

    // Crear el nuevo límite
    const nuevoLimite = new Limite({
      hijoId: hijoId,
      fecha: fechaObj,
      monto: parseFloat(monto),
      categoria: categoria || 'general',
      descripcion: descripcion || '',
      gastado: 0,
      activo: true
    });

    await nuevoLimite.save();
    console.log('✅ Límite creado:', nuevoLimite);

    res.json({
      success: true,
      message: 'Límite creado exitosamente',
      limite: nuevoLimite
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

// Obtener límites de un hijo
router.get('/hijo/:hijoId', auth, async (req, res) => {
  try {
    console.log('🔵 GET /limites/hijo - Iniciando');
    const { hijoId } = req.params;

    // Verificar permisos
    if (req.user.role === 'padre') {
      const hijo = await User.findOne({
        _id: hijoId,
        parent: req.user.userId
      });
      if (!hijo) {
        return res.status(404).json({
          success: false,
          message: 'Hijo no encontrado'
        });
      }
    } else if (req.user.role === 'hijo') {
      if (hijoId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'No autorizado'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Acceso no autorizado'
      });
    }

    // Obtener todos los límites del hijo
    const limites = await Limite.find({ hijoId: hijoId })
      .sort({ fecha: -1 });

    console.log('✅ Límites encontrados:', limites.length);

    res.json({
      success: true,
      limites: limites
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

// Obtener límites por fecha específica
router.get('/hijo/:hijoId/fecha/:fecha', auth, async (req, res) => {
  try {
    const { hijoId, fecha } = req.params;

    // Verificar permisos (mismo código que arriba)
    if (req.user.role === 'padre') {
      const hijo = await User.findOne({
        _id: hijoId,
        parent: req.user.userId
      });
      if (!hijo) {
        return res.status(404).json({
          success: false,
          message: 'Hijo no encontrado'
        });
      }
    } else if (req.user.role === 'hijo') {
      if (hijoId !== req.user.userId) {
        return res.status(403).json({
          success: false,
          message: 'No autorizado'
        });
      }
    }

    const limites = await Limite.obtenerPorFecha(hijoId, new Date(fecha));

    res.json({
      success: true,
      limites: limites
    });

  } catch (error) {
    console.error('❌ Error al obtener límites por fecha:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
});

// Actualizar un límite
router.put('/actualizar/:limiteId', auth, async (req, res) => {
  try {
    console.log('🔵 PUT /limites/actualizar - Iniciando');
    
    if (req.user.role !== 'padre') {
      return res.status(403).json({
        success: false,
        message: 'Solo los padres pueden actualizar límites'
      });
    }

    const { limiteId } = req.params;
    const { monto, categoria, descripcion, activo } = req.body;

    const limite = await Limite.findById(limiteId);
    if (!limite) {
      return res.status(404).json({
        success: false,
        message: 'Límite no encontrado'
      });
    }

    // Verificar que el hijo pertenece al padre
    const hijo = await User.findOne({
      _id: limite.hijoId,
      parent: req.user.userId
    });

    if (!hijo) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }

    // Actualizar campos
    if (monto !== undefined) limite.monto = parseFloat(monto);
    if (categoria !== undefined) limite.categoria = categoria;
    if (descripcion !== undefined) limite.descripcion = descripcion;
    if (activo !== undefined) limite.activo = activo;

    await limite.save();
    console.log('✅ Límite actualizado:', limite);

    res.json({
      success: true,
      message: 'Límite actualizado exitosamente',
      limite: limite
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
router.delete('/eliminar/:limiteId', auth, async (req, res) => {
  try {
    console.log('🔵 DELETE /limites/eliminar - Iniciando');
    
    if (req.user.role !== 'padre') {
      return res.status(403).json({
        success: false,
        message: 'Solo los padres pueden eliminar límites'
      });
    }

    const { limiteId } = req.params;

    const limite = await Limite.findById(limiteId);
    if (!limite) {
      return res.status(404).json({
        success: false,
        message: 'Límite no encontrado'
      });
    }

    // Verificar que el hijo pertenece al padre
    const hijo = await User.findOne({
      _id: limite.hijoId,
      parent: req.user.userId
    });

    if (!hijo) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }

    await Limite.findByIdAndDelete(limiteId);
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

module.exports = router;