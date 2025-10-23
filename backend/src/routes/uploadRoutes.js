const express = require('express');
const { auth, requireRole, requirePadre, requireHijo, requireComercio } = require('../middleware/auth');
const { uploadSingleImage, uploadMultipleImages, handleUploadErrors } = require('../middleware/upload');
const { uploadImage, deleteImage } = require('../utils/cloudinary');

const router = express.Router();

// Endpoint de diagnóstico simple
router.get('/health', (req, res) => {
  try {
    const { isConfigured } = require('../utils/cloudinary');
    
    res.json({
      success: true,
      message: 'Upload service is running',
      timestamp: new Date().toISOString(),
      cloudinary: {
        configured: isConfigured(),
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
        api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
        api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Upload service error',
      error: error.message
    });
  }
});

// Subir una sola imagen (ruta estándar)
router.post('/single', auth, uploadSingleImage, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se subió ninguna imagen'
      });
    }

    res.json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: {
        url: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });

  } catch (error) {
    console.error('Error al subir imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al subir imagen'
    });
  }
});

// Alias para compatibilidad con frontend
router.post('/image', auth, uploadSingleImage, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se subió ninguna imagen'
      });
    }

    res.json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: {
        url: req.file.path,
        publicId: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });

  } catch (error) {
    console.error('Error al subir imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al subir imagen'
    });
  }
});

// Test endpoint para verificar Cloudinary
router.get('/test-cloudinary', async (req, res) => {
  try {
    const { cloudinary, isConfigured } = require('../utils/cloudinary');
    
    console.log('🧪 Testing Cloudinary configuration...');
    
    const configStatus = {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'No configurado',
      api_key_set: !!process.env.CLOUDINARY_API_KEY,
      api_secret_set: !!process.env.CLOUDINARY_API_SECRET,
      is_configured: isConfigured()
    };

    console.log('📋 Config status:', configStatus);

    // Intentar hacer una llamada simple a la API de Cloudinary
    if (isConfigured()) {
      try {
        const pingResult = await cloudinary.api.ping();
        console.log('🏓 Cloudinary ping result:', pingResult);
        
        res.json({
          success: true,
          message: 'Cloudinary configurado y funcionando correctamente',
          config: configStatus,
          ping: pingResult
        });
      } catch (pingError) {
        console.error('❌ Cloudinary ping failed:', pingError);
        res.status(500).json({
          success: false,
          message: 'Cloudinary configurado pero no responde',
          config: configStatus,
          error: pingError.message
        });
      }
    } else {
      res.status(500).json({
        success: false,
        message: 'Cloudinary no está configurado correctamente',
        config: configStatus
      });
    }
  } catch (error) {
    console.error('❌ Error en test de Cloudinary:', error);
    res.status(500).json({
      success: false,
      message: 'Error en configuración de Cloudinary',
      error: error.message
    });
  }
});

// Test endpoint simple para subir imagen de prueba
router.post('/test-upload', async (req, res) => {
  try {
    const { uploadImage } = require('../utils/cloudinary');
    
    // Crear una imagen de prueba simple (1x1 pixel transparente PNG)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==';
    
    console.log('🧪 Testing image upload...');
    
    const result = await uploadImage(testImageBase64, {
      folder: 'monedero_digital/test',
      public_id: `test_${Date.now()}`
    });
    
    console.log('✅ Test upload successful:', result);
    
    res.json({
      success: true,
      message: 'Test de upload exitoso',
      data: result
    });
    
  } catch (error) {
    console.error('❌ Test upload failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test de upload falló',
      error: error.message
    });
  }
});

