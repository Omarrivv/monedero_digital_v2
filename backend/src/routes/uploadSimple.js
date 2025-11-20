const express = require('express');
const { uploadSingleImage, handleUploadErrors } = require('../middleware/upload');

const router = express.Router();

// Endpoint para subir imagen usando Cloudinary
router.post('/image', uploadSingleImage, handleUploadErrors, (req, res) => {
  try {
    console.log('📁 Upload simple iniciado (Cloudinary)');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se subió ninguna imagen'
      });
    }

    // La URL de Cloudinary ya viene en req.file.path gracias a multer-storage-cloudinary
    const imageUrl = req.file.path;

    console.log('✅ Imagen guardada en Cloudinary:', imageUrl);

    res.json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: {
        url: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });

  } catch (error) {
    console.error('❌ Error en upload simple:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir imagen: ' + error.message
    });
  }
});

// Endpoint para registro (alias) - usa la misma lógica de Cloudinary
router.post('/register-image', uploadSingleImage, handleUploadErrors, (req, res) => {
  try {
    console.log('📁 Upload de registro iniciado (Cloudinary)');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se subió ninguna imagen'
      });
    }

    const imageUrl = req.file.path;

    console.log('✅ Imagen de registro guardada en Cloudinary:', imageUrl);

    res.json({
      success: true,
      message: 'Imagen de registro subida exitosamente',
      data: {
        url: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });

  } catch (error) {
    console.error('❌ Error en upload de registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al subir imagen: ' + error.message
    });
  }
});

module.exports = router;