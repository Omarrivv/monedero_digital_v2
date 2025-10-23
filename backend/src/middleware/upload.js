const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary, uploadImage, isConfigured } = require('../utils/cloudinary');
const fs = require('fs');
const path = require('path');

// Configurar almacenamiento en Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'monedero_digital',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'limit' },
      { quality: 'auto:good' }
    ]
  }
});

// Fallback a memoria si Cloudinary no está configurado
const memoryStorage = multer.memoryStorage();

// Configuración de multer
const upload = multer({
  storage: isConfigured() ? storage : memoryStorage,
  timeout: 60000, // 60 segundos timeout
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo por archivo
    files: 5 // Máximo 5 archivos por request
  },
  fileFilter: (req, file, cb) => {
    // Validar tipo de archivo
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes.'), false);
    }
  }
});

// Middleware de manejo de errores para multer
const handleUploadErrors = (err, req, res, next) => {
  console.error('🚨 Error en upload middleware:', {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack
  });

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Tamaño máximo: 5MB',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Demasiados archivos. Máximo 5 archivos por vez',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Campo de archivo inesperado',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }

    // Otros errores de Multer
    return res.status(400).json({
      success: false,
      message: 'Error al procesar archivo',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  if (err.message === 'Tipo de archivo no permitido. Solo se permiten imágenes.') {
    return res.status(400).json({
      success: false,
      message: err.message,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  // Otros errores
  console.error('❌ Error no manejado en upload:', err);
  return res.status(500).json({
    success: false,
    message: 'Error interno al procesar archivo',
    error: process.env.NODE_ENV === 'development' ? {
      message: err.message,
      name: err.name,
      code: err.code
    } : undefined
  });
};

// Función para eliminar imagen de Cloudinary
const deleteFromCloudinary = async (imageUrl) => {
  try {
    // Extraer public_id de la URL de Cloudinary
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = `monedero_digital/${filename.split('.')[0]}`;
    
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error al eliminar imagen de Cloudinary:', error);
    throw error;
  }
};

// Middleware personalizado para procesar imágenes subidas
const processUploadedImages = (req, res, next) => {
  if (req.files && req.files.length > 0) {
    req.uploadedImages = req.files.map(file => ({
      url: file.path,
      publicId: file.filename,
      originalName: file.originalname,
      size: file.size
    }));
  } else if (req.file) {
    req.uploadedImage = {
      url: req.file.path,
      publicId: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    };
  }
  
  next();
};

// Función para guardar imagen temporalmente en modo desarrollo
const saveTempImage = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      reject(new Error('No file data'));
      return;
    }
    
    const filename = `${Date.now()}-${file.originalname}`;
    const filepath = path.join(__dirname, '..', 'temp-images', filename);
    
    fs.writeFile(filepath, file.buffer, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          url: `http://localhost:5000/temp-images/${filename}`,
          filepath: filepath
        });
      }
    });
  });
};

// Configuraciones específicas para diferentes tipos de upload

// Para perfil de usuario (una sola imagen)
const uploadProfileImage = upload.single('profileImage');

// Para productos (múltiples imágenes)
const uploadProductImages = upload.array('productImages', 5);

// Para cualquier imagen genérica
const uploadSingleImage = upload.single('image');

// Para múltiples imágenes genéricas
const uploadMultipleImages = upload.array('images', 5);

module.exports = {
  upload,
  uploadProfileImage,
  uploadProductImages,
  uploadSingleImage,
  uploadMultipleImages,
  handleUploadErrors,
  deleteFromCloudinary,
  processUploadedImages,
  saveTempImage
};