// Ruta para subir imágenes durante registro (sin autenticación) - CORREGIDA
router.post('/register-image', uploadSingleImage, async (req, res) => {
  try {
    console.log('🔍 Iniciando upload de register-image');
    console.log('📁 req.file:', req.file ? 'Archivo presente' : 'No file');
    
    // Verificar que se subió un archivo
    if (!req.file) {
      console.log('❌ No file encontrado');
      return res.status(400).json({
        success: false,
        message: 'No se subió ninguna imagen'
      });
    }

    console.log('📁 Procesando archivo:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path || 'No path',
      buffer: req.file.buffer ? 'Buffer presente' : 'No buffer'
    });

    // Si multer ya subió a Cloudinary (CloudinaryStorage)
    if (req.file.path && !req.file.buffer) {
      console.log('✅ Imagen ya subida por CloudinaryStorage:', req.file.path);
      
      res.json({
        success: true,
        message: 'Imagen subida exitosamente',
        data: {
          url: req.file.path,
          publicId: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size
        }
      });
      return;
    }

    // Si tenemos buffer (memoryStorage), subir manualmente a Cloudinary
    if (req.file.buffer) {
      console.log('🚀 Subiendo buffer a Cloudinary...');
      
      // Convertir buffer a base64 para Cloudinary
      const base64String = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      
      // Subir a Cloudinary con configuración simple
      const uploadResult = await uploadImage(base64String, {
        folder: 'monedero_digital/register',
        transformation: [
          { width: 400, height: 400, crop: 'limit' },
          { quality: 'auto:good' }
        ],
        timeout: 60000
      });

      console.log('✅ Upload manual exitoso:', uploadResult.url);

      res.json({
        success: true,
        message: 'Imagen subida exitosamente',
        data: {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          originalName: req.file.originalname,
          size: req.file.size,
          width: uploadResult.width,
          height: uploadResult.height
        }
      });
      return;
    }

    // Si llegamos aquí, no hay ni path ni buffer
    console.log('❌ No se encontró ni path ni buffer en el archivo');
    return res.status(400).json({
      success: false,
      message: 'Archivo procesado incorrectamente'
    });

  } catch (error) {
    console.error('❌ Error completo al subir imagen:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    // Determinar el tipo de error y responder apropiadamente
    let statusCode = 500;
    let errorMessage = 'Error del servidor al subir imagen';
    
    if (error.message && error.message.includes('Archivo de imagen inválido')) {
      statusCode = 400;
      errorMessage = 'Archivo de imagen inválido';
    } else if (error.message && error.message.includes('El archivo es demasiado grande')) {
      statusCode = 400;
      errorMessage = 'El archivo es demasiado grande';
    } else if (error.message && error.message.includes('timeout')) {
      statusCode = 408;
      errorMessage = 'Timeout al subir imagen. Intente con una imagen más pequeña';
    } else if (error.message && error.message.includes('Configuración de servicio de imágenes incompleta')) {
      statusCode = 503;
      errorMessage = 'Servicio de imágenes no configurado';
    } else if (error.message && error.message.includes('No se puede conectar al servicio de imágenes')) {
      statusCode = 503;
      errorMessage = 'Servicio de imágenes temporalmente no disponible';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      statusCode = 503;
      errorMessage = 'Servicio de imágenes temporalmente no disponible';
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code,
        name: error.name
      } : undefined
    });
  }
});

// Subir múltiples imágenes
router.post('/multiple', auth, uploadMultipleImages, (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se subieron imágenes'
      });
    }

    const images = req.files.map(file => ({
      url: file.path,
      publicId: file.filename,
      originalName: file.originalname,
      size: file.size
    }));

    res.json({
      success: true,
      message: `${req.files.length} imágenes subidas exitosamente`,
      data: {
        images,
        count: req.files.length
      }
    });

  } catch (error) {
    console.error('Error al subir imágenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al subir imágenes'
    });
  }
});

// Subir imagen de perfil
router.post('/profile', auth, uploadSingleImage, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se subió ninguna imagen'
      });
    }

    // Actualizar la imagen de perfil en la base de datos
    const User = require('../models/User');
    
    await User.findByIdAndUpdate(
      req.user.userId,
      { profileImage: req.file.path }
    );

    res.json({
      success: true,
      message: 'Imagen de perfil actualizada exitosamente',
      data: {
        url: req.file.path,
        publicId: req.file.filename
      }
    });

  } catch (error) {
    console.error('Error al actualizar imagen de perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al actualizar imagen de perfil'
    });
  }
});

