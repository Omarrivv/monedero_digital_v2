import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useWeb3 } from '../context/Web3Context'
import HistorialTransacciones from '../components/transactions/HistorialTransacciones'
import HistorialTransaccionesAvanzado from '../components/transactions/HistorialTransaccionesAvanzado'
import DashboardAnalytics from '../components/analytics/DashboardAnalytics'
import productService from '../services/productService'
import { 
  Store, 
  Plus, 
  Package,
  TrendingUp,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Upload,
  Camera,
  Image as ImageIcon
} from 'lucide-react'
import toast from 'react-hot-toast'

function ComercioDashboard() {
  const [vistaActiva, setVistaActiva] = useState('overview')
  const [mostrarModalProducto, setMostrarModalProducto] = useState(false)
  const [productos, setProductos] = useState([])
  const [cargandoProductos, setCargandoProductos] = useState(true)
  const [productoEditando, setProductoEditando] = useState(null)
  const [nuevoProducto, setNuevoProducto] = useState({
    name: '',
    description: '',
    price: '',
    category: 'comida',
    stock: '',
    images: []
  })
  
  const { user } = useAuth()
  const { balance } = useWeb3()

  const vistas = [
    { id: 'overview', label: 'Resumen', icon: TrendingUp },
    { id: 'products', label: 'Productos', icon: Package },
    { id: 'sales', label: 'Ventas', icon: DollarSign },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'history', label: 'Historial', icon: Eye }
  ]

  const categorias = [
    { value: 'comida', label: 'Comida' },
    { value: 'bebida', label: 'Bebidas' },
    { value: 'postre', label: 'Postres' },
    { value: 'producto', label: 'Productos' },
    { value: 'servicio', label: 'Servicios' },
    { value: 'videojuegos', label: 'Videojuegos' },
    { value: 'accesorios', label: 'Accesorios' },
    { value: 'tarjetas', label: 'Tarjetas Regalo' },
    { value: 'calzado', label: 'Calzado' },
    { value: 'ropa', label: 'Ropa' }
  ]

  // Cargar productos al montar el componente
  useEffect(() => {
    cargarMisProductos()
  }, [])

  const cargarMisProductos = async () => {
    try {
      setCargandoProductos(true)
      const response = await productService.getMyProducts()
      if (response.success) {
        setProductos(response.products)
      }
    } catch (error) {
      console.error('Error al cargar productos:', error)
      toast.error('Error al cargar productos')
    } finally {
      setCargandoProductos(false)
    }
  }

  const estadisticasEjemplo = {
    ventasHoy: 156.50,
    ventasSemana: 1240.00,
    ventasMes: 4850.00,
    clientesUnicos: 47,
    productosVendidos: 89
  }

  const ventasRecientes = [
    {
      id: 1,
      producto: "Hamburguesa Clásica",
      cliente: "Juan P.",
      monto: 8.99,
      fecha: new Date(),
      estado: "completada"
    },
    {
      id: 2,
      producto: "Papas Fritas x2",
      cliente: "María G.",
      monto: 7.00,
      fecha: new Date(Date.now() - 3600000),
      estado: "completada"
    },
    {
      id: 3,
      producto: "Combo #1",
      cliente: "Pedro L.",
      monto: 12.50,
      fecha: new Date(Date.now() - 7200000),
      estado: "pendiente"
    }
  ]

  const handleAgregarProducto = async (e) => {
    e.preventDefault()
    
    if (!nuevoProducto.name || !nuevoProducto.description || !nuevoProducto.price) {
      toast.error('Por favor completa todos los campos')
      return
    }

    try {
      const response = await productService.createProduct({
        ...nuevoProducto,
        price: parseFloat(nuevoProducto.price),
        stock: parseInt(nuevoProducto.stock) || 0
      })

      if (response.success) {
        toast.success('Producto agregado exitosamente')
        setProductos(prev => [...prev, response.product])
        setNuevoProducto({
          name: '',
          description: '',
          price: '',
          category: 'comida',
          stock: '',
          images: []
        })
        setMostrarModalProducto(false)
      }
    } catch (error) {
      console.error('Error al agregar producto:', error)
      toast.error(error.message || 'Error al agregar producto')
    }
  }

  const toggleDisponibilidad = async (productId) => {
    try {
      const producto = productos.find(p => p._id === productId)
      const response = await productService.updateProduct(productId, {
        isActive: !producto.isActive
      })

      if (response.success) {
        setProductos(prev => prev.map(p => 
          p._id === productId ? { ...p, isActive: !p.isActive } : p
        ))
        toast.success(`Producto ${!producto.isActive ? 'activado' : 'desactivado'}`)
      }
    } catch (error) {
      console.error('Error al cambiar disponibilidad:', error)
      toast.error('Error al cambiar disponibilidad')
    }
  }

  const eliminarProducto = async (productId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return
    }

    try {
      const response = await productService.deleteProduct(productId)
      
      if (response.success) {
        setProductos(prev => prev.filter(p => p._id !== productId))
        toast.success('Producto eliminado exitosamente')
      }
    } catch (error) {
      console.error('Error al eliminar producto:', error)
      toast.error(error.message || 'Error al eliminar producto')
    }
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    setNuevoProducto(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }))
  }

  const removeImage = (index) => {
    setNuevoProducto(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">¡Hola, {user?.nombreComercio || user?.nombrePropietario}!</h1>
            <p className="text-orange-100">Gestiona tu negocio y aumenta tus ventas</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-orange-100">Balance Total</div>
            <div className="text-2xl font-bold">${estadisticasEjemplo.ventasMes.toFixed(2)}</div>
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
                  ? 'bg-white text-orange-600 shadow-sm' 
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
            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Ventas Hoy</h3>
                    <p className="text-2xl font-bold text-gray-900">${estadisticasEjemplo.ventasHoy}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Ventas Semana</h3>
                    <p className="text-2xl font-bold text-gray-900">${estadisticasEjemplo.ventasSemana}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Productos</h3>
                    <p className="text-2xl font-bold text-gray-900">{productos.length}</p>
                  </div>
                  <Package className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Clientes</h3>
                    <p className="text-2xl font-bold text-gray-900">{estadisticasEjemplo.clientesUnicos}</p>
                  </div>
                  <Store className="h-8 w-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Ventas recientes */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Ventas Recientes</h3>
                <button className="text-sm text-blue-600 hover:underline">
                  Ver todas
                </button>
              </div>
              
              <div className="space-y-3">
                {ventasRecientes.map(venta => (
                  <div key={venta.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{venta.producto}</h4>
                        <p className="text-sm text-gray-600">Cliente: {venta.cliente}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${venta.monto}</div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        venta.estado === 'completada' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {venta.estado}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gráfico de ventas (placeholder) */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Rendimiento Semanal</h3>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Gráfico de ventas</p>
                  <p className="text-sm text-gray-400">Próximamente disponible</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {vistaActiva === 'products' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Gestión de Productos</h2>
              <button
                onClick={() => setMostrarModalProducto(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Agregar Producto</span>
              </button>
            </div>

            {cargandoProductos ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando productos...</p>
              </div>
            ) : productos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productos.map(producto => (
                  <div key={producto._id} className="card">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        {producto.images && producto.images.length > 0 ? (
                          <img 
                            src={producto.images[0]} 
                            alt={producto.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleDisponibilidad(producto._id)}
                          className={`px-2 py-1 text-xs rounded-full ${
                            producto.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {producto.isActive ? 'Disponible' : 'No disponible'}
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold mb-2">{producto.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{producto.description}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-green-600">
                        ${producto.price}
                      </span>
                      <span className="text-sm text-gray-500 capitalize">
                        {producto.category}
                      </span>
                    </div>

                    {producto.stock !== undefined && (
                      <div className="text-sm text-gray-600 mb-3">
                        Stock: {producto.stock} unidades
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setProductoEditando(producto)
                          setNuevoProducto({
                            name: producto.name,
                            description: producto.description,
                            price: producto.price.toString(),
                            category: producto.category,
                            stock: producto.stock?.toString() || '',
                            images: []
                          })
                          setMostrarModalProducto(true)
                        }}
                        className="btn-outline flex-1 flex items-center justify-center space-x-1"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Editar</span>
                      </button>
                      <button 
                        onClick={() => eliminarProducto(producto._id)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No tienes productos</h3>
                <p className="text-gray-500 mb-4">Agrega tu primer producto para comenzar a vender</p>
                <button
                  onClick={() => setMostrarModalProducto(true)}
                  className="btn-primary"
                >
                  Agregar Primer Producto
                </button>
              </div>
            )}
          </motion.div>
        )}

        {vistaActiva === 'sales' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold">Reporte de Ventas</h2>
            
            {/* Estadísticas detalladas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <h3 className="font-medium text-gray-600 mb-2">Ventas del Mes</h3>
                <p className="text-3xl font-bold text-green-600">${estadisticasEjemplo.ventasMes}</p>
                <p className="text-sm text-gray-500">+12% vs mes anterior</p>
              </div>
              
              <div className="card">
                <h3 className="font-medium text-gray-600 mb-2">Productos Vendidos</h3>
                <p className="text-3xl font-bold text-blue-600">{estadisticasEjemplo.productosVendidos}</p>
                <p className="text-sm text-gray-500">Este mes</p>
              </div>
              
              <div className="card">
                <h3 className="font-medium text-gray-600 mb-2">Ticket Promedio</h3>
                <p className="text-3xl font-bold text-purple-600">
                  ${(estadisticasEjemplo.ventasMes / estadisticasEjemplo.productosVendidos).toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">Por transacción</p>
              </div>
            </div>

            {/* Productos más vendidos */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Productos Más Vendidos</h3>
              <div className="space-y-3">
                {productos.slice(0, 5).map((producto, index) => (
                  <div key={producto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-2xl">{producto.imagen}</span>
                      <div>
                        <h4 className="font-medium">{producto.nombre}</h4>
                        <p className="text-sm text-gray-600">${producto.precio}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{Math.floor(Math.random() * 50) + 5} vendidos</div>
                      <div className="text-sm text-gray-600">
                        ${(producto.precio * (Math.floor(Math.random() * 50) + 5)).toFixed(2)} total
                      </div>
                    </div>
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
            <DashboardAnalytics userRole="comercio" userId={user?._id} />
          </motion.div>
        )}

        {vistaActiva === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <HistorialTransaccionesAvanzado userRole="comercio" userId={user?._id} />
          </motion.div>
        )}
      </div>

      {/* Modal agregar producto */}
      {mostrarModalProducto && (
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold mb-4">
              {productoEditando ? 'Editar Producto' : 'Agregar Nuevo Producto'}
            </h3>
            
            <form onSubmit={handleAgregarProducto} className="space-y-4">
              <input
                type="text"
                placeholder="Nombre del producto"
                value={nuevoProducto.name}
                onChange={(e) => setNuevoProducto(prev => ({ ...prev, name: e.target.value }))}
                className="input-field"
                required
              />
              
              <textarea
                placeholder="Descripción"
                value={nuevoProducto.description}
                onChange={(e) => setNuevoProducto(prev => ({ ...prev, description: e.target.value }))}
                className="input-field"
                rows={3}
                required
              />
              
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Precio"
                  value={nuevoProducto.price}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, price: e.target.value }))}
                  className="input-field"
                  required
                />
                
                <input
                  type="number"
                  placeholder="Stock (opcional)"
                  value={nuevoProducto.stock}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, stock: e.target.value }))}
                  className="input-field"
                />
              </div>
              
              <select
                value={nuevoProducto.category}
                onChange={(e) => setNuevoProducto(prev => ({ ...prev, category: e.target.value }))}
                className="input-field"
              >
                {categorias.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>

              {/* Subir imágenes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imágenes del producto
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="product-images"
                  />
                  <label
                    htmlFor="product-images"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Haz clic para subir imágenes
                    </span>
                  </label>
                </div>

                {/* Preview de imágenes */}
                {nuevoProducto.images.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {nuevoProducto.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarModalProducto(false)
                    setProductoEditando(null)
                    setNuevoProducto({
                      name: '',
                      description: '',
                      price: '',
                      category: 'comida',
                      stock: '',
                      images: []
                    })
                  }}
                  className="btn-outline flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  {productoEditando ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default ComercioDashboard