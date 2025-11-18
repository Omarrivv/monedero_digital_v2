import axios from 'axios'
import API_CONFIG from '../config/apiConfig.js'

// 🔥 CONFIGURACIÓN AUTOMÁTICA
console.log('🔧 API Service configurado con:', API_CONFIG)

const apiService = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.HEADERS,
  // Configuración adicional para CORS
  withCredentials: false, // Solo true si el backend espera cookies
  validateStatus: function (status) {
    return status >= 200 && status < 300; // default
  },
})

// 📡 Interceptors con logs detallados
apiService.interceptors.request.use(
  (config) => {
    const fullUrl = `${config.baseURL}${config.url}`
    console.log('🚀 NUEVA PETICIÓN A:', fullUrl)
    console.log('📋 Method:', config.method?.toUpperCase())
    console.log('🌐 Environment:', API_CONFIG.ENVIRONMENT.type)
    
    // Agregar token si existe
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    console.error('❌ Error en request:', error)
    return Promise.reject(error)
  }
)

apiService.interceptors.response.use(
  (response) => {
    console.log('✅ Respuesta exitosa de:', response.config.url)
    console.log('📊 Status:', response.status)
    return response
  },
  (error) => {
    console.error('❌ Error en respuesta:', error.response?.status, error.config?.url)
    console.error('🔍 Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status
    })
    
    // Manejo específico de errores CORS
    if (error.code === 'ERR_NETWORK') {
      console.error('🚫 Error de RED - Posible problema de CORS o servidor no disponible')
      console.error('🌐 Current environment:', API_CONFIG.ENVIRONMENT)
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API methods
export const authAPI = {
  checkUser: (walletAddress) => {
    console.log('🔍 Checking user:', walletAddress)
    return apiService.get(`/auth/check/${walletAddress}`)
  },
  
  registerPadre: (userData) => 
    apiService.post('/auth/register/padre', userData, { timeout: 60000 }),
  
  registerHijo: (hijoData) => 
    apiService.post('/auth/register/hijo', hijoData),
  
  registerComercio: (comercioData) => 
    apiService.post('/auth/register/comercio', comercioData),
  
  loginHijo: (credentials) => 
    apiService.post('/auth/login/hijo', credentials),
  
  updateProfile: (profileData) => 
    apiService.put('/auth/profile', profileData),
}

export const transactionAPI = {
  getHistory: (walletAddress) => 
    apiService.get(`/transactions/history/${walletAddress}`),
  
  recordTransaction: (transactionData) => 
    apiService.post('/transactions/record', transactionData),
  
  getPendingTransactions: (walletAddress) => 
    apiService.get(`/transactions/pending/${walletAddress}`),
}

export const limitsAPI = {
  setLimits: (limitsData) => 
    apiService.post('/limits/set', limitsData),
  
  getLimits: (hijoId) => 
    apiService.get(`/limits/${hijoId}`),
  
  updateLimits: (hijoId, limitsData) => 
    apiService.put(`/limits/${hijoId}`, limitsData),
  
  checkSpendingLimit: (hijoId, amount, category) => 
    apiService.post('/limits/check', { hijoId, amount, category }),
}

export const comercioAPI = {
  getProducts: (comercioId) => 
    apiService.get(`/comercio/products/${comercioId}`),
  
  addProduct: (productData) => 
    apiService.post('/comercio/products', productData),
  
  updateProduct: (productId, productData) => 
    apiService.put(`/comercio/products/${productId}`, productData),
  
  deleteProduct: (productId) => 
    apiService.delete(`/comercio/products/${productId}`),
  
  getSales: (comercioId) => 
    apiService.get(`/comercio/sales/${comercioId}`),
}

export const uploadAPI = {
  uploadImage: (formData) => 
    apiService.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    }),
  
  uploadImageForRegister: (formData) => 
    apiService.post('/upload/register-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    }),
  
  deleteImage: (imageId) => 
    apiService.delete(`/upload/image/${imageId}`),
}

export default apiService