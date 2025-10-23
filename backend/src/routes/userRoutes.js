const express = require('express');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const { auth, requireRole, requirePadre, requireHijo, requireComercio } = require('../middleware/auth');
const { upload, uploadProfileImage, uploadSingleImage, handleUploadErrors } = require('../middleware/upload');

const router = express.Router();

// Obtener todos los hijos de un padre
router.get('/children', auth, async (req, res) => {
  try {
    if (req.user.role !== 'padre') {
      return res.status(403).json({ 
        message: 'Solo los padres pueden ver sus hijos' 
      });
    }

    // Buscar hijos por parent ID incluyendo spendingLimits
    const children = await User.find({ 
      parent: req.user.userId,
      role: 'hijo' 
    }).select('-password');
    
    // Si no encuentra por parent ID, buscar por walletAddress del padre (fallback)
    let finalChildren = children;
    
    if (children.length === 0) {
      const childrenByWallet = await User.find({ 
        role: 'hijo' 
      }).populate('parent', 'walletAddress').select('-password');
      
      finalChildren = childrenByWallet.filter(child => 
        child.parent && child.parent.walletAddress === req.user.walletAddress
      );
    }

    res.json({
      success: true,
      children: finalChildren
    });

  } catch (error) {
    console.error('Error al obtener hijos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Registrar un hijo
router.post('/register-child', auth, async (req, res) => {
  try {
    if (req.user.role !== 'padre') {
      return res.status(403).json({ 
        message: 'Solo los padres pueden registrar hijos' 
      });
    }

    const { name, walletAddress, age, allowance } = req.body;

    // Verificar si ya existe un usuario con esa wallet
    let existingUser = await User.findOne({ walletAddress });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Ya existe un usuario con esta wallet address' 
      });
    }

    // Crear hijo
    const child = new User({
      name,
      walletAddress,
      role: 'hijo',
      parent: req.user.userId,
      age,
      allowance: allowance || 0,
      isActive: true
    });

    await child.save();

    // Actualizar la lista de hijos del padre
    await User.findByIdAndUpdate(
      req.user.userId,
      { $push: { children: child._id } }
    );

    res.status(201).json({
      success: true,
      child: {
        id: child._id,
        name: child.name,
        walletAddress: child.walletAddress,
        age: child.age,
        allowance: child.allowance
      }
    });

  } catch (error) {
    console.error('Error al registrar hijo:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Establecer límites de gasto para un hijo
router.put('/set-limit/:childId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'padre') {
      return res.status(403).json({ 
        message: 'Solo los padres pueden establecer límites' 
      });
    }

    const { childId } = req.params;
    const { dailyLimit, weeklyLimit, monthlyLimit, categories } = req.body;

    // Verificar que el hijo pertenece al padre
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

    // Actualizar límites
    const updateData = {};
    if (dailyLimit !== undefined) updateData.dailyLimit = dailyLimit;
    if (weeklyLimit !== undefined) updateData.weeklyLimit = weeklyLimit;
    if (monthlyLimit !== undefined) updateData.monthlyLimit = monthlyLimit;
    if (categories) updateData.allowedCategories = categories;

    await User.findByIdAndUpdate(childId, updateData);

    res.json({
      success: true,
      message: 'Límites actualizados exitosamente'
    });

  } catch (error) {
    console.error('Error al establecer límites:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener comercios disponibles
router.get('/comercios', auth, async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = { role: 'comercio', isActive: true };

    if (category) {
      query.businessCategory = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { businessCategory: { $regex: search, $options: 'i' } }
      ];
    }

    const comercios = await User.find(query)
      .select('name businessCategory profileImage walletAddress')
      .limit(20);

    res.json({
      success: true,
      comercios
    });

  } catch (error) {
    console.error('Error al obtener comercios:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener productos de un comercio
router.get('/comercio/:comercioId/products', auth, async (req, res) => {
  try {
    const { comercioId } = req.params;

    const products = await Product.find({ 
      comercio: comercioId,
      isActive: true 
    }).populate('comercio', 'name businessCategory');

    res.json({
      success: true,
      products
    });

  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener historial de transacciones
router.get('/transactions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;

    let query = {};

    if (req.user.role === 'padre') {
      // Obtener transacciones del padre y sus hijos
      const children = await User.find({ 
        parent: req.user.userId 
      }).select('_id');
      const childrenIds = children.map(child => child._id);
      
      query.$or = [
        { from: req.user.userId },
        { to: req.user.userId },
        { from: { $in: childrenIds } },
        { to: { $in: childrenIds } }
      ];
    } else {
      // Para hijos y comercios, solo sus propias transacciones
      query.$or = [
        { from: req.user.userId },
        { to: req.user.userId }
      ];
    }

    if (type) {
      query.type = type;
    }

    const transactions = await Transaction.find(query)
      .populate('from', 'name role walletAddress')
      .populate('to', 'name role walletAddress')
      .populate('product', 'name price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });

  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Subir imagen de perfil
router.post('/upload-profile-image', auth, uploadProfileImage, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        message: 'No se subió ninguna imagen' 
      });
    }

    const imageUrl = req.file.path; // Cloudinary URL

    await User.findByIdAndUpdate(
      req.user.userId,
      { profileImage: imageUrl }
    );

    res.json({
      success: true,
      imageUrl
    });

  } catch (error) {
    console.error('Error al subir imagen:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener perfil del usuario
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error del servidor' 
    });
  }
});

// Actualizar perfil del usuario
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, telefono, apellido } = req.body;
    
    // Validar datos requeridos
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y email son requeridos'
      });
    }

    // Verificar si el email ya existe (excepto el usuario actual)
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: req.user.userId } 
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está en uso por otro usuario'
      });
    }

    // Preparar datos de actualización
    const updateData = { name, email };
    if (telefono) updateData.telefono = telefono;
    if (apellido) updateData.apellido = apellido;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error del servidor' 
    });
  }
});

