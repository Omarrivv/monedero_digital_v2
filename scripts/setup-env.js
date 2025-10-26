#!/usr/bin/env node

// 🚀 SCRIPT DE CONFIGURACIÓN AUTOMÁTICA PARA DEPLOYMENT
// Este script configura las variables de entorno para diferentes plataformas

const fs = require('fs');
const path = require('path');

const platforms = {
  render: {
    name: 'Render',
    envVars: {
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://tu-app.onrender.com',
      BACKEND_URL: 'https://tu-api.onrender.com'
    }
  },
  vercel: {
    name: 'Vercel',
    envVars: {
      VITE_API_URL: 'https://tu-api.onrender.com/api',
      VITE_BACKEND_URL: 'https://tu-api.onrender.com'
    }
  },
  railway: {
    name: 'Railway',
    envVars: {
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://tu-app.up.railway.app',
      BACKEND_URL: 'https://tu-api.up.railway.app'
    }
  },
  heroku: {
    name: 'Heroku',
    envVars: {
      NODE_ENV: 'production',
      FRONTEND_URL: 'https://tu-app.herokuapp.com',
      BACKEND_URL: 'https://tu-api.herokuapp.com'
    }
  }
};

function generateEnvFile(platform) {
  const config = platforms[platform];
  if (!config) {
    console.error(`❌ Plataforma no soportada: ${platform}`);
    console.log('✅ Plataformas disponibles:', Object.keys(platforms).join(', '));
    return;
  }

  console.log(`🚀 Configurando para ${config.name}...`);

  // Leer .env actual
  const envPath = path.join(__dirname, '../.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  // Actualizar variables específicas de la plataforma
  Object.entries(config.envVars).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  });

  // Escribir archivo actualizado
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Configuración para ${config.name} completada`);
  
  // Mostrar variables que necesitan ser configuradas manualmente
  console.log('\n📋 Variables que debes configurar manualmente en la plataforma:');
  console.log('   MONGODB_URI=tu_mongodb_uri');
  console.log('   JWT_SECRET=tu_jwt_secret');
  console.log('   CLOUDINARY_CLOUD_NAME=tu_cloudinary_name');
  console.log('   CLOUDINARY_API_KEY=tu_cloudinary_key');
  console.log('   CLOUDINARY_API_SECRET=tu_cloudinary_secret');
}

// Ejecutar script
const platform = process.argv[2];
if (!platform) {
  console.log('🔧 Uso: node setup-env.js <plataforma>');
  console.log('📋 Plataformas disponibles:', Object.keys(platforms).join(', '));
  console.log('\n📝 Ejemplo: node setup-env.js render');
} else {
  generateEnvFile(platform);
}