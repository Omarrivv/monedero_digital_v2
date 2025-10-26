#!/usr/bin/env node

// 🔄 SCRIPT PARA SINCRONIZAR CODESPACES
// Detecta automáticamente las URLs de frontend y backend en Codespaces

const fs = require('fs');
const path = require('path');

function syncCodespaces() {
  console.log('🔄 Sincronizando configuración de Codespaces...');
  
  // Detectar URLs actuales
  const backendCodespace = process.env.CODESPACE_NAME;
  
  if (!backendCodespace) {
    console.log('❌ No se detectó Codespace. Ejecuta este script desde un Codespace.');
    return;
  }
  
  const backendUrl = `https://${backendCodespace}-5000.app.github.dev`;
  
  // Pedir al usuario la URL del frontend si es diferente
  console.log('📋 Información detectada:');
  console.log(`   Backend Codespace: ${backendCodespace}`);
  console.log(`   Backend URL: ${backendUrl}`);
  
  // Leer argumentos de línea de comandos para frontend
  const frontendCodespace = process.argv[2];
  
  if (!frontendCodespace) {
    console.log('\n💡 Uso:');
    console.log('   node scripts/sync-codespaces.js <frontend-codespace-name>');
    console.log('\n📝 Ejemplo:');
    console.log('   node scripts/sync-codespaces.js squalid-owl-66j4gxrg7w63wx7');
    console.log('\n🔍 Para encontrar el nombre del frontend:');
    console.log('   1. Ve a tu frontend en el navegador');
    console.log('   2. Copia la parte antes del primer guión de la URL');
    console.log('   3. Ejemplo: de "squalid-owl-66j4gxrg7w63wx7-3000.app.github.dev"');
    console.log('   4. Usa: "squalid-owl-66j4gxrg7w63wx7"');
    return;
  }
  
  const frontendUrl = `https://${frontendCodespace}-3000.app.github.dev`;
  
  console.log(`   Frontend Codespace: ${frontendCodespace}`);
  console.log(`   Frontend URL: ${frontendUrl}`);
  
  // Actualizar .env principal
  const envPath = path.join(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  envContent = envContent.replace(
    /BACKEND_URL=.*/,
    `BACKEND_URL=${backendUrl}`
  );
  envContent = envContent.replace(
    /FRONTEND_URL=.*/,
    `FRONTEND_URL=${frontendUrl}`
  );
  
  fs.writeFileSync(envPath, envContent);
  
  // NO crear archivos .env adicionales - el frontend se configura automáticamente
  console.log('📋 El frontend detectará automáticamente las URLs desde el hostname');
  
  console.log('\n✅ Sincronización completada:');
  console.log(`   Backend: ${backendUrl}`);
  console.log(`   Frontend: ${frontendUrl}`);
  console.log(`   API: ${backendUrl}/api`);
  
  console.log('\n🚀 Próximos pasos:');
  console.log('1. Reinicia el backend: Ctrl+C y npm run dev');
  console.log('2. Reinicia el frontend: Ctrl+C y npm run dev');
  console.log('3. Los CORS estarán configurados automáticamente');
}

syncCodespaces();