// Actualizar foto de perfil
router.put('/profile/photo', auth, uploadProfileImage, handleUploadErrors, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'No se subió ninguna imagen' 
      });
    }

    let imageUrl;

    // Si multer ya subió a Cloudinary (CloudinaryStorage)
    if (req.file.path && !req.file.buffer) {
      console.log('✅ Imagen ya subida por CloudinaryStorage:', req.file.path);
      imageUrl = req.file.path;
    } else if (req.file.buffer) {
      // Si tenemos buffer (memoryStorage), subir manualmente a Cloudinary
      console.log('🚀 Subiendo buffer a Cloudinary...');
      
      // Convertir buffer a base64 para Cloudinary
      const base64String = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      // Subir a Cloudinary con configuración simple
      const { uploadImage } = require('../utils/cloudinary');
      const uploadResult = await uploadImage(base64String, {
        folder: 'monedero_digital/profile',
        transformation: [
          { width: 400, height: 400, crop: 'limit' },
          { quality: 'auto:good' }
        ],
        timeout: 60000
      });

      console.log('✅ Upload manual exitoso:', uploadResult.url);
      imageUrl = uploadResult.url;
    } else {
      // Si llegamos aquí, no hay ni path ni buffer
      console.log('❌ No se encontró ni path ni buffer en el archivo');
      return res.status(400).json({
        success: false,
        message: 'Archivo procesado incorrectamente'
      });
    }

    // Obtener usuario actual para eliminar imagen anterior si existe
    const currentUser = await User.findById(req.user.userId);
    const oldImageUrl = currentUser.profileImage;

    // Actualizar usuario con nueva imagen
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { profileImage: imageUrl },
      { new: true }
    ).select('-password');

    // Eliminar imagen anterior de Cloudinary si existe
    if (oldImageUrl && oldImageUrl.includes('cloudinary')) {
      try {
        const { deleteFromCloudinary } = require('../middleware/upload');
        await deleteFromCloudinary(oldImageUrl);
      } catch (deleteError) {
        console.error('Error al eliminar imagen anterior:', deleteError);
        // No fallar la operación si no se puede eliminar la imagen anterior
      }
    }

    res.json({
      success: true,
      message: 'Foto de perfil actualizada exitosamente',
      imageUrl,
      user: updatedUser
    });

  } catch (error) {
    console.error('Error al actualizar foto de perfil:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error del servidor' 
    });
  }
});

// Obtener estadísticas del usuario
router.get('/stats', auth, async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === 'padre') {
      // Estadísticas para padre
      const childrenCount = await User.countDocuments({ 
        parent: req.user.userId 
      });

      const totalTransactions = await Transaction.countDocuments({
        $or: [
          { from: req.user.userId },
          { to: req.user.userId }
        ]
      });

      stats = {
        childrenCount,
        totalTransactions,
        role: 'padre'
      };

    } else if (req.user.role === 'hijo') {
      // Estadísticas para hijo
      const totalTransactions = await Transaction.countDocuments({
        $or: [
          { from: req.user.userId },
          { to: req.user.userId }
        ]
      });

      const totalSpent = await Transaction.aggregate([
        { 
          $match: { 
            from: req.user.userId,
            type: 'payment'
          } 
        },
        { 
          $group: { 
            _id: null, 
            total: { $sum: '$amount' } 
          } 
        }
      ]);

      stats = {
        totalTransactions,
        totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0,
        role: 'hijo'
      };

    } else if (req.user.role === 'comercio') {
      // Estadísticas para comercio
      const totalProducts = await Product.countDocuments({ 
        comercio: req.user.userId 
      });

      const totalSales = await Transaction.countDocuments({
        to: req.user.userId,
        type: 'payment'
      });

      const totalRevenue = await Transaction.aggregate([
        { 
          $match: { 
            to: req.user.userId,
            type: 'payment'
          } 
        },
        { 
          $group: { 
            _id: null, 
            total: { $sum: '$amount' } 
          } 
        }
      ]);

      stats = {
        totalProducts,
        totalSales,
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
        role: 'comercio'
      };
    }

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;