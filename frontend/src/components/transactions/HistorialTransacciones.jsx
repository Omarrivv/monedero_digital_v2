import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  History, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  Calendar,
  DollarSign,
  User,
  Store,
  Search,
  Download,
  Eye
} from 'lucide-react'
import apiService from '../../services/apiService'
import { useWeb3 } from '../../context/Web3Context'
import toast from 'react-hot-toast'

function HistorialTransacciones({ userRole, userId }) {
  const [transacciones, setTransacciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({
    tipo: 'todas',
    categoria: 'todas',
    fechaInicio: '',
    fechaFin: '',
    busqueda: ''
  })
  const [paginaActual, setPaginaActual] = useState(1)
  const [transaccionesPorPagina] = useState(10)
  const [mostrarDetalles, setMostrarDetalles] = useState(null)
  
  const { account } = useWeb3()

  const categorias = [
    'todas',
    'alimentacion',
    'educacion', 
    'entretenimiento',
    'deportes',
    'tecnologia',
    'ropa',
    'salud',
    'transporte',
    'deposito',
    'otros'
  ]

  const tipos = [
    { value: 'todas', label: 'Todas' },
    { value: 'deposito', label: 'Depósitos' },
    { value: 'pago', label: 'Pagos' },
    { value: 'transferencia', label: 'Transferencias' }
  ]

  useEffect(() => {
    cargarTransacciones()
  }, [account])

  const cargarTransacciones = async () => {
    try {
      setLoading(true)
      const response = await apiService.get('/users/transactions')
      setTransacciones(response.data.transactions || [])
    } catch (error) {
      console.error('Error cargando transacciones:', error)
      // No mostrar toast de error si no hay transacciones
      setTransacciones([])
    } finally {
      setLoading(false)
    }
  }

  const filtrarTransacciones = () => {
    let transaccionesFiltradas = [...transacciones]

    // Filtro por tipo
    if (filtros.tipo !== 'todas') {
      transaccionesFiltradas = transaccionesFiltradas.filter(
        tx => tx.tipo === filtros.tipo
      )
    }

    // Filtro por categoría
    if (filtros.categoria !== 'todas') {
      transaccionesFiltradas = transaccionesFiltradas.filter(
        tx => tx.categoria === filtros.categoria
      )
    }

    // Filtro por fechas
    if (filtros.fechaInicio) {
      const fechaInicio = new Date(filtros.fechaInicio)
      transaccionesFiltradas = transaccionesFiltradas.filter(
        tx => new Date(tx.createdAt) >= fechaInicio
      )
    }

    if (filtros.fechaFin) {
      const fechaFin = new Date(filtros.fechaFin)
      fechaFin.setHours(23, 59, 59, 999)
      transaccionesFiltradas = transaccionesFiltradas.filter(
        tx => new Date(tx.createdAt) <= fechaFin
      )
    }

    // Filtro por búsqueda
    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase()
      transaccionesFiltradas = transaccionesFiltradas.filter(tx =>
        tx.concepto.toLowerCase().includes(busqueda) ||
        tx.from.nombre.toLowerCase().includes(busqueda) ||
        tx.to.nombre.toLowerCase().includes(busqueda) ||
        tx.txHash.toLowerCase().includes(busqueda)
      )
    }

    return transaccionesFiltradas.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  const transaccionesFiltradas = filtrarTransacciones()
  const indiceInicio = (paginaActual - 1) * transaccionesPorPagina
  const transaccionesPagina = transaccionesFiltradas.slice(
    indiceInicio, 
    indiceInicio + transaccionesPorPagina
  )
  const totalPaginas = Math.ceil(transaccionesFiltradas.length / transaccionesPorPagina)

  const esTransaccionEntrante = (tx) => {
    return tx.to.walletAddress.toLowerCase() === account.toLowerCase()
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatearMonto = (monto) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(monto)
  }

  const obtenerIconoCategoria = (categoria) => {
    const iconos = {
      alimentacion: '🍔',
      educacion: '📚',
      entretenimiento: '🎮',
      deportes: '⚽',
      tecnologia: '💻',
      ropa: '👕',
      salud: '🏥',
      transporte: '🚌',
      deposito: '💰',
      otros: '📝'
    }
    return iconos[categoria] || '📝'
  }

  const obtenerEstadoColor = (estado) => {
    const colores = {
      confirmada: 'text-green-600 bg-green-100',
      pendiente: 'text-yellow-600 bg-yellow-100',
      fallida: 'text-red-600 bg-red-100'
    }
    return colores[estado] || 'text-gray-600 bg-gray-100'
  }

  const exportarTransacciones = () => {
    const csv = [
      ['Fecha', 'Tipo', 'De', 'Para', 'Monto', 'Concepto', 'Categoría', 'Estado', 'Hash'].join(','),
      ...transaccionesFiltradas.map(tx => [
        formatearFecha(tx.createdAt),
        tx.tipo,
        tx.from.nombre,
        tx.to.nombre,
        tx.monto,
        tx.concepto,
        tx.categoria,
        tx.estado,
        tx.txHash
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historial_transacciones_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <History className="h-6 w-6 text-primary-600" />
          <h3 className="text-xl font-semibold">Historial de Transacciones</h3>
        </div>
        <button
          onClick={exportarTransacciones}
          className="btn-outline flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Exportar</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo</label>
            <select
              value={filtros.tipo}
              onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
              className="input-field"
            >
              {tipos.map(tipo => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Categoría</label>
            <select
              value={filtros.categoria}
              onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
              className="input-field"
            >
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>
                  {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fecha inicio</label>
            <input
              type="date"
              value={filtros.fechaInicio}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaInicio: e.target.value }))}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fecha fin</label>
            <input
              type="date"
              value={filtros.fechaFin}
              onChange={(e) => setFiltros(prev => ({ ...prev, fechaFin: e.target.value }))}
              className="input-field"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por concepto, usuario o hash..."
              value={filtros.busqueda}
              onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
              className="input-field pl-10"
            />
          </div>
        </div>
      </div>

      {/* Lista de transacciones */}
      <div className="space-y-3">
        <AnimatePresence>
          {transaccionesPagina.map((tx, index) => {
            const esEntrante = esTransaccionEntrante(tx)
            
            return (
              <motion.div
                key={tx._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setMostrarDetalles(tx)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`
                      p-2 rounded-full 
                      ${esEntrante ? 'bg-green-100' : 'bg-red-100'}
                    `}>
                      {esEntrante 
                        ? <ArrowDownLeft className="h-5 w-5 text-green-600" />
                        : <ArrowUpRight className="h-5 w-5 text-red-600" />
                      }
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{obtenerIconoCategoria(tx.categoria)}</span>
                        <h4 className="font-medium">{tx.concepto}</h4>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>
                          {esEntrante ? 'De:' : 'Para:'} {esEntrante ? tx.from.nombre : tx.to.nombre}
                        </span>
                        <span>{formatearFecha(tx.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`
                      text-lg font-bold
                      ${esEntrante ? 'text-green-600' : 'text-red-600'}
                    `}>
                      {esEntrante ? '+' : '-'}{formatearMonto(tx.monto)}
                    </div>
                    
                    <span className={`
                      inline-block px-2 py-1 rounded-full text-xs font-medium
                      ${obtenerEstadoColor(tx.estado)}
                    `}>
                      {tx.estado}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Mostrando {indiceInicio + 1}-{Math.min(indiceInicio + transaccionesPorPagina, transaccionesFiltradas.length)} de {transaccionesFiltradas.length}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
              disabled={paginaActual === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Anterior
            </button>
            
            <span className="px-3 py-1">
              {paginaActual} de {totalPaginas}
            </span>
            
            <button
              onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
              disabled={paginaActual === totalPaginas}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal de detalles */}
      <AnimatePresence>
        {mostrarDetalles && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">Detalles de Transacción</h4>
                <button 
                  onClick={() => setMostrarDetalles(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Hash:</span>
                  <span className="font-mono text-xs">{mostrarDetalles.txHash?.slice(0, 10)}...</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="capitalize">{mostrarDetalles.tipo}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto:</span>
                  <span className="font-bold">{formatearMonto(mostrarDetalles.monto)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Categoría:</span>
                  <span className="capitalize">{mostrarDetalles.categoria}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`capitalize ${obtenerEstadoColor(mostrarDetalles.estado)}`}>
                    {mostrarDetalles.estado}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Red:</span>
                  <span className="capitalize">{mostrarDetalles.red}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span>{formatearFecha(mostrarDetalles.createdAt)}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mensaje si no hay transacciones */}
      {transaccionesFiltradas.length === 0 && (
        <div className="text-center py-8">
          <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">No hay transacciones</h4>
          <p className="text-gray-500">
            {transacciones.length === 0 
              ? 'Aún no tienes transacciones registradas'
              : 'No se encontraron transacciones con los filtros aplicados'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default HistorialTransacciones