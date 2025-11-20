const express = require('express');
const Product = require('../models/Product');
const User = require('../models/User');
const { auth, requireRole, requirePadre, requireHijo, requireComercio } = require('../middleware/auth');
const { upload, uploadProductImages, uploadMultipleImages, handleUploadErrors } = require('../middleware/upload');

const router = express.Router();

// Crear un nuevo producto (solo comercios)
router.post('/create', auth, uploadProductImages, async (req, res) => {
  try {
    if (req.user.role !== 'comercio') {
      return res.status(403).json({
        message: 'Solo los comercios pueden crear productos'
      });
    }

    const { name, description, price, category, stock } = req.body;

    // Validaciones básicas
    if (!name || !price) {
      return res.status(400).json({
        message: 'Nombre y precio son requeridos'
      });
    }

    if (price <= 0) {
      return res.status(400).json({
        message: 'El precio debe ser mayor a 0'
      });
    }

    // Procesar imágenes subidas
    const images = req.files ? req.files.map(file => file.path) : [];

    // Crear producto
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

    // Poblar datos del comercio
    await product.populate('comercio', 'name businessCategory');

    res.status(201).json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener todos los productos (con filtros)
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      comercio,
      search,
      minPrice,
      maxPrice,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Construir query
    let query = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (comercio) {
      query.comercio = comercio;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Construir sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .populate('comercio', 'name businessCategory profileImage')
      .sort(sort)
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
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener productos de mi comercio
router.get('/my-products', auth, async (req, res) => {
  try {
    if (req.user.role !== 'comercio') {
      return res.status(403).json({
        message: 'Solo los comercios pueden ver sus productos'
      });
    }

    const { page = 1, limit = 10, category, isActive } = req.query;

    let query = { comercio: req.user.userId };

    if (category) {
      query.category = category;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
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
    console.error('Error al obtener mis productos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener un producto específico
router.get('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId)
      .populate('comercio', 'name businessCategory profileImage walletAddress');

    if (!product) {
      return res.status(404).json({
        message: 'Producto no encontrado'
      });
    }

    if (!product.isActive) {
      return res.status(404).json({
        message: 'Producto no disponible'
      });
    }

    res.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Actualizar un producto
router.put('/:productId', auth, uploadProductImages, async (req, res) => {
  try {
    if (req.user.role !== 'comercio') {
      return res.status(403).json({
        message: 'Solo los comercios pueden actualizar productos'
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

    // Construir datos de actualización
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

    // Procesar nuevas imágenes si se subieron
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      updateData.images = [...product.images, ...newImages];
    }

    updateData.updatedAt = new Date();

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    ).populate('comercio', 'name businessCategory');

    res.json({
      success: true,
      product: updatedProduct
    });

  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Eliminar una imagen de producto
router.delete('/:productId/images/:imageIndex', auth, async (req, res) => {
  try {
    if (req.user.role !== 'comercio') {
      return res.status(403).json({
        message: 'Solo los comercios pueden eliminar imágenes'
      });
    }

    const { productId, imageIndex } = req.params;

    const product = await Product.findOne({
      _id: productId,
      comercio: req.user.userId
    });

    if (!product) {
      return res.status(404).json({
        message: 'Producto no encontrado'
      });
    }

    const index = parseInt(imageIndex);
    if (index < 0 || index >= product.images.length) {
      return res.status(400).json({
        message: 'Índice de imagen inválido'
      });
    }

    // Eliminar imagen del array
    product.images.splice(index, 1);
    await product.save();

    res.json({
      success: true,
      message: 'Imagen eliminada exitosamente',
      images: product.images
    });

  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Eliminar un producto (soft delete)
router.delete('/:productId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'comercio') {
      return res.status(403).json({
        message: 'Solo los comercios pueden eliminar productos'
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

    // Soft delete - marcar como inactivo
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

// Obtener categorías disponibles
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });

    res.json({
      success: true,
      categories: categories.filter(cat => cat && cat.trim() !== '')
    });

  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Buscar productos por nombre
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        message: 'La búsqueda debe tener al menos 2 caracteres'
      });
    }

    const products = await Product.find({
      isActive: true,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } }
      ]
    })
      .populate('comercio', 'name businessCategory')
      .limit(parseInt(limit))
      .sort({ name: 1 });

    res.json({
      success: true,
      products
    });

  } catch (error) {
    console.error('Error en búsqueda de productos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// Obtener productos destacados/populares
router.get('/featured/list', async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    // Por ahora, devolvemos productos aleatorios
    // En el futuro se podría implementar un sistema de popularidad
    const products = await Product.aggregate([
      { $match: { isActive: true } },
      { $sample: { size: parseInt(limit) } }
    ]);

    // Poblar datos del comercio
    await Product.populate(products, {
      path: 'comercio',
      select: 'name businessCategory profileImage'
    });

    res.json({
      success: true,
      products
    });

  } catch (error) {
    console.error('Error al obtener productos destacados:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;