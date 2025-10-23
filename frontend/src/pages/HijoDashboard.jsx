import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useWeb3 } from '../context/Web3Context'
import HistorialTransacciones from '../components/transactions/HistorialTransacciones'
import HistorialTransaccionesAvanzado from '../components/transactions/HistorialTransaccionesAvanzado'
import DashboardAnalytics from '../components/analytics/DashboardAnalytics'
import TiendaComercio from '../components/commerce/TiendaComercio'
import { 
  Wallet, 
  Eye, 
  ShoppingCart,
  TrendingDown,
  Clock,
  DollarSign,
  Store,
  AlertCircle
} from 'lucide-react'

function HijoDashboard() {
  const [vistaActiva, setVistaActiva] = useState('overview')
  const [comercioSeleccionado, setComercioSeleccionado] = useState(null)
  const { user } = useAuth()
  const { balance } = useWeb3()

  const vistas = [
    { id: 'overview', label: 'Resumen', icon: Wallet },
    { id: 'spend', label: 'Gastar', icon: ShoppingCart },
    { id: 'analytics', label: 'Estadísticas', icon: TrendingDown },
    { id: 'history', label: 'Historial', icon: Eye }
  ]

  const limitesEjemplo = {
    diario: { limite: 20, gastado: 8 },
    semanal: { limite: 100, gastado: 45 },
    mensual: { limite: 300, gastado: 120 }
  }

  const comerciosDisponibles = [
    {
      id: 1,
      nombre: "McDonald's",
      categoria: "alimentacion",
      imagen: "🍔",
      descripcion: "Comida rápida",
      productos: [
        { id: 1, nombre: "Big Mac", precio: 8.50 },
        { id: 2, nombre: "McNuggets x10", precio: 6.99 },
        { id: 3, nombre: "McFlurry", precio: 4.50 }
      ]
    },
    {
      id: 2,
      nombre: "GameStop",
      categoria: "entretenimiento",
      imagen: "🎮",
      descripcion: "Videojuegos y entretenimiento",
      productos: [
        { id: 4, nombre: "Juego PS5", precio: 59.99 },
        { id: 5, nombre: "Controller", precio: 39.99 },
        { id: 6, nombre: "Gift Card $20", precio: 20.00 }
      ]
    },
    {
      id: 3,
      nombre: "Nike Store",
      categoria: "ropa",
      imagen: "👟",
      descripcion: "Ropa deportiva",
      productos: [
        { id: 7, nombre: "Zapatillas Air Max", precio: 89.99 },
        { id: 8, nombre: "Camiseta Nike", precio: 29.99 },
        { id: 9, nombre: "Shorts deportivos", precio: 34.99 }
      ]
    }
  ]

  const calcularPorcentajeLimite = (gastado, limite) => {
    if (limite === 0) return 0
    return Math.min((gastado / limite) * 100, 100)
  }

  const obtenerColorLimite = (porcentaje) => {
    if (porcentaje >= 90) return 'bg-red-500'
    if (porcentaje >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">¡Hola, {user?.nombre}!</h1>
            <p className="text-green-100">Administra tu dinero de forma inteligente</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-green-100">Saldo Disponible</div>
            <div className="text-2xl font-bold">${user?.saldoDisponible || 0}</div>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {vistas.map(vista => {
          const Icon = vista.icon
          return (
            <button
              key={vista.id}
              onClick={() => setVistaActiva(vista.id)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all
                ${vistaActiva === vista.id 
                  ? 'bg-white text-green-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              <span>{vista.label}</span>
            </button>
          )
        })}
      </div>

      {/* Contenido principal */}
      <div className="space-y-6">
        {vistaActiva === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Balance y límites */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Mi Saldo</h3>
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  ${user?.saldoDisponible || 0}
                </div>
                <p className="text-sm text-gray-600">Dinero disponible para gastar</p>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Límites de Gasto</h3>
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="space-y-3">
                  {Object.entries(limitesEjemplo).map(([periodo, data]) => {
                    const porcentaje = calcularPorcentajeLimite(data.gastado, data.limite)
                    return (
                      <div key={periodo}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{periodo}</span>
                          <span>${data.gastado} / ${data.limite}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${obtenerColorLimite(porcentaje)}`}
                            style={{ width: `${porcentaje}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Alertas y notificaciones */}
            <div className="card">
              <div className="flex items-center space-x-2 mb-4">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-semibold">Notificaciones</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ Tu padre te transfirió $25.00 ayer
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Has gastado el 70% de tu límite semanal
                  </p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    ℹ️ Nuevo límite establecido para entretenimiento: $30/semana
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {vistaActiva === 'spend' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Comercios Disponibles</h2>
              <div className="text-sm text-gray-600">
                Saldo: ${user?.saldoDisponible || 0}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comerciosDisponibles.map(comercio => (
                <div key={comercio.id} className="card hover:shadow-lg transition-shadow">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">{comercio.imagen}</div>
                    <h3 className="text-lg font-semibold">{comercio.nombre}</h3>
                    <p className="text-sm text-gray-600 capitalize">{comercio.categoria}</p>
                    <p className="text-xs text-gray-500">{comercio.descripcion}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Productos populares:</h4>
                    {comercio.productos.slice(0, 3).map(producto => (
                      <div key={producto.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">{producto.nombre}</span>
                        <span className="text-sm font-medium">${producto.precio}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => {
                      setComercioSeleccionado(comercio)
                      setVistaActiva('tienda')
                    }}
                    className="btn-primary w-full mt-4 flex items-center justify-center space-x-2"
                  >
                    <Store className="h-4 w-4" />
                    <span>Ver Tienda</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Resumen de categorías permitidas */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Categorías de Gasto Permitidas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['alimentacion', 'educacion', 'entretenimiento', 'deportes', 'tecnologia', 'ropa', 'salud', 'transporte'].map(categoria => (
                  <div key={categoria} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-1">
                      {categoria === 'alimentacion' && '🍔'}
                      {categoria === 'educacion' && '📚'}
                      {categoria === 'entretenimiento' && '🎮'}
                      {categoria === 'deportes' && '⚽'}
                      {categoria === 'tecnologia' && '💻'}
                      {categoria === 'ropa' && '👕'}
                      {categoria === 'salud' && '🏥'}
                      {categoria === 'transporte' && '🚌'}
                    </div>
                    <p className="text-xs capitalize text-gray-600">{categoria}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {vistaActiva === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <DashboardAnalytics userRole="hijo" userId={user?._id} />
          </motion.div>
        )}

        {vistaActiva === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <HistorialTransaccionesAvanzado userRole="hijo" userId={user?._id} />
          </motion.div>
        )}

        {vistaActiva === 'tienda' && comercioSeleccionado && (
          <TiendaComercio 
            comercio={comercioSeleccionado}
            onVolver={() => {
              setVistaActiva('spend')
              setComercioSeleccionado(null)
            }}
          />
        )}
      </div>
    </div>
  )
}

export default HijoDashboard