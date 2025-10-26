import axios from "axios";

// � SIN  CORS - USA PROXY AUTOMÁTICO
const API_BASE_URL = "https://dark-spooky-haunting-7qgp9jr9x56cx4v4-5000.app.github.dev/api";

console.log("🔧 API Service configurado con URL:", API_BASE_URL);

const apiService = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para requests
apiService.interceptors.request.use(
  (config) => {
    // Log de la URL completa que se va a llamar
    const fullUrl = config.baseURL + config.url;
    console.log("🚀 Haciendo petición a:", fullUrl);
    console.log("🔧 Config:", { baseURL: config.baseURL, url: config.url });

    // Agregar token si existe
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses
apiService.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Métodos específicos para la API
export const authAPI = {
  checkUser: (walletAddress) => apiService.get(`/auth/check/${walletAddress}`),

  registerPadre: (userData) =>
    apiService.post("/auth/register/padre", userData, { timeout: 60000 }),

  registerHijo: (hijoData) => apiService.post("/auth/register/hijo", hijoData),

  registerComercio: (comercioData) =>
    apiService.post("/auth/register/comercio", comercioData),

  loginHijo: (credentials) => apiService.post("/auth/login/hijo", credentials),

  updateProfile: (profileData) => apiService.put("/auth/profile", profileData),
};

export const transactionAPI = {
  getHistory: (walletAddress) =>
    apiService.get(`/transactions/history/${walletAddress}`),

  recordTransaction: (transactionData) =>
    apiService.post("/transactions/record", transactionData),

  getPendingTransactions: (walletAddress) =>
    apiService.get(`/transactions/pending/${walletAddress}`),
};

export const limitsAPI = {
  setLimits: (limitsData) => apiService.post("/limits/set", limitsData),

  getLimits: (hijoId) => apiService.get(`/limits/${hijoId}`),

  updateLimits: (hijoId, limitsData) =>
    apiService.put(`/limits/${hijoId}`, limitsData),

  checkSpendingLimit: (hijoId, amount, category) =>
    apiService.post("/limits/check", { hijoId, amount, category }),
};

export const comercioAPI = {
  getProducts: (comercioId) =>
    apiService.get(`/comercio/products/${comercioId}`),

  addProduct: (productData) =>
    apiService.post("/comercio/products", productData),

  updateProduct: (productId, productData) =>
    apiService.put(`/comercio/products/${productId}`, productData),

  deleteProduct: (productId) =>
    apiService.delete(`/comercio/products/${productId}`),

  getSales: (comercioId) => apiService.get(`/comercio/sales/${comercioId}`),
};

export const uploadAPI = {
  // Para usuarios autenticados
  uploadImage: (formData) =>
    apiService.post("/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60 segundos para uploads
    }),

  // Para registro sin autenticación
  uploadImageForRegister: (formData) =>
    apiService.post("/upload/register-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000, // 60 segundos para uploads
    }),

  deleteImage: (imageId) => apiService.delete(`/upload/image/${imageId}`),
};

export default apiService;
