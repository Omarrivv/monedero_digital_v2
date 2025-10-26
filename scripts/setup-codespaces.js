#!/usr/bin/env node

// 🚀 SCRIPT PARA CONFIGURAR CODESPACES AUTOMÁTICAMENTE

const fs = require('fs');
const path = require('path');

function setupCodespaces() {
  const codespaceName = process.env.CODESPACE_NAME;
  
  if (!codespaceName) {
    console.log('❌ No se detectó entorno de Codespaces');
    return;
  }

  console.log('🚀 Configurando para GitHub Codespaces...');
  console.log('📋 Codespace Name:', codespaceName);

  // URLs de Codespaces
  const backendUrl = `https://${codespaceName}-5000.app.github.dev`;
  const frontendUrl = `https://${codespaceName}-3000.app.github.dev`;

  // Actualizar .env principal
  const envPath = path.join(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Actualizar URLs
  envContent = envContent.replace(
    /BACKEND_URL=.*/,
    `BACKEND_URL=${backendUrl}`
  );
  envContent = envContent.replace(
    /FRONTEND_URL=.*/,
    `FRONTEND_URL=${frontendUrl}`
  );

  fs.writeFileSync(envPath, envContent);

  // Actualizar .env.local del frontend
  const frontendEnvPath = path.join(__dirname, '../frontend/.env.local');
  let frontendEnvContent = `# 🎨 FRONTEND ENVIRONMENT VARIABLES FOR CODESPACES
# Auto-generated for ${codespaceName}

VITE_API_URL=${backendUrl}/api
VITE_BACKEND_URL=${backendUrl}

# 🔗 Blockchain Networks
VITE_ETHEREUM_RPC_URL=https://ethereum.publicnode.com
VITE_HOLESKY_RPC_URL=https://ethereum-holesky.publicnode.com
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia.publicnode.com
VITE_HOODI_RPC_URL=https://hoodi.drpc.org

# 🔧 Debug
VITE_DEBUG=true
`;

  fs.writeFileSync(frontendEnvPath, frontendEnvContent);

  console.log('✅ Configuración de Codespaces completada:');
  console.log('   Backend URL:', backendUrl);
  console.log('   Frontend URL:', frontendUrl);
  console.log('   API URL:', `${backendUrl}/api`);
  
  console.log('\n🚀 Próximos pasos:');
  console.log('1. Reinicia el backend: npm run dev');
  console.log('2. Reinicia el frontend: npm run dev');
  console.log('3. Abre el frontend en:', frontendUrl);
}

setupCodespaces();