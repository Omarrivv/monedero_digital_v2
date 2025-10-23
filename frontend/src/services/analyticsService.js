import apiService from './apiService'
import { debugAuth } from '../utils/debugAuth'

const API_URL = import.meta.env.VITE_API_URL

class AnalyticsService {
  // Obtener analytics generales del usuario
  async getAnalytics(periodo = 'mes') {
    try {
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        throw new Error('No hay token de autenticación')
      }

      const response = await fetch(`${API_URL}/analytics?period=${periodo}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        // Si no existe el endpoint de analytics, calcular desde transacciones
        return await this.calcularAnalyticsDesdeTransacciones(periodo)
      }

      return await response.json()
    } catch (error) {
      console.error('Error al obtener analytics:', error)
      // Fallback: calcular desde transacciones
      return await this.calcularAnalyticsDesdeTransacciones(periodo)
    }
  }

  // Calcular analytics desde las transacciones existentes
  async calcularAnalyticsDesdeTransacciones(periodo = 'mes') {
    try {
      console.log('🔄 Intentando obtener transacciones para analytics...')
      
      // Debug del estado de autenticación
      const authState = debugAuth()
      
      const token = localStorage.getItem('authToken')
      
      if (!token) {
        throw new Error('No hay token de autenticación. Por favor, inicia sesión nuevamente.')
      }

      console.log('🔑 Token encontrado:', token.substring(0, 20) + '...')
      console.log('📡 Haciendo petición a:', `${API_URL}/transactions/my-transactions?limit=1000`)

      // Obtener todas las transacciones del usuario
      const response = await fetch(`${API_URL}/transactions/my-transactions?limit=1000`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📊 Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      })

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          // Si no se puede parsear el JSON, usar el mensaje por defecto
        }

        if (response.status === 401) {
          errorMessage = 'Token de autenticación inválido o expirado. Por favor, inicia sesión nuevamente.'
          // Limpiar token inválido
          localStorage.removeItem('authToken')
          // Redirigir al login
          window.location.href = '/login'
        } else if (response.status === 404) {
          errorMessage = 'Endpoint de transacciones no encontrado. Verifica que el servidor esté funcionando.'
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('✅ Datos recibidos:', data)
      
      const transacciones = data.transactions || []
      console.log('📊 Transacciones encontradas:', transacciones.length)

      // Calcular analytics basados en las transacciones reales
      return this.procesarTransaccionesParaAnalytics(transacciones, periodo)
    } catch (error) {
      console.error('❌ Error al calcular analytics:', error)
      throw error
    }
  }

  // Procesar transacciones para generar analytics
  procesarTransaccionesParaAnalytics(transacciones, periodo) {
    const ahora = new Date()
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    const inicioSemana = new Date(ahora.setDate(ahora.getDate() - ahora.getDay()))
    const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())

    // Filtrar transacciones por período
    let transaccionesFiltradas = transacciones
    if (periodo === 'semana') {
      transaccionesFiltradas = transacciones.filter(t => new Date(t.createdAt) >= inicioSemana)
    } else if (periodo === 'mes') {
      transaccionesFiltradas = transacciones.filter(t => new Date(t.createdAt) >= inicioMes)
    }

    // Calcular métricas básicas
    const transaccionesStats = {
      total: transacciones.length,
      completadas: transacciones.filter(t => t.status === 'completed').length,
      pendientes: transacciones.filter(t => t.status === 'pending').length,
      fallidas: transacciones.filter(t => t.status === 'failed' || t.status === 'cancelled').length
    }

    // Calcular gastos
    const gastosHoy = this.calcularGastosPorPeriodo(transacciones, 'hoy')
    const gastosSemana = this.calcularGastosPorPeriodo(transacciones, 'semana')
    const gastosMes = this.calcularGastosPorPeriodo(transacciones, 'mes')

    const gastos = {
      hoy: gastosHoy,
      semana: gastosSemana,
      mes: gastosMes,
      promedioDiario: gastosMes / 30
    }

    // Calcular distribución por categorías
    const categorias = this.calcularDistribucionCategorias(transaccionesFiltradas)

    // Calcular tendencias semanales
    const tendencias = this.calcularTendencias(transacciones)

    return {
      success: true,
      analytics: {
        transacciones: transaccionesStats,
        gastos,
        categorias,
        tendencias
      }
    }
  }

  // Calcular gastos por período
  calcularGastosPorPeriodo(transacciones, periodo) {
    const ahora = new Date()
    let fechaInicio

    switch (periodo) {
      case 'hoy':
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
        break
      case 'semana':
        fechaInicio = new Date(ahora.setDate(ahora.getDate() - ahora.getDay()))
        break
      case 'mes':
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
        break
      default:
        fechaInicio = new Date(0)
    }

    return transacciones
      .filter(t => {
        const fechaTransaccion = new Date(t.createdAt)
        return fechaTransaccion >= fechaInicio && 
               t.status === 'completed' &&
               (t.type === 'payment' || t.type === 'transfer')
      })
      .reduce((total, t) => total + (t.amount || 0), 0)
  }

  // Calcular distribución por categorías
  calcularDistribucionCategorias(transacciones) {
    const categoriaMap = new Map()
    let totalGasto = 0

    transacciones
      .filter(t => t.status === 'completed' && (t.type === 'payment' || t.type === 'transfer'))
      .forEach(t => {
        // Intentar obtener categoría de los metadatos o usar 'general'
        let categoria = 'general'
        
        if (t.metadata?.productos && t.metadata.productos.length > 0) {
          // Si hay productos, usar la categoría del primer producto
          categoria = t.metadata.productos[0].categoria || 'general'
        } else if (t.type === 'transfer') {
          categoria = 'transferencias'
        } else if (t.type === 'payment') {
          categoria = 'pagos'
        }

        const monto = t.amount || 0
        totalGasto += monto

        if (categoriaMap.has(categoria)) {
          categoriaMap.set(categoria, categoriaMap.get(categoria) + monto)
        } else {
          categoriaMap.set(categoria, monto)
        }
      })

    // Convertir a array con porcentajes
    const categorias = Array.from(categoriaMap.entries()).map(([nombre, monto]) => ({
      nombre: this.formatearNombreCategoria(nombre),
      monto,
      porcentaje: totalGasto > 0 ? (monto / totalGasto * 100).toFixed(1) : 0,
      color: this.obtenerColorCategoria(nombre)
    }))

    // Ordenar por monto descendente
    return categorias.sort((a, b) => b.monto - a.monto)
  }

  // Calcular tendencias semanales
  calcularTendencias(transacciones) {
    const ahora = new Date()
    const semanas = []

    // Generar últimas 4 semanas
    for (let i = 3; i >= 0; i--) {
      const inicioSemana = new Date(ahora)
      inicioSemana.setDate(ahora.getDate() - (i * 7) - ahora.getDay())
      
      const finSemana = new Date(inicioSemana)
      finSemana.setDate(inicioSemana.getDate() + 6)

      const gastoSemana = transacciones
        .filter(t => {
          const fechaTransaccion = new Date(t.createdAt)
          return fechaTransaccion >= inicioSemana && 
                 fechaTransaccion <= finSemana &&
                 t.status === 'completed' &&
                 (t.type === 'payment' || t.type === 'transfer')
        })
        .reduce((total, t) => total + (t.amount || 0), 0)

      semanas.push({
        semana: `Sem ${4 - i}`,
        monto: gastoSemana
      })
    }

    return {
      gastosSemanales: semanas,
      horasActividad: this.calcularActividadPorHoras(transacciones)
    }
  }

  // Calcular actividad por horas
  calcularActividadPorHoras(transacciones) {
    const horasMap = new Map()

    transacciones
      .filter(t => t.status === 'completed')
      .forEach(t => {
        const fecha = new Date(t.createdAt)
        const hora = `${fecha.getHours().toString().padStart(2, '0')}:00`
        
        horasMap.set(hora, (horasMap.get(hora) || 0) + 1)
      })

    // Convertir a array y ordenar por hora
    return Array.from(horasMap.entries())
      .map(([hora, transacciones]) => ({ hora, transacciones }))
      .sort((a, b) => a.hora.localeCompare(b.hora))
  }

  // Formatear nombre de categoría
  formatearNombreCategoria(categoria) {
    const nombres = {
      'general': 'General',
      'transferencias': 'Transferencias',
      'pagos': 'Pagos',
      'alimentacion': 'Alimentación',
      'entretenimiento': 'Entretenimiento',
      'educacion': 'Educación',
      'deportes': 'Deportes',
      'tecnologia': 'Tecnología',
      'ropa': 'Ropa',
      'transporte': 'Transporte',
      'salud': 'Salud'
    }

    return nombres[categoria] || categoria.charAt(0).toUpperCase() + categoria.slice(1)
  }

  // Obtener color para categoría
  obtenerColorCategoria(categoria) {
    const colores = {
      'general': 'bg-gray-500',
      'transferencias': 'bg-blue-500',
      'pagos': 'bg-green-500',
      'alimentacion': 'bg-orange-500',
      'entretenimiento': 'bg-purple-500',
      'educacion': 'bg-blue-500',
      'deportes': 'bg-green-500',
      'tecnologia': 'bg-indigo-500',
      'ropa': 'bg-pink-500',
      'transporte': 'bg-yellow-500',
      'salud': 'bg-red-500'
    }

    return colores[categoria] || 'bg-gray-500'
  }

  // Formatear monto para mostrar
  formatearMonto(monto) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(monto)
  }
}

export default new AnalyticsService()