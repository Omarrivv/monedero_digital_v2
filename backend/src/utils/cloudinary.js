const cloudinary = require('cloudinary').v2;

const config = require('../config');

// Configurar Cloudinary
console.log('🔧 Configurando Cloudinary...');
console.log('📋 CLOUDINARY_CLOUD_NAME:', config.CLOUDINARY.CLOUD_NAME ? 'Set' : 'Missing');
console.log('📋 CLOUDINARY_API_KEY:', config.CLOUDINARY.API_KEY ? 'Set' : 'Missing');
console.log('📋 CLOUDINARY_API_SECRET:', config.CLOUDINARY.API_SECRET ? 'Set' : 'Missing');

cloudinary.config({
  cloud_name: config.CLOUDINARY.CLOUD_NAME,
  api_key: config.CLOUDINARY.API_KEY,
  api_secret: config.CLOUDINARY.API_SECRET,
  secure: true,
  timeout: 60000 // 60 segundos timeout para Cloudinary
});

console.log('✅ Cloudinary configurado exitosamente');

// Función para subir imagen desde buffer/base64
const uploadImage = async (imageData, options = {}) => {
  try {
    console.log('🔧 Configuración de Cloudinary:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
      api_key: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
    });

    // Verificar que la configuración esté completa
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary configuration incomplete');
    }

    // Validar que imageData no esté vacío
    if (!imageData || typeof imageData !== 'string') {
      throw new Error('Invalid image data provided');
    }

    console.log('📤 Iniciando upload a Cloudinary...');
    console.log('📊 Image data length:', imageData.length);

    const uploadOptions = {
      folder: 'monedero_digital',
      resource_type: 'image',
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto:good' }
      ],
      timeout: 60000, // 60 segundos timeout
      ...options
    };

    console.log('⚙️ Upload options:', uploadOptions);

    const result = await cloudinary.uploader.upload(imageData, uploadOptions);
    
    console.log('✅ Cloudinary upload successful:', {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('❌ Error detallado al subir imagen a Cloudinary:', {
      message: error.message,
      name: error.name,
      code: error.code,
      http_code: error.http_code,
      stack: error.stack
    });

    // Mejorar el mensaje de error basado en el tipo de error
    let errorMessage = 'Error al subir imagen';
    
    if (error.message && error.message.includes('Invalid image file')) {
      errorMessage = 'Archivo de imagen inválido';
    } else if (error.message && error.message.includes('File size too large')) {
      errorMessage = 'El archivo es demasiado grande';
    } else if (error.message && error.message.includes('Cloudinary configuration incomplete')) {
      errorMessage = 'Configuración de servicio de imágenes incompleta';
    } else if (error.message && error.message.includes('Invalid image data')) {
      errorMessage = 'Datos de imagen inválidos';
    } else if (error.http_code === 401) {
      errorMessage = 'Error de autenticación con el servicio de imágenes';
    } else if (error.http_code === 400) {
      errorMessage = 'Solicitud inválida al servicio de imágenes';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      errorMessage = 'No se puede conectar al servicio de imágenes';
    }

    throw new Error(errorMessage);
  }
};

// Función para eliminar imagen
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error al eliminar imagen de Cloudinary:', error);
    throw new Error('Error al eliminar imagen');
  }
};

// Función para obtener URL optimizada
const getOptimizedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    fetch_format: 'auto',
    quality: 'auto',
    ...options
  });
};

// Función para generar thumbnail
const getThumbnail = (publicId, width = 200, height = 200) => {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    fetch_format: 'auto',
    quality: 'auto'
  });
};

// Función para verificar si Cloudinary está configurado
const isConfigured = () => {
  return config.CLOUDINARY.CONFIGURED;
};

// Función para obtener información de una imagen
const getImageInfo = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return {
      url: result.secure_url,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      format: result.format,
      createdAt: result.created_at
    };
  } catch (error) {
    console.error('Error al obtener información de imagen:', error);
    throw new Error('Error al obtener información de imagen');
  }
};

// Función para transformar imagen
const transformImage = (publicId, transformations) => {
  return cloudinary.url(publicId, {
    transformation: transformations,
    fetch_format: 'auto',
    quality: 'auto'
  });
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  getOptimizedUrl,
  getThumbnail,
  isConfigured,
  getImageInfo,
  transformImage
};

// También exportar cloudinary directamente para compatibilidad
module.exports.default = cloudinary;