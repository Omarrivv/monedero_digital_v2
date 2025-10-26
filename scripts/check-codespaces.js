#!/usr/bin/env node

// 🔍 SCRIPT PARA VERIFICAR CONFIGURACIÓN DE CODESPACES

const fs = require('fs');
const path = require('path');

function checkCodespaces() {
  console.log('🔍 Verificando configuración de Codespaces...\n');

  // Leer .env
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ No se encontró archivo .env');
    return;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  let backendUrl = '';
  let frontendUrl = '';
  
  envLines.forEach(line => {
    if (line.startsWith('BACKEND_URL=')) {
      backendUrl = line.split('=')[1];
    }
    if (line.startsWith('FRONTEND_URL=')) {
      frontendUrl = line.split('=')[1];
    }
  });

  console.log('📋 URLs configuradas:');
  console.log(`   Backend: ${backendUrl}`);
  console.log(`   Frontend: ${frontendUrl}`);
  
  // Verificar si son URLs de Codespaces
  if (backendUrl.includes('app.github.dev') && frontendUrl.includes('app.github.dev')) {
    console.log('✅ URLs de Codespaces detectadas');
    
    // Extraer nombres de codespace
    const backendCodespace = backendUrl.match(/https:\/\/([^-]+)/)?.[1];
    const frontendCodespace = frontendUrl.match(/https:\/\/([^-]+)/)?.[1];
    
    console.log(`   Backend Codespace: ${backendCodespace}`);
    console.log(`   Frontend Codespace: ${frontendCodespace}`);
    
    if (backendCodespace !== frontendCodespace) {
      console.log('⚠️  ADVERTENCIA: Frontend y Backend están en Codespaces diferentes');
      console.log('   Esto puede causar problemas de CORS');
      console.log('   Asegúrate de que ambos puertos estén expuestos como públicos');
    } else {
      console.log('✅ Frontend y Backend en el mismo Codespace');
    }
  } else if (backendUrl.includes('localhost') || frontendUrl.includes('localhost')) {
    console.log('🏠 Configuración local detectada');
  } else {
    console.log('☁️ Configuración de producción detectada');
  }
  
  console.log('\n🔧 Para Codespaces:');
  console.log('1. Asegúrate de que el puerto 5000 esté expuesto como PÚBLICO');
  console.log('2. Asegúrate de que el puerto 3000 esté expuesto como PÚBLICO');
  console.log('3. Reinicia ambos servicios después de cambiar la visibilidad');
  
  console.log('\n📝 URLs que deberían estar en el .env:');
  console.log(`BACKEND_URL=${backendUrl}`);
  console.log(`FRONTEND_URL=${frontendUrl}`);
}

checkCodespaces();