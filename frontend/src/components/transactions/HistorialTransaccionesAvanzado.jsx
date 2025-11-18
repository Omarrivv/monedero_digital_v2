import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import paymentService from '../../services/paymentService'
import API_CONFIG from '../../config/apiConfig.js'
import { 
  Calendar,
  Filter,
  Search,
  Download,
  Eye,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Package,
  Store,
  User
} from 'lucide-react'
import toast from 'react-hot-toast'

// 🚀 USAR CONFIGURACIÓN CENTRALIZADA
const API_BASE = API_CONFIG.BASE_URL

function HistorialTransaccionesAvanzado({ userRole, userId, redFiltro, redesDisponibles }) {
  const [transacciones, setTransacciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [filtros, setFiltros] = useState({
    tipo: '',
    estado: '',
    fechaInicio: '',
    fechaFin: '',
    busqueda: '',
    red: ''
  })
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [transaccionSeleccionada, setTransaccionSeleccionada] = useState(null)
  const [mostrarDetalles, setMostrarDetalles] = useState(false)

  // Función para obtener información de la red
  const getRedInfo = (chainId) => {
    if (!redesDisponibles) {
      return { nombre: 'Red Desconocida', icon: '❓', color: 'bg-gray-100 text-gray-600' }
    }
    
    return redesDisponibles.find(red => red.chainId === chainId?.toString()) || {
      nombre: 'Red Desconocida',
      icon: '❓',
      color: 'bg-gray-100 text-gray-600'
    }
  }

  // Función para obtener URL del explorer
  const getExplorerUrl = (txHash, chainId) => {
    const cleanHash = txHash?.replace(/_+$/, '').trim() || txHash
    
    if (!cleanHash) {
      return '#'
    }

    switch (chainId?.toString()) {
      case '1': // Ethereum Mainnet
        return `https://etherscan.io/tx/${cleanHash}`
      case '11155111': // Sepolia
        return `https://sepolia.etherscan.io/tx/${cleanHash}`
      case '17000': // Holesky
        return `https://holesky.etherscan.io/tx/${cleanHash}`
      case '560048': // Hoodi
        return `https://hoodi.etherscan.io/tx/${cleanHash}`
      default:
        return `https://sepolia.etherscan.io/tx/${cleanHash}`
    }
  }

  // Función para filtrar transacciones por red
  const filtrarPorRed = (transacciones) => {
    console.log('🌐 Filtrando por red:', redFiltro)
    console.log('📊 Transacciones antes del filtro:', transacciones.length)
    
    if (!redFiltro || redFiltro === 'todas') {
      console.log('✅ Mostrando todas las redes')
      return transacciones
    }

    const redInfo = redesDisponibles?.find(r => r.id === redFiltro)
    if (!redInfo) {
      console.log('❌ Red no encontrada:', redFiltro)
      return transacciones
    }

    console.log('🔍 Filtrando por red:', redInfo.nombre, 'Chain ID:', redInfo.chainId)

    const filtradas = transacciones.filter(tx => {
      const coincideChainId = tx.chainId === redInfo.chainId
      const coincideNetwork = tx.network === redFiltro
      
      console.log('🔍 TX:', tx._id?.slice(-6), 'ChainId:', tx.chainId, 'Network:', tx.network, 'Coincide:', coincideChainId || coincideNetwork)
      
      return coincideChainId || coincideNetwork
    })

    console.log('✅ Transacciones filtradas:', filtradas.length)
    return filtradas
  }

  useEffect(() => {
    cargarTransacciones()
  }, [filtros, paginaActual])

  // Actualizar filtro cuando cambie la red seleccionada desde el padre
  useEffect(() => {
    if (redFiltro !== filtros.red) {
      setFiltros(prev => ({ ...prev, red: redFiltro }))
    }
  }, [redFiltro])

  const cargarTransacciones = async () => {
    try {
      setCargando(true)
      // Usar el endpoint de transacciones simples que tiene la info de red
      const token = localStorage.getItem('authToken')
  const response = await fetch(`${API_BASE}/transacciones-simples/mis-transacciones`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()

      console.log('🔍 HISTORIAL - Respuesta completa:', data)
      
      if (data.success) {
        const transaccionesRaw = data.transactions || []
        console.log('📊 HISTORIAL - Transacciones recibidas:', transaccionesRaw)
        console.log('📊 HISTORIAL - Primera transacción:', transaccionesRaw?.[0])
        
        if (transaccionesRaw.length > 0) {
          const primera = transaccionesRaw[0]
          console.log('🔍 HISTORIAL - Detalles de primera transacción:')
          console.log('  - _id:', primera._id)
          console.log('  - amount:', primera.amount, 'tipo:', typeof primera.amount)
          console.log('  - type:', primera.type)
          console.log('  - status:', primera.status)
          console.log('  - description:', primera.description)
        }
        
        // Mapear y normalizar los datos de las transacciones
        const transaccionesNormalizadas = transaccionesRaw.map((t, index) => {
          const normalized = {
            ...t,
            amount: Number(t.amount) || 0,
            type: t.type || 'unknown',
            status: t.status || 'pending',
            createdAt: t.createdAt || new Date().toISOString(),
            updatedAt: t.updatedAt || t.createdAt || new Date().toISOString()
          }
          
          if (index === 0) {
            console.log('✅ HISTORIAL - Primera transacción normalizada:', normalized)
            console.log('✅ HISTORIAL - Amount normalizado:', normalized.amount, 'tipo:', typeof normalized.amount)
          }
          
          return normalized
        })
        
        console.log('✅ HISTORIAL - Total transacciones normalizadas:', transaccionesNormalizadas.length)
        
        // Aplicar filtros locales
        let transaccionesFiltradas = transaccionesNormalizadas

        // Filtro por red
        if (filtros.red && filtros.red !== 'todas') {
          const redInfo = redesDisponibles?.find(r => r.id === filtros.red)
          if (redInfo) {
            transaccionesFiltradas = transaccionesFiltradas.filter(tx => 
              tx.chainId === redInfo.chainId || tx.network === filtros.red
            )
          }
        }

        // Filtro por tipo
        if (filtros.tipo) {
          transaccionesFiltradas = transaccionesFiltradas.filter(tx => 
            tx.type === filtros.tipo
          )
        }

        // Filtro por estado
        if (filtros.estado) {
          transaccionesFiltradas = transaccionesFiltradas.filter(tx => 
            tx.status === filtros.estado
          )
        }

        // Filtro por búsqueda
        if (filtros.busqueda) {
          const busqueda = filtros.busqueda.toLowerCase()
          transaccionesFiltradas = transaccionesFiltradas.filter(tx => 
            tx.description?.toLowerCase().includes(busqueda) ||
            tx.txHash?.toLowerCase().includes(busqueda)
          )
        }

        console.log('🌐 HISTORIAL - Transacciones después de todos los filtros:', transaccionesFiltradas.length)
        
        setTransacciones(transaccionesFiltradas)
        setTotalPaginas(data.totalPages || 1)
      }
    } catch (error) {
      console.error('Error al cargar transacciones:', error)
      toast.error('Error al cargar el historial de transacciones')
    } finally {
      setCargando(false)
    }
  }

  const handleFiltroChange = (campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor
    }))
    setPaginaActual(1) // Resetear a la primera página
  }

  const limpiarFiltros = () => {
    setFiltros({
      tipo: '',
      estado: '',
      fechaInicio: '',
      fechaFin: '',
      busqueda: ''
    })
    setPaginaActual(1)
  }

  const verDetalles = async (transaccionId) => {
    try {
      console.log('🔍 Obteniendo detalles de transacción:', transaccionId)
      
      // Buscar la transacción en el estado local primero
      const transaccionLocal = transacciones.find(tx => tx._id === transaccionId)
      
      if (transaccionLocal) {
        console.log('✅ Transacción encontrada localmente:', transaccionLocal)
        setTransaccionSeleccionada(transaccionLocal)
        setMostrarDetalles(true)
      } else {
        // Si no está en local, buscar en el servidor
        const token = localStorage.getItem('authToken')
  const response = await fetch(`${API_BASE}/transacciones-simples/mis-transacciones`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        const data = await response.json()
        
        if (data.success) {
          const transaccion = data.transactions.find(tx => tx._id === transaccionId)
          if (transaccion) {
            console.log('✅ Transacción encontrada en servidor:', transaccion)
            setTransaccionSeleccionada(transaccion)
            setMostrarDetalles(true)
          } else {
            toast.error('Transacción no encontrada')
          }
        } else {
          toast.error('Error al cargar los detalles')
        }
      }
    } catch (error) {
      console.error('❌ Error al obtener detalles:', error)
      toast.error('Error al cargar los detalles de la transacción')
    }
  }

  const obtenerIconoTipo = (tipo) => {
    switch (tipo) {
      case 'transferencia':
      case 'transfer':
        return <ArrowUpRight className="h-5 w-5 text-blue-600" />
      case 'recepcion':
      case 'receive':
        return <ArrowDownLeft className="h-5 w-5 text-green-600" />
      case 'pago_comercio':
      case 'payment':
        return <Store className="h-5 w-5 text-purple-600" />
      default:
        return <Package className="h-5 w-5 text-gray-600" />
    }
  }

  const obtenerIconoEstado = (estado) => {
    switch (estado) {
      case 'completed':
      case 'completada':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending':
      case 'pendiente':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'failed':
      case 'fallida':
      case 'cancelled':
      case 'cancelada':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const obtenerColorEstado = (estado) => {
    switch (estado) {
      case 'completed':
      case 'completada':
        return 'bg-green-100 text-green-800'
      case 'pending':
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
      case 'fallida':
      case 'cancelled':
      case 'cancelada':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const exportarHistorial = () => {
    // Implementar exportación a CSV/PDF
    toast.success('Función de exportación próximamente disponible')
  }

  return (
    <div className="space-y-6">
      {/* Header y filtros */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Historial de Transacciones</h2>
          <button
            onClick={exportarHistorial}
            className="btn-outline flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={filtros.busqueda}
              onChange={(e) => handleFiltroChange('busqueda', e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <select
            value={filtros.tipo}
            onChange={(e) => handleFiltroChange('tipo', e.target.value)}
            className="input-field"
          >
            <option value="">Todos los tipos</option>
            <option value="transferencia">Transferencias</option>
            <option value="pago_comercio">Pagos a comercios</option>
            <option value="recepcion">Recepciones</option>
          </select>

          <select
            value={filtros.estado}
            onChange={(e) => handleFiltroChange('estado', e.target.value)}
            className="input-field"
          >
            <option value="">Todos los estados</option>
            <option value="completed">Completadas</option>
            <option value="pending">Pendientes</option>
            <option value="failed">Fallidas</option>
            <option value="cancelled">Canceladas</option>
          </select>

          {redesDisponibles && (
            <select
              value={filtros.red}
              onChange={(e) => handleFiltroChange('red', e.target.value)}
              className="input-field"
            >
              <option value="">Todas las redes</option>
              {redesDisponibles.map(red => (
                <option key={red.id} value={red.id}>
                  {red.icon} {red.nombre}
                </option>
              ))}
            </select>
          )}

          <input
            type="date"
            value={filtros.fechaInicio}
            onChange={(e) => handleFiltroChange('fechaInicio', e.target.value)}
            className="input-field"
            placeholder="Fecha inicio"
          />

          <input
            type="date"
            value={filtros.fechaFin}
            onChange={(e) => handleFiltroChange('fechaFin', e.target.value)}
            className="input-field"
            placeholder="Fecha fin"
          />
        </div>

        <button
          onClick={limpiarFiltros}
          className="text-sm text-blue-600 hover:underline"
        >
          Limpiar filtros
        </button>
      </div>

      {/* Lista de transacciones */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {cargando ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando transacciones...</p>
          </div>
        ) : transacciones.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Red
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transacciones.map((transaccion, index) => (
                    <motion.tr
                      key={transaccion._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {obtenerIconoTipo(transaccion.type)}
                          <span className="text-sm font-medium capitalize">
                            {transaccion.type?.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {transaccion.description}
                        </div>
                        {transaccion.metadata?.productos && (
                          <div className="text-xs text-gray-500">
                            {transaccion.metadata.productos.length} producto(s)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${
                          transaccion.type === 'recepcion' || transaccion.type === 'receive'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {transaccion.type === 'recepcion' || transaccion.type === 'receive' ? '+' : '-'}
                          ${Number(transaccion.amount || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {obtenerIconoEstado(transaccion.status)}
                          <span className={`px-2 py-1 text-xs rounded-full ${obtenerColorEstado(transaccion.status)}`}>
                            {transaccion.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getRedInfo(transaccion.chainId || transaccion.network).color}`}>
                            {getRedInfo(transaccion.chainId || transaccion.network).icon} {getRedInfo(transaccion.chainId || transaccion.network).nombre.split(' ')[0]}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatearFecha(transaccion.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => verDetalles(transaccion._id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Ver</span>
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Página {paginaActual} de {totalPaginas}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                      disabled={paginaActual === 1}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                      disabled={paginaActual === totalPaginas}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No hay transacciones</h3>
            <p className="text-gray-500">No se encontraron transacciones con los filtros aplicados.</p>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {mostrarDetalles && transaccionSeleccionada && (
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Detalles de Transacción</h3>
              <button
                onClick={() => setMostrarDetalles(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* ID y Estado */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">ID de Transacción</label>
                  <p className="text-sm text-gray-900 font-mono break-all">{transaccionSeleccionada._id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Estado</label>
                  <div className="flex items-center space-x-2 mt-1">
                    {obtenerIconoEstado(transaccionSeleccionada.status)}
                    <span className={`px-2 py-1 text-xs rounded-full ${obtenerColorEstado(transaccionSeleccionada.status)}`}>
                      {transaccionSeleccionada.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Hash de Blockchain */}
              {transaccionSeleccionada.txHash && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Hash de Blockchain</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm text-gray-900 font-mono break-all">
                      {transaccionSeleccionada.txHash}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(transaccionSeleccionada.txHash)
                        toast.success('Hash copiado al portapapeles')
                      }}
                      className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Tipo y Monto */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Tipo</label>
                  <p className="text-sm text-gray-900 capitalize">{transaccionSeleccionada.type?.replace('_', ' ') || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Monto</label>
                  <p className="text-lg font-semibold text-green-600">
                    ${Number(transaccionSeleccionada.amount || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="text-sm font-medium text-gray-600">Descripción</label>
                <p className="text-sm text-gray-900">{transaccionSeleccionada.description || 'Sin descripción'}</p>
              </div>

              {/* Red y Chain ID */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Red Blockchain</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRedInfo(transaccionSeleccionada.chainId || transaccionSeleccionada.network).color}`}>
                      {getRedInfo(transaccionSeleccionada.chainId || transaccionSeleccionada.network).icon} {getRedInfo(transaccionSeleccionada.chainId || transaccionSeleccionada.network).nombre}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Chain ID</label>
                  <p className="text-sm text-gray-900 font-mono">{transaccionSeleccionada.chainId || 'N/A'}</p>
                </div>
              </div>

              {/* Enlace al Explorer */}
              {transaccionSeleccionada.txHash && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Ver en Explorer</label>
                  <div className="mt-1">
                    <a
                      href={getExplorerUrl(transaccionSeleccionada.txHash, transaccionSeleccionada.chainId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Abrir en {getRedInfo(transaccionSeleccionada.chainId || transaccionSeleccionada.network).nombre} Explorer</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Fecha de Creación</label>
                  <p className="text-sm text-gray-900">{formatearFecha(transaccionSeleccionada.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Fecha de Actualización</label>
                  <p className="text-sm text-gray-900">{formatearFecha(transaccionSeleccionada.updatedAt)}</p>
                </div>
              </div>

              {/* Fecha de Completado (si existe) */}
              {transaccionSeleccionada.completedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Fecha de Completado</label>
                  <p className="text-sm text-gray-900">{formatearFecha(transaccionSeleccionada.completedAt)}</p>
                </div>
              )}

              {/* Información de Gas (si existe) */}
              {(transaccionSeleccionada.gasUsed || transaccionSeleccionada.gasPrice || transaccionSeleccionada.blockNumber) && (
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Información de Blockchain</label>
                  <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                    {transaccionSeleccionada.blockNumber && (
                      <div>
                        <span className="text-xs text-gray-500">Bloque</span>
                        <p className="text-sm font-medium">{transaccionSeleccionada.blockNumber}</p>
                      </div>
                    )}
                    {transaccionSeleccionada.gasUsed && (
                      <div>
                        <span className="text-xs text-gray-500">Gas Usado</span>
                        <p className="text-sm font-medium">{transaccionSeleccionada.gasUsed}</p>
                      </div>
                    )}
                    {transaccionSeleccionada.gasPrice && (
                      <div>
                        <span className="text-xs text-gray-500">Precio Gas</span>
                        <p className="text-sm font-medium">{transaccionSeleccionada.gasPrice}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notas (si existen) */}
              {transaccionSeleccionada.metadata?.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Notas</label>
                  <p className="text-sm text-gray-900">{transaccionSeleccionada.metadata.notes}</p>
                </div>
              )}

              {/* Productos (si existen) */}
              {transaccionSeleccionada.metadata?.productos && transaccionSeleccionada.metadata.productos.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-2 block">Productos</label>
                  <div className="space-y-2">
                    {transaccionSeleccionada.metadata.productos.map((producto, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <span className="text-sm font-medium">{producto.nombre}</span>
                          <span className="text-xs text-gray-500 ml-2">x{producto.cantidad}</span>
                        </div>
                        <span className="text-sm font-semibold">
                          ${((producto.subtotal || (producto.precio * producto.cantidad)) || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Información de Cancelación (si existe) */}
              {transaccionSeleccionada.cancelledAt && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <label className="text-sm font-medium text-red-800">Información de Cancelación</label>
                  <p className="text-sm text-red-700 mt-1">
                    Cancelada el: {formatearFecha(transaccionSeleccionada.cancelledAt)}
                  </p>
                  {transaccionSeleccionada.cancelReason && (
                    <p className="text-sm text-red-700">
                      Motivo: {transaccionSeleccionada.cancelReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default HistorialTransaccionesAvanzado