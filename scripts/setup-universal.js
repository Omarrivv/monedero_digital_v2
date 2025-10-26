#!/usr/bin/env node

// 🌐 SCRIPT UNIVERSAL DE CONFIGURACIÓN
// Detecta automáticamente el entorno y configura las variables necesarias

const fs = require('fs');
const path = require('path');

function detectCurrentEnvironment() {
  // Codespaces
  if (process.env.CODESPACE_NAME) {
    return {
      type: 'codespaces',
      name: process.env.CODESPACE_NAME,
      backendUrl: `https://${process.env.CODESPACE_NAME}-5000.app.github.dev`,
      frontendUrl: `https://${process.env.CODESPACE_NAME}-3000.app.github.dev`
    }
  }
  
  // Render
  if (process.env.RENDER_SERVICE_NAME || process.env.RENDER) {
    return {
      type: 'render',
      name: process.env.RENDER_SERVICE_NAME || 'render-app',
      backendUrl: process.env.RENDER_EXTERNAL_URL || `https://${process.env.RENDER_SERVICE_NAME}.onrender.com`,
      frontendUrl: process.env.FRONTEND_URL || 'https://your-frontend.vercel.app'
    }
  }
  
  // Railway
  if (process.env.RAILWAY_ENVIRONMENT) {
    return {
      type: 'railway',
      name: process.env.RAILWAY_PROJECT_NAME || 'railway-app',
      backendUrl: process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 'https://your-app.up.railway.app',
      frontendUrl: process.env.FRONTEND_URL || 'https://your-frontend.vercel.app'
    }
  }
  
  // Heroku
  if (process.env.DYNO || process.env.HEROKU_APP_NAME) {
    return {
      type: 'heroku',
      name: process.env.HEROKU_APP_NAME || 'heroku-app',
      backendUrl: `https://${process.env.HEROKU_APP_NAME}.herokuapp.com`,
      frontendUrl: process.env.FRONTEND_URL || 'https://your-frontend.vercel.app'
    }
  }
  
  // Vercel
  if (process.env.VERCEL || process.env.VERCEL_URL) {
    return {
      type: 'vercel',
      name: process.env.VERCEL_PROJECT_NAME || 'vercel-app',
      backendUrl: process.env.BACKEND_URL || 'https://your-backend.onrender.com',
      frontendUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://your-app.vercel.app'
    }
  }
  
  // Local
  return {
    type: 'local',
    name: 'localhost',
    backendUrl: 'http://localhost:5000',
    frontendUrl: 'http://localhost:3000'
  }
}

function setupEnvironment() {
  const env = detectCurrentEnvironment()
  
  console.log('🌐 Configuración Universal Detectada:')
  console.log(`   Tipo: ${env.type}`)
  console.log(`   Nombre: ${env.name}`)
  console.log(`   Backend: ${env.backendUrl}`)
  console.log(`   Frontend: ${env.frontendUrl}`)
  
  // Actualizar .env principal si es necesario
  const envPath = path.join(__dirname, '../.env')
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8')
    
    // Solo actualizar si las URLs no están configuradas o son localhost
    if (!process.env.BACKEND_URL || process.env.BACKEND_URL.includes('localhost')) {
      envContent = envContent.replace(
        /BACKEND_URL=.*/,
        `BACKEND_URL=${env.backendUrl}`
      )
    }
    
    if (!process.env.FRONTEND_URL || process.env.FRONTEND_URL.includes('localhost')) {
      envContent = envContent.replace(
        /FRONTEND_URL=.*/,
        `FRONTEND_URL=${env.frontendUrl}`
      )
    }
    
    fs.writeFileSync(envPath, envContent)
    console.log('✅ Archivo .env actualizado')
  }
  
  // Configurar frontend si es necesario
  const frontendEnvPath = path.join(__dirname, '../frontend/.env.local')
  if (env.type !== 'local') {
    const frontendEnvContent = `# 🎨 AUTO-GENERATED FOR ${env.type.toUpperCase()}
VITE_API_URL=${env.backendUrl}/api
VITE_BACKEND_URL=${env.backendUrl}
VITE_DEBUG=true
`
    fs.writeFileSync(frontendEnvPath, frontendEnvContent)
    console.log('✅ Frontend .env.local actualizado')
  }
  
  console.log('\n🚀 Configuración completada!')
  console.log('   La aplicación se adaptará automáticamente al entorno')
  console.log('   No necesitas cambiar nada más')
  
  if (env.type === 'local') {
    console.log('\n💡 Para desarrollo local:')
    console.log('   Backend: npm run dev (puerto 5000)')
    console.log('   Frontend: npm run dev (puerto 3000)')
  } else {
    console.log('\n💡 Para deployment:')
    console.log('   Asegúrate de configurar las variables de entorno en tu plataforma')
    console.log('   La aplicación detectará automáticamente el entorno')
  }
}

setupEnvironment()