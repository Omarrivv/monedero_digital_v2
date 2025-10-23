const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configuración simple de multer para guardar archivos localmente
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../temp-images');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    // Verificar que sea imagen
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  }
});

// Endpoint simple para subir imagen
router.post('/image', upload.single('image'), (req, res) => {
  try {
    console.log('📁 Upload simple iniciado');
    console.log('📋 File:', req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      path: req.file.path
    } : 'No file');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se subió ninguna imagen'
      });
    }

    // Generar URL para acceder a la imagen
    const imageUrl = `/temp-images/${req.file.filename}`;

    console.log('✅ Imagen guardada:', imageUrl);

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

// Endpoint para registro (alias)
router.post('/register-image', upload.single('image'), (req, res) => {
  try {
    console.log('📁 Upload de registro iniciado');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se subió ninguna imagen'
      });
    }

    const imageUrl = `/temp-images/${req.file.filename}`;

    console.log('✅ Imagen de registro guardada:', imageUrl);

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