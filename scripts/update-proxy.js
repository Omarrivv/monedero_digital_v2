#!/usr/bin/env node

// 🔄 SCRIPT PARA ACTUALIZAR PROXY AUTOMÁTICAMENTE
const fs = require('fs');
const path = require('path');

function updateProxy() {
  console.log('🔄 Actualizando proxy del frontend...');
  
  // Leer .env principal
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ No se encontró .env');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const backendUrl = envContent.match(/BACKEND_URL=(.+)/)?.[1];
  
  if (!backendUrl) {
    console.log('❌ No se encontró BACKEND_URL en .env');
    return;
  }

  console.log('📋 Backend URL encontrada:', backendUrl);

  // Actualizar vite.config.js
  const viteConfigPath = path.join(__dirname, '../frontend/vite.config.js');
  let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  // Reemplazar la URL del proxy
  viteConfig = viteConfig.replace(
    /target: '[^']+'/,
    `target: '${backendUrl}'`
  );
  
  fs.writeFileSync(viteConfigPath, viteConfig);
  
  console.log('✅ Proxy actualizado en vite.config.js');
  console.log('🔄 Reinicia el frontend para aplicar cambios');
}

updateProxy();