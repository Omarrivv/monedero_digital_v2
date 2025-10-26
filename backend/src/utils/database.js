const mongoose = require('mongoose');
const config = require('../config');

const connectDB = async () => {
  try {
    console.log('🔗 Intentando conectar a MongoDB Atlas...');
    console.log('📍 URI:', config.MONGODB_URI ? 'Configurada' : 'No configurada');

    // Configuración de conexión compatible con MongoDB Driver v6+
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 segundos timeout
      socketTimeoutMS: 45000, // 45 segundos socket timeout
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000
      // Removidas opciones no compatibles: bufferCommands, bufferMaxEntries, retryWrites, w
    };

    const conn = await mongoose.connect(config.MONGODB_URI, options);
    
    console.log(`✅ MongoDB Atlas conectado exitosamente`);
    console.log(`📊 Host: ${conn.connection.host}`);
    console.log(`📁 Base de datos: ${conn.connection.name}`);
    console.log(`🔌 Estado de conexión: ${conn.connection.readyState}`);

    // Manejar eventos de conexión
    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de MongoDB:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB desconectado');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconectado');
    });

    return conn;

  } catch (error) {
    console.error('❌ Error detallado conectando a MongoDB Atlas:');
    console.error('📋 Mensaje:', error.message);
    console.error('📋 Código:', error.code);
    console.error('📋 Nombre:', error.name);

    // Mensajes de error más específicos
    if (error.message.includes('IP whitelist') || error.message.includes('not whitelisted')) {
      console.error('');
      console.error('🚨 PROBLEMA DE IP WHITELIST:');
      console.error('1. Ve a MongoDB Atlas Dashboard');
      console.error('2. Selecciona tu cluster');
      console.error('3. Ve a "Network Access"');
      console.error('4. Agrega tu IP actual o usa 0.0.0.0/0 para permitir todas las IPs');
      console.error('5. Guarda los cambios y espera unos minutos');
      console.error('');
    } else if (error.message.includes('authentication failed')) {
      console.error('');
      console.error('🚨 PROBLEMA DE AUTENTICACIÓN:');
      console.error('1. Verifica tu usuario y contraseña en MongoDB Atlas');
      console.error('2. Asegúrate de que el usuario tenga permisos de lectura/escritura');
      console.error('');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
      console.error('');
      console.error('🚨 PROBLEMA DE CONECTIVIDAD:');
      console.error('1. Verifica tu conexión a internet');
      console.error('2. Verifica que la URL de MongoDB sea correcta');
      console.error('');
    }

    // En desarrollo, no salir del proceso para permitir debugging
    if (config.IS_DEVELOPMENT) {
      console.log('⚠️ Modo desarrollo: continuando sin MongoDB...');
      return null;
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB;