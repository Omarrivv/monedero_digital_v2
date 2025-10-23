const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const { auth, requireRole, requirePadre, requireHijo, requireComercio } = require('../middleware/auth');
const { upload, uploadProfileImage, uploadProductImages, uploadMultipleImages, handleUploadErrors } = require('../middleware/upload');

const router = express.Router();

// Obtener perfil del comercio
router.get('/profile', auth, async (req, res) => {
  try {
    if (req.user.role !== 'comercio') {
      return res.status(403).json({ 
        message: 'Solo disponible para comercios' 
      });
    }

    const comercio = await User.findById(req.user.userId)
      .select('-password');

    if (!comercio) {
      return res.status(404).json({ 
        message: 'Comercio no encontrado' 
      });
    }

    // Obtener estadísticas básicas
    const [totalProducts, totalSales, totalRevenue] = await Promise.all([
      Product.countDocuments({ comercio: req.user.userId, isActive: true }),
      Transaction.countDocuments({ to: req.user.userId, type: 'payment', status: 'completed' }),
      Transaction.aggregate([
        {
          $match: {
            to: req.user.userId,
            type: 'payment',
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      comercio: {
        ...comercio.toObject(),
        stats: {
          totalProducts,
          totalSales,
          totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener perfil de comercio:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Actualizar perfil del comercio
router.put('/profile', auth, uploadProfileImage, async (req, res) => {
  try {
    if (req.user.role !== 'comercio') {
      return res.status(403).json({ 
        message: 'Solo disponible para comercios' 
      });
    }

    const { name, businessCategory, description, address, phone } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (businessCategory) updateData.businessCategory = businessCategory;
    if (description) updateData.description = description;
    if (address) updateData.address = address;
    if (phone) updateData.phone = phone;

    // Si se subió una nueva imagen de perfil
    if (req.file) {
      updateData.profileImage = req.file.path;
    }

    const comercio = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true }
    ).select('-password');

    if (!comercio) {
      return res.status(404).json({ 
        message: 'Comercio no encontrado' 
      });
    }

    res.json({
      success: true,
      comercio
    });

  } catch (error) {
    console.error('Error al actualizar perfil de comercio:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener ventas del comercio
router.get('/sales', auth, async (req, res) => {
  try {
    if (req.user.role !== 'comercio') {
      return res.status(403).json({ 
        message: 'Solo disponible para comercios' 
      });
    }

    const { page = 1, limit = 10, status, dateFrom, dateTo } = req.query;

    let query = {
      to: req.user.userId,
      type: 'payment'
    };

    if (status) {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const sales = await Transaction.find(query)
      .populate('from', 'name walletAddress')
      .populate('product', 'name price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      sales,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener estadísticas de ventas
router.get('/sales/stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'comercio') {
      return res.status(403).json({ 
        message: 'Solo disponible para comercios' 
      });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Ventas por período
    const [dailySales, weeklySales, monthlySales] = await Promise.all([
      Transaction.aggregate([
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
            count: { $sum: 1 },
            revenue: { $sum: '$amount' }
          }
        }
      ]),
      Transaction.aggregate([
        {
          $match: {
            to: req.user.userId,
            type: 'payment',
            status: 'completed',
            createdAt: { $gte: startOfWeek }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: '$amount' }
          }
        }
      ]),
      Transaction.aggregate([
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
            count: { $sum: 1 },
            revenue: { $sum: '$amount' }
          }
        }
      ])
    ]);

    // Productos más vendidos
    const topProducts = await Transaction.aggregate([
      {
        $match: {
          to: req.user.userId,
          type: 'payment',
          status: 'completed',
          product: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$product',
          count: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      {
        $unwind: '$product'
      }
    ]);

    const stats = {
      daily: {
        sales: dailySales.length > 0 ? dailySales[0].count : 0,
        revenue: dailySales.length > 0 ? dailySales[0].revenue : 0
      },
      weekly: {
        sales: weeklySales.length > 0 ? weeklySales[0].count : 0,
        revenue: weeklySales.length > 0 ? weeklySales[0].revenue : 0
      },
      monthly: {
        sales: monthlySales.length > 0 ? monthlySales[0].count : 0,
        revenue: monthlySales.length > 0 ? monthlySales[0].revenue : 0
      },
      topProducts
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de ventas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener productos del comercio
router.get('/products', auth, async (req, res) => {
  try {
    if (req.user.role !== 'comercio') {
      return res.status(403).json({ 
        message: 'Solo disponible para comercios' 
      });
    }

    const { page = 1, limit = 10, category, isActive, search } = req.query;

    let query = { comercio: req.user.userId };

    if (category) {
      query.category = category;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      success: true,
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Error al obtener productos del comercio:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Crear nuevo producto
router.post('/products', auth, uploadProductImages, async (req, res) => {
  try {
    if (req.user.role !== 'comercio') {
      return res.status(403).json({ 
        message: 'Solo disponible para comercios' 
      });
    }

    const { name, description, price, category, stock } = req.body;

    if (!name || !price) {
      return res.status(400).json({ 
        message: 'Nombre y precio son requeridos' 
      });
    }

    if (parseFloat(price) <= 0) {
      return res.status(400).json({ 
        message: 'El precio debe ser mayor a 0' 
      });
    }

    // Procesar imágenes subidas
    const images = req.files ? req.files.map(file => file.path) : [];

    const product = new Product({
      name,
      description: description || '',
      price: parseFloat(price),
      category: category || 'general',
      stock: parseInt(stock) || 0,
      images,
      comercio: req.user.userId,
      isActive: true
    });

    await product.save();

    res.status(201).json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Actualizar producto
router.put('/products/:productId', auth, uploadProductImages, async (req, res) => {
  try {
    if (req.user.role !== 'comercio') {
      return res.status(403).json({ 
        message: 'Solo disponible para comercios' 
      });
    }

    const { productId } = req.params;
    const { name, description, price, category, stock, isActive } = req.body;

    // Verificar que el producto pertenece al comercio
    const product = await Product.findOne({
      _id: productId,
      comercio: req.user.userId
    });

    if (!product) {
      return res.status(404).json({ 
        message: 'Producto no encontrado' 
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price) {
      const parsedPrice = parseFloat(price);
      if (parsedPrice <= 0) {
        return res.status(400).json({ 
          message: 'El precio debe ser mayor a 0' 
        });
      }
      updateData.price = parsedPrice;
    }
    if (category) updateData.category = category;
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (isActive !== undefined) updateData.isActive = isActive === 'true';

    // Procesar nuevas imágenes
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      updateData.images = [...product.images, ...newImages];
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      product: updatedProduct
    });

  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Eliminar producto
router.delete('/products/:productId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'comercio') {
      return res.status(403).json({ 
        message: 'Solo disponible para comercios' 
      });
    }

    const { productId } = req.params;

    const product = await Product.findOne({
      _id: productId,
      comercio: req.user.userId
    });

    if (!product) {
      return res.status(404).json({ 
        message: 'Producto no encontrado' 
      });
    }

    // Soft delete
    product.isActive = false;
    product.deletedAt = new Date();
    await product.save();

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener categorías de productos del comercio
router.get('/categories', auth, async (req, res) => {
  try {
    if (req.user.role !== 'comercio') {
      return res.status(403).json({ 
        message: 'Solo disponible para comercios' 
      });
    }

    const categories = await Product.distinct('category', { 
      comercio: req.user.userId,
      isActive: true 
    });

    res.json({
      success: true,
      categories: categories.filter(cat => cat && cat.trim() !== '')
    });

  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener transacciones pendientes
router.get('/pending-transactions', auth, async (req, res) => {
  try {
    if (req.user.role !== 'comercio') {
      return res.status(403).json({ 
        message: 'Solo disponible para comercios' 
      });
    }

    const pendingTransactions = await Transaction.find({
      to: req.user.userId,
      status: 'pending'
    })
    .populate('from', 'name walletAddress')
    .populate('product', 'name price')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json({
      success: true,
      transactions: pendingTransactions
    });

  } catch (error) {
    console.error('Error al obtener transacciones pendientes:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Aceptar/rechazar transacción
router.put('/transactions/:transactionId/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'comercio') {
      return res.status(403).json({ 
        message: 'Solo disponible para comercios' 
      });
    }

    const { transactionId } = req.params;
    const { status, reason } = req.body;

    if (!['completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        message: 'Estado inválido. Debe ser "completed" o "cancelled"' 
      });
    }

    const transaction = await Transaction.findOne({
      _id: transactionId,
      to: req.user.userId,
      status: 'pending'
    });

    if (!transaction) {
      return res.status(404).json({ 
        message: 'Transacción no encontrada o ya procesada' 
      });
    }

    transaction.status = status;
    if (status === 'completed') {
      transaction.completedAt = new Date();
    } else {
      transaction.cancelledAt = new Date();
      transaction.cancelReason = reason || 'Cancelado por el comercio';
    }

    await transaction.save();

    await transaction.populate('from', 'name walletAddress');
    await transaction.populate('product', 'name price');

    res.json({
      success: true,
      transaction
    });

  } catch (error) {
    console.error('Error al actualizar estado de transacción:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    if (req.user.role !== 'comercio') {
      return res.status(403).json({ 
        message: 'Solo disponible para comercios' 
      });
    }

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Obtener datos del dashboard
    const [
      totalProducts,
      activeProducts,
      pendingTransactions,
      todaySales,
      monthSales,
      recentTransactions
    ] = await Promise.all([
      Product.countDocuments({ comercio: req.user.userId }),
      Product.countDocuments({ comercio: req.user.userId, isActive: true }),
      Transaction.countDocuments({ to: req.user.userId, status: 'pending' }),
      Transaction.aggregate([
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
            count: { $sum: 1 },
            revenue: { $sum: '$amount' }
          }
        }
      ]),
      Transaction.aggregate([
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
            count: { $sum: 1 },
            revenue: { $sum: '$amount' }
          }
        }
      ]),
      Transaction.find({
        to: req.user.userId,
        type: 'payment'
      })
      .populate('from', 'name walletAddress')
      .populate('product', 'name price')
      .sort({ createdAt: -1 })
      .limit(5)
    ]);

    const dashboardData = {
      products: {
        total: totalProducts,
        active: activeProducts
      },
      transactions: {
        pending: pendingTransactions,
        recent: recentTransactions
      },
      sales: {
        today: {
          count: todaySales.length > 0 ? todaySales[0].count : 0,
          revenue: todaySales.length > 0 ? todaySales[0].revenue : 0
        },
        month: {
          count: monthSales.length > 0 ? monthSales[0].count : 0,
          revenue: monthSales.length > 0 ? monthSales[0].revenue : 0
        }
      }
    };

    res.json({
      success: true,
      dashboard: dashboardData
    });

  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;