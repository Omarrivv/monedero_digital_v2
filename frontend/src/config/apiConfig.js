// 🔧 CONFIGURACIÓN API AUTOMÁTICA
// Detecta automáticamente si estamos en Codespaces, Local o Producción

const detectEnvironment = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // 🚀 PRIORIDAD 1: Variables de entorno explícitas
  const envBackendUrl = import.meta.env.VITE_BACKEND_URL;
  const envFrontendUrl = import.meta.env.VITE_FRONTEND_URL;
  
  if (envBackendUrl && envFrontendUrl) {
    return {
      type: 'environment',
      name: 'env-config',
      backendUrl: envBackendUrl,
      frontendUrl: envFrontendUrl
    };
  }
  
  // 🚀 PRIORIDAD 2: Detectar Codespaces
  if (hostname.includes('app.github.dev')) {
    const codespaceMatch = hostname.match(/([^-]+)-(\d+)\.app\.github\.dev/);
    if (codespaceMatch) {
      const [, codespaceName] = codespaceMatch;
      return {
        type: 'codespaces',
        name: codespaceName,
        backendUrl: `https://${codespaceName}-5000.app.github.dev`,
        frontendUrl: `https://${codespaceName}-3000.app.github.dev`
      };
    }
  }
  
  // 🚀 PRIORIDAD 3: Detectar Localhost/Local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return {
      type: 'local',
      name: 'localhost',
      backendUrl: envBackendUrl || 'http://localhost:5000',
      frontendUrl: envFrontendUrl || 'http://localhost:3000'
    };
  }
  
  // 🚀 PRIORIDAD 4: Detectar Netlify
  if (hostname.includes('netlify.app')) {
    return {
      type: 'netlify',
      name: hostname.split('.')[0],
      backendUrl: envBackendUrl || 'ERROR_NO_BACKEND_URL_SET',
      frontendUrl: envFrontendUrl || `${protocol}//${hostname}`
    };
  }
  
  // 🚀 PRIORIDAD 5: Detectar Vercel
  if (hostname.includes('vercel.app')) {
    return {
      type: 'vercel',
      name: hostname.split('.')[0],
      backendUrl: envBackendUrl || 'ERROR_NO_BACKEND_URL_SET',
      frontendUrl: envFrontendUrl || `${protocol}//${hostname}`
    };
  }
  
  // 🚀 PRIORIDAD 6: Producción genérica
  return {
    type: 'production',
    name: 'production',
    backendUrl: envBackendUrl || 'ERROR_NO_BACKEND_URL_SET',
    frontendUrl: envFrontendUrl || `${protocol}//${hostname}`
  };
};

const environment = detectEnvironment();

// 🚀 Configuración final
export const API_CONFIG = {
  BASE_URL: `${environment.backendUrl}/api`,
  TIMEOUT: 30000,
  ENVIRONMENT: environment,
  
  // Headers por defecto
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Log para debug
console.log('🔧 API Config Auto-detectado:');
console.log(`   Tipo: ${environment.type}`);
console.log(`   Frontend: ${environment.frontendUrl}`);
console.log(`   Backend: ${environment.backendUrl}`);
console.log(`   API Base URL: ${API_CONFIG.BASE_URL}`);

export default API_CONFIG;