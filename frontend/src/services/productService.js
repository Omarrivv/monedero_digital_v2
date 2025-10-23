const API_URL = import.meta.env.VITE_API_URL

class ProductService {
  // Obtener todos los productos con filtros
  async getProducts(filters = {}) {
    try {
      const queryParams = new URLSearchParams()
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          queryParams.append(key, filters[key])
        }
      })

      const response = await fetch(`${API_URL}/products?${queryParams}`)
      
      if (!response.ok) {
        throw new Error('Error al obtener productos')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en getProducts:', error)
      throw error
    }
  }

  // Obtener productos de un comercio específico
  async getProductsByComercio(comercioId) {
    try {
      const response = await fetch(`${API_URL}/products?comercio=${comercioId}`)
      
      if (!response.ok) {
        throw new Error('Error al obtener productos del comercio')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en getProductsByComercio:', error)
      throw error
    }
  }

  // Obtener un producto específico
  async getProduct(productId) {
    try {
      const response = await fetch(`${API_URL}/products/${productId}`)
      
      if (!response.ok) {
        throw new Error('Producto no encontrado')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en getProduct:', error)
      throw error
    }
  }

  // Crear nuevo producto (solo comercios)
  async createProduct(productData) {
    try {
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const formData = new FormData()
      
      // Agregar campos de texto
      Object.keys(productData).forEach(key => {
        if (key !== 'images' && productData[key] !== undefined) {
          formData.append(key, productData[key])
        }
      })

      // Agregar imágenes si existen
      if (productData.images && productData.images.length > 0) {
        productData.images.forEach(image => {
          formData.append('images', image)
        })
      }

      const response = await fetch(`${API_URL}/products/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al crear producto')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en createProduct:', error)
      throw error
    }
  }

  // Obtener mis productos (solo comercios)
  async getMyProducts(filters = {}) {
    try {
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const queryParams = new URLSearchParams()
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          queryParams.append(key, filters[key])
        }
      })

      const response = await fetch(`${API_URL}/products/my-products?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al obtener mis productos')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en getMyProducts:', error)
      throw error
    }
  }

  // Actualizar producto
  async updateProduct(productId, productData) {
    try {
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const formData = new FormData()
      
      // Agregar campos de texto
      Object.keys(productData).forEach(key => {
        if (key !== 'images' && productData[key] !== undefined) {
          formData.append(key, productData[key])
        }
      })

      // Agregar nuevas imágenes si existen
      if (productData.images && productData.images.length > 0) {
        productData.images.forEach(image => {
          if (image instanceof File) {
            formData.append('images', image)
          }
        })
      }

      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al actualizar producto')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en updateProduct:', error)
      throw error
    }
  }

  // Eliminar producto
  async deleteProduct(productId) {
    try {
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const response = await fetch(`${API_URL}/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al eliminar producto')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en deleteProduct:', error)
      throw error
    }
  }

  // Buscar productos
  async searchProducts(query, limit = 10) {
    try {
      if (!query || query.trim().length < 2) {
        return { success: true, products: [] }
      }

      const response = await fetch(`${API_URL}/products/search/${encodeURIComponent(query)}?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error('Error en la búsqueda')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en searchProducts:', error)
      throw error
    }
  }

  // Obtener categorías disponibles
  async getCategories() {
    try {
      const response = await fetch(`${API_URL}/products/categories/list`)
      
      if (!response.ok) {
        throw new Error('Error al obtener categorías')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en getCategories:', error)
      throw error
    }
  }

  // Obtener productos destacados
  async getFeaturedProducts(limit = 8) {
    try {
      const response = await fetch(`${API_URL}/products/featured/list?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error('Error al obtener productos destacados')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en getFeaturedProducts:', error)
      throw error
    }
  }

  // Eliminar imagen de producto
  async deleteProductImage(productId, imageIndex) {
    try {
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const response = await fetch(`${API_URL}/products/${productId}/images/${imageIndex}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al eliminar imagen')
      }

      return await response.json()
    } catch (error) {
      console.error('Error en deleteProductImage:', error)
      throw error
    }
  }
}

export default new ProductService()