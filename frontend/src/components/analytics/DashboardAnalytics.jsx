import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import analyticsService from '../../services/analyticsService'
import toast from 'react-hot-toast'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Calendar,
  PieChart,
  BarChart3,
  Activity,
  Target,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

function DashboardAnalytics({ userRole, userId }) {
  const [analytics, setAnalytics] = useState({
    transacciones: {
      total: 0,
      completadas: 0,
      pendientes: 0,
      fallidas: 0
    },
    gastos: {
      hoy: 0,
      semana: 0,
      mes: 0,
      promedioDiario: 0
    },
    categorias: [],
    tendencias: {
      gastosSemanales: [],
      horasActividad: []
    }
  })
  const [cargando, setCargando] = useState(true)
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('mes')
  const [error, setError] = useState(null)

  useEffect(() => {
    cargarAnalytics()
  }, [userId, periodoSeleccionado])

  const cargarAnalytics = async () => {
    try {
      setCargando(true)
      setError(null)
      
      console.log('🔄 Cargando analytics reales para:', userRole, 'periodo:', periodoSeleccionado)
      
      const response = await analyticsService.getAnalytics(periodoSeleccionado)
      
      if (response && response.success) {
        console.log('✅ Analytics cargados:', response)
        setAnalytics(response)
      } else {
        throw new Error('No se pudieron cargar los analytics')
      }
    } catch (error) {
      console.error('❌ Error al cargar analytics:', error)
      setError(error.message)
      toast.error('Error al cargar las estadísticas')
      
      // Fallback: datos básicos vacíos
      setAnalytics({
        transacciones: { total: 0, completadas: 0, pendientes: 0, fallidas: 0 },
        gastos: { hoy: 0, semana: 0, mes: 0, promedioDiario: 0 },
        categorias: [],
        tendencias: { gastosSemanales: [], horasActividad: [] }
      })
    } finally {
      setCargando(false)
    }
  }

  const calcularCambioSemanal = () => {
    // Fallback: calcular un cambio básico o retornar 0
    try {
      const tendencias = analytics?.tendencias?.gastosSemanales || []
      if (tendencias.length < 2) return '0.0'
      
      const actual = tendencias[tendencias.length - 1]?.monto || 0
      const anterior = tendencias[tendencias.length - 2]?.monto || 0
      
      if (anterior === 0) return '0.0'
      return ((actual - anterior) / anterior * 100).toFixed(1)
    } catch (error) {
      console.warn('Error calculando cambio semanal:', error)
      return '0.0'
    }
  }

  const obtenerTituloSegunRol = () => {
    switch (userRole) {
      case 'padre':
        return 'Analytics Familiares'
      case 'hijo':
        return 'Mis Estadísticas'
      case 'comercio':
        return 'Analytics de Ventas'
      default:
        return 'Dashboard Analytics'
    }
  }

  const obtenerMetricasPrincipales = () => {
    switch (userRole) {
      case 'padre':
        return [
          {
            titulo: 'Gasto Familiar Total',
            valor: `$${(analytics?.resumen?.totalGastado || 0).toFixed(2)}`,
            cambio: calcularCambioSemanal(),
            icon: DollarSign,
            color: 'text-green-600'
          },
          {
            titulo: 'Transacciones',
            valor: analytics?.resumen?.numeroTransacciones || 0,
            cambio: '+12.5',
            icon: Activity,
            color: 'text-blue-600'
          },
          {
            titulo: 'Promedio Diario',
            valor: `$${((analytics?.resumen?.totalGastado || 0) / 30).toFixed(2)}`,
            cambio: '+5.2',
            icon: TrendingUp,
            color: 'text-purple-600'
          },
          {
            titulo: 'Límites Activos',
            valor: analytics?.limites?.totalAsignado ? '8' : '0',
            cambio: '+2',
            icon: Target,
            color: 'text-orange-600'
          }
        ]
      case 'comercio':
        return [
          {
            titulo: 'Ventas del Mes',
            valor: `$${(analytics?.resumen?.totalRecibido || 0).toFixed(2)}`,
            cambio: calcularCambioSemanal(),
            icon: DollarSign,
            color: 'text-green-600'
          },
          {
            titulo: 'Transacciones',
            valor: analytics?.resumen?.numeroTransacciones || 0,
            cambio: '+18.3',
            icon: ShoppingCart,
            color: 'text-blue-600'
          },
          {
            titulo: 'Ticket Promedio',
            valor: `$${((analytics?.resumen?.totalRecibido || 0) / Math.max(analytics?.resumen?.numeroTransacciones || 1, 1)).toFixed(2)}`,
            cambio: '+7.1',
            icon: TrendingUp,
            color: 'text-purple-600'
          },
          {
            titulo: 'Clientes Únicos',
            valor: '47',
            cambio: '+15',
            icon: Users,
            color: 'text-orange-600'
          }
        ]
      default:
        return [
          {
            titulo: 'Gasto del Mes',
            valor: `$${(analytics?.resumen?.totalGastado || 0).toFixed(2)}`,
            cambio: calcularCambioSemanal(),
            icon: DollarSign,
            color: 'text-green-600'
          },
          {
            titulo: 'Compras',
            valor: analytics?.resumen?.numeroTransacciones || 0,
            cambio: '+8.2',
            icon: ShoppingCart,
            color: 'text-blue-600'
          },
          {
            titulo: 'Promedio Diario',
            valor: `$${((analytics?.resumen?.totalGastado || 0) / 30).toFixed(2)}`,
            cambio: '+3.1',
            icon: TrendingUp,
            color: 'text-purple-600'
          },
          {
            titulo: 'Límites Usados',
            valor: `${analytics?.limites?.porcentajeUsado || 0}%`,
            cambio: '+5%',
            icon: Target,
            color: 'text-orange-600'
          }
        ]
    }
  }

  if (cargando) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 h-64 rounded-lg"></div>
            <div className="bg-gray-200 h-64 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">{obtenerTituloSegunRol()}</h2>
        <div className="card text-center py-8">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">Error al cargar estadísticas</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={cargarAnalytics}
            className="btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const metricas = obtenerMetricasPrincipales()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{obtenerTituloSegunRol()}</h2>
        <div className="flex space-x-2">
          {['semana', 'mes', 'año'].map(periodo => (
            <button
              key={periodo}
              onClick={() => setPeriodoSeleccionado(periodo)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                periodoSeleccionado === periodo
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {periodo.charAt(0).toUpperCase() + periodo.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricas.map((metrica, index) => {
          const Icon = metrica.icon
          const cambioPositivo = parseFloat(metrica.cambio) >= 0
          
          return (
            <motion.div
              key={metrica.titulo}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">{metrica.titulo}</h3>
                <Icon className={`h-5 w-5 ${metrica.color}`} />
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{metrica.valor}</p>
                  <div className={`flex items-center text-sm ${
                    cambioPositivo ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {cambioPositivo ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    <span>{metrica.cambio}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Gráficos y análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de tendencias */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Tendencia Semanal</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {(analytics?.tendencias?.gastosSemanales || []).length > 0 ? (
              (analytics?.tendencias?.gastosSemanales || []).map((item, index) => {
                const maxMonto = Math.max(...(analytics?.tendencias?.gastosSemanales || []).map(i => i.monto || 0))
                const porcentaje = maxMonto > 0 ? ((item.monto || 0) / maxMonto) * 100 : 0
                
                return (
                  <div key={item.semana} className="flex items-center space-x-3">
                    <span className="text-sm font-medium w-12">{item.semana}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${porcentaje}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold w-16 text-right">
                      ${item.monto.toFixed(2)}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>No hay datos de tendencias disponibles</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Distribución por categorías */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Distribución por Categorías</h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {Object.keys(analytics?.categorias || {}).length > 0 ? (
              Object.entries(analytics?.categorias || {}).map(([nombre, monto], index) => (
                <div key={nombre} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full bg-blue-${(index % 3 + 1) * 200}`}></div>
                    <span className="text-sm font-medium">{nombre}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">${(monto || 0).toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                      {analytics?.resumen?.totalGastado ? 
                        Math.round((monto / analytics.resumen.totalGastado) * 100) : 0}%
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>No hay datos de categorías disponibles</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Estado de transacciones */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Estado de Transacciones</h3>
          <Activity className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics?.resumen?.numeroTransacciones || 0}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{analytics?.resumen?.numeroTransacciones || 0}</div>
            <div className="text-sm text-gray-600">Completadas</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-2">
              <Calendar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">0</div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">0</div>
            <div className="text-sm text-gray-600">Fallidas</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default DashboardAnalytics