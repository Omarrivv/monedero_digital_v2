import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useWeb3 } from '../context/Web3Context'
import productService from '../services/productService'
import HistorialTransacciones from '../components/transactions/HistorialTransacciones'
import HistorialTransaccionesAvanzado from '../components/transactions/HistorialTransaccionesAvanzado'
import DashboardAnalytics from '../components/analytics/DashboardAnalytics'
import TiendaComercio from '../components/commerce/TiendaComercio'
import { SIMPLE_TRANSFER_ADDRESS, SIMPLE_TRANSFER_ABI } from '../config/contracts'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'
import {
  Wallet,
  Eye,
  ShoppingCart,
  TrendingDown,
  Clock,
  DollarSign,
  Store,
  AlertCircle,
  Search,
  RefreshCw,
  ChevronDown,
  Globe
} from 'lucide-react'

function HijoDashboard() {
  const [vistaActiva, setVistaActiva] = useState('overview')
  const [comercioSeleccionado, setComercioSeleccionado] = useState(null)
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [todayLimit, setTodayLimit] = useState(null)
  const [availableBalance, setAvailableBalance] = useState(0)
  const [showNetworks, setShowNetworks] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  const { user } = useAuth()
  const { balance, network, switchNetwork, refreshBalance, getSupportedNetworks, isConnecting, signer } = useWeb3()

  // Calcular límite de hoy
  useEffect(() => {
    console.log('👤 Usuario completo:', user)
    console.log('📊 SpendingLimits del usuario:', user?.spendingLimits)

    if (user && user.spendingLimits) {
      const today = new Date().toISOString().split('T')[0]
      console.log('📅 Fecha de hoy (UTC):', today)
      console.log('🔍 Todas las fechas en spendingLimits:', Object.keys(user.spendingLimits))

      const limit = user.spendingLimits[today]
      console.log('💰 Límite encontrado para hoy:', limit)

      setTodayLimit(limit)
    } else {
      console.log('⚠️ No hay usuario o no tiene spendingLimits')
    }
  }, [user])

  // Calcular saldo disponible basado en límite y balance real
  useEffect(() => {
    const walletBalance = parseFloat(balance || '0')
    let calculatedAvailable = walletBalance

    if (todayLimit && todayLimit.activo) {
      calculatedAvailable = Math.min(walletBalance, todayLimit.limite)
    }

    setAvailableBalance(calculatedAvailable)
  }, [balance, todayLimit])

  // Cargar productos cuando se activa la vista de gastar
  useEffect(() => {
    if (vistaActiva === 'spend') {
      fetchProducts()
    }
  }, [vistaActiva])

  // Refrescar balance al montar (solo una vez)
  useEffect(() => {
    if (balance === '0' || !balance) {
      refreshBalance()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true)
      const data = await productService.getProducts({ isActive: true })
      if (data.success) {
        setProducts(data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleNetworkSwitch = async (networkKey) => {
    await switchNetwork(networkKey)
    setShowNetworks(false)
  }

  const vistas = [
    { id: 'overview', label: 'Resumen', icon: Wallet },
    { id: 'spend', label: 'Gastar', icon: ShoppingCart },
    { id: 'analytics', label: 'Estadísticas', icon: TrendingDown },
    { id: 'history', label: 'Historial', icon: Eye }
  ]

  const allNetworks = getSupportedNetworks()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">¡Hola, {user?.name || user?.nombre || ''}!</h1>
            <p className="text-green-100">Administra tu dinero de forma inteligente</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Selector de Red */}
            <div className="relative">
              <button
                onClick={() => setShowNetworks(!showNetworks)}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors text-sm"
              >
                <Globe className="h-4 w-4" />
                <span>{network?.name || 'Red Desconocida'}</span>
                <ChevronDown className="h-3 w-3" />
              </button>

              {showNetworks && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50 text-gray-800">
                  <div className="p-2 border-b border-gray-100 text-xs font-semibold text-gray-500">
                    Seleccionar Red
                  </div>
                  {Object.entries(allNetworks).map(([key, net]) => (
                    <button
                      key={key}
                      onClick={() => handleNetworkSwitch(key)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                    >
                      <span>{net.chainName}</span>
                      {network?.chainId === BigInt(net.chainId) && (
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="text-right">
              <div className="text-sm text-green-100 flex items-center justify-end gap-2">
                <span>Disponible para Hoy</span>
                <button onClick={refreshBalance} className="hover:bg-white/20 p-1 rounded-full transition-colors" title="Actualizar saldo">
                  <RefreshCw className={`h-3 w-3 ${isConnecting ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className="text-2xl font-bold">${availableBalance.toFixed(4)}</div>
              {todayLimit && todayLimit.activo && (
                <div className="text-xs text-green-200 mt-1">Límite diario: ${todayLimit.limite}</div>
              )}
            </div>
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

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Disponible para gastar hoy</p>
                    <div className="text-3xl font-bold text-green-600">
                      ${availableBalance.toFixed(4)}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Saldo Total en Billetera:</span>
                      <span className="font-medium text-gray-900 flex items-center gap-1">
                        ${parseFloat(balance || '0').toFixed(4)}
                        <span className="text-xs text-gray-400">ETH</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Límites de Gasto</h3>
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="space-y-3">
                  {todayLimit && todayLimit.activo ? (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600">Límite de Hoy:</span>
                        <span className="font-bold text-blue-600">${todayLimit.limite}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${Math.min((availableBalance / todayLimit.limite) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {todayLimit.categorias && todayLimit.categorias.length > 0
                          ? `Categorías permitidas: ${todayLimit.categorias.join(', ')}`
                          : 'Todas las categorías permitidas'}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No hay límite específico establecido para hoy.</p>
                  )}
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
                <p className="text-gray-500 text-sm">No tienes notificaciones nuevas.</p>
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
              <h2 className="text-2xl font-bold">Productos Disponibles</h2>
              <div className="text-sm text-gray-600">
                Disponible: ${availableBalance.toFixed(2)}
              </div>
            </div>

            {loadingProducts ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <div key={product._id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-gray-100">
                    <div className="h-48 bg-gray-200 relative">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Store className="h-12 w-12" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-medium text-gray-600 shadow-sm">
                        {product.category}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-green-600">${product.price}</span>
                        <button
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 ${product.price > availableBalance
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          onClick={() => {
                            if (product.price <= availableBalance) {
                              setComercioSeleccionado(product)
                            }
                          }}
                          disabled={product.price > availableBalance}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          <span>{product.price > availableBalance ? 'Saldo Insuficiente' : 'Comprar'}</span>
                        </button>
                      </div>
                      {product.comercio && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center space-x-2">
                          <Store className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500 truncate">
                            {product.comercio.name || 'Comercio'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <Store className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No hay productos disponibles en este momento.</p>
              </div>
            )}

            {/* Resumen de categorías permitidas */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Categorías de Gasto Permitidas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {todayLimit && todayLimit.categorias && todayLimit.categorias.length > 0 ? (
                  todayLimit.categorias.map((cat, index) => (
                    <div key={index} className="p-3 bg-green-50 text-green-700 rounded-lg text-center text-sm font-medium capitalize">
                      {cat}
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-green-50 text-green-700 rounded-lg text-center text-sm font-medium col-span-2">
                    Todas las categorías permitidas
                  </div>
                )}
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