// Subir imágenes de producto
router.post('/product/:productId', auth, uploadMultipleImages, async (req, res) => {
  try {
    if (req.user.role !== 'comercio') {
      return res.status(403).json({
        success: false,
        message: 'Solo los comercios pueden subir imágenes de productos'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se subieron imágenes'
      });
    }

    const { productId } = req.params;
    const Product = require('../models/Product');

    // Verificar que el producto pertenece al comercio
    const product = await Product.findOne({
      _id: productId,
      comercio: req.user.userId
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Agregar nuevas imágenes al producto
    const newImages = req.files.map(file => file.path);
    product.images = [...product.images, ...newImages];
    await product.save();

    const imageData = req.files.map(file => ({
      url: file.path,
      publicId: file.filename,
      originalName: file.originalname,
      size: file.size
    }));

    res.json({
      success: true,
      message: `${req.files.length} imágenes agregadas al producto`,
      data: {
        images: imageData,
        totalImages: product.images.length
      }
    });

  } catch (error) {
    console.error('Error al subir imágenes de producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al subir imágenes de producto'
    });
  }
});

// Eliminar imagen
router.delete('/delete', auth, async (req, res) => {
  try {
    const { imageUrl, productId, imageIndex } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'URL de imagen requerida'
      });
    }

    // Si es imagen de producto, verificar permisos y actualizar producto
    if (productId) {
      if (req.user.role !== 'comercio') {
        return res.status(403).json({
          success: false,
          message: 'Solo los comercios pueden eliminar imágenes de productos'
        });
      }

      const Product = require('../models/Product');
      const product = await Product.findOne({
        _id: productId,
        comercio: req.user.userId
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      // Remover imagen del array
      if (imageIndex !== undefined) {
        const index = parseInt(imageIndex);
        if (index >= 0 && index < product.images.length) {
          product.images.splice(index, 1);
          await product.save();
        }
      } else {
        // Buscar y remover por URL
        product.images = product.images.filter(img => img !== imageUrl);
        await product.save();
      }
    }

    // Eliminar de Cloudinary
    try {
      await deleteFromCloudinary(imageUrl);
    } catch (cloudinaryError) {
      console.error('Error al eliminar de Cloudinary:', cloudinaryError);
      // Continuar aunque falle Cloudinary
    }

    res.json({
      success: true,
      message: 'Imagen eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al eliminar imagen'
    });
  }
});

// Obtener información de imagen
router.get('/info', auth, async (req, res) => {
  try {
    const { imageUrl } = req.query;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'URL de imagen requerida'
      });
    }

    // Extraer información básica de la URL
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = filename.split('.')[0];

    res.json({
      success: true,
      data: {
        url: imageUrl,
        publicId,
        filename
      }
    });

  } catch (error) {
    console.error('Error al obtener información de imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al obtener información de imagen'
    });
  }
});

// Optimizar imagen (generar diferentes tamaños)
router.post('/optimize', auth, async (req, res) => {
  try {
    const { imageUrl, sizes } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'URL de imagen requerida'
      });
    }

    const { getOptimizedUrl, getThumbnail } = require('../utils/cloudinary');
    
    // Extraer public ID de la URL
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = `monedero_digital/${filename.split('.')[0]}`;

    const optimizedImages = {};

    // Generar diferentes tamaños si se especifican
    if (sizes && Array.isArray(sizes)) {
      for (const size of sizes) {
        const { width, height, name } = size;
        optimizedImages[name] = getThumbnail(publicId, width, height);
      }
    } else {
      // Tamaños por defecto
      optimizedImages.thumbnail = getThumbnail(publicId, 150, 150);
      optimizedImages.small = getThumbnail(publicId, 300, 300);
      optimizedImages.medium = getThumbnail(publicId, 600, 600);
      optimizedImages.large = getOptimizedUrl(publicId, { width: 1200 });
    }

    res.json({
      success: true,
      data: {
        original: imageUrl,
        optimized: optimizedImages
      }
    });

  } catch (error) {
    console.error('Error al optimizar imagen:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor al optimizar imagen'
    });
  }
});

// Middleware de manejo de errores para uploads
router.use(handleUploadErrors);

module.exports = router;