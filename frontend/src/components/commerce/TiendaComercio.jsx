import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useWeb3 } from '../../context/Web3Context'
import productService from '../../services/productService'
import paymentService from '../../services/paymentService'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  CreditCard,
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  Phone,
  Globe,
  Package
} from 'lucide-react'
import toast from 'react-hot-toast'

function TiendaComercio({ comercio, onVolver }) {
  const [carrito, setCarrito] = useState([])
  const [mostrarCheckout, setMostrarCheckout] = useState(false)
  const [procesandoPago, setProcesandoPago] = useState(false)
  const [productos, setProductos] = useState([])
  const [cargandoProductos, setCargandoProductos] = useState(true)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todos')
  const { user } = useAuth()
  const { account, contract, signer } = useWeb3()

  // Cargar productos del comercio
  useEffect(() => {
    cargarProductosComercio()
  }, [comercio])

  const cargarProductosComercio = async () => {
    try {
      setCargandoProductos(true)
      const response = await productService.getProductsByComercio(comercio._id || comercio.id)
      if (response.success) {
        setProductos(response.products)
      }
    } catch (error) {
      console.error('Error al cargar productos:', error)
      toast.error('Error al cargar productos del comercio')
    } finally {
      setCargandoProductos(false)
    }
  }

  // Productos de ejemplo como fallback
  const productosEjemplo = {
    1: [ // McDonald's
      {
        id: 1,
        nombre: "Big Mac",
        descripcion: "Dos hamburguesas de carne, salsa especial, lechuga, queso, pepinillos, cebolla en pan con sésamo",
        precio: 8.50,
        categoria: "hamburguesas",
        imagen: "🍔",
        disponible: true,
        rating: 4.5,
        tiempoPrep: "10-15 min"
      },
      {
        id: 2,
        nombre: "McNuggets x10",
        descripcion: "10 piezas de pollo empanizado con salsa a elegir",
        precio: 6.99,
        categoria: "pollo",
        imagen: "🍗",
        disponible: true,
        rating: 4.3,
        tiempoPrep: "5-8 min"
      },
      {
        id: 3,
        nombre: "McFlurry Oreo",
        descripcion: "Helado cremoso con trozos de galleta Oreo",
        precio: 4.50,
        categoria: "postres",
        imagen: "🍦",
        disponible: true,
        rating: 4.7,
        tiempoPrep: "3-5 min"
      },
      {
        id: 4,
        nombre: "Papas Fritas Grandes",
        descripcion: "Papas fritas doradas y crujientes",
        precio: 3.99,
        categoria: "acompañamientos",
        imagen: "🍟",
        disponible: true,
        rating: 4.4,
        tiempoPrep: "3-5 min"
      },
      {
        id: 5,
        nombre: "Coca Cola 500ml",
        descripcion: "Bebida gaseosa refrescante",
        precio: 2.50,
        categoria: "bebidas",
        imagen: "🥤",
        disponible: true,
        rating: 4.2,
        tiempoPrep: "1 min"
      }
    ],
    2: [ // GameStop
      {
        id: 6,
        nombre: "FIFA 24 PS5",
        descripcion: "El juego de fútbol más realista para PlayStation 5",
        precio: 59.99,
        categoria: "videojuegos",
        imagen: "🎮",
        disponible: true,
        rating: 4.6,
        tiempoPrep: "Inmediato"
      },
      {
        id: 7,
        nombre: "Controller PS5",
        descripcion: "Control inalámbrico DualSense para PlayStation 5",
        precio: 69.99,
        categoria: "accesorios",
        imagen: "🎯",
        disponible: true,
        rating: 4.8,
        tiempoPrep: "Inmediato"
      },
      {
        id: 8,
        nombre: "Gift Card $25",
        descripcion: "Tarjeta de regalo para PlayStation Store",
        precio: 25.00,
        categoria: "tarjetas",
        imagen: "🎁",
        disponible: true,
        rating: 5.0,
        tiempoPrep: "Inmediato"
      },
      {
        id: 9,
        nombre: "Auriculares Gaming",
        descripcion: "Auriculares con micrófono para gaming",
        precio: 89.99,
        categoria: "accesorios",
        imagen: "🎧",
        disponible: true,
        rating: 4.4,
        tiempoPrep: "Inmediato"
      }
    ],
    3: [ // Nike Store
      {
        id: 10,
        nombre: "Air Max 270",
        descripcion: "Zapatillas deportivas con tecnología Air Max",
        precio: 129.99,
        categoria: "calzado",
        imagen: "👟",
        disponible: true,
        rating: 4.7,
        tiempoPrep: "Inmediato"
      },
      {
        id: 11,
        nombre: "Camiseta Dri-FIT",
        descripcion: "Camiseta deportiva con tecnología que absorbe el sudor",
        precio: 29.99,
        categoria: "ropa",
        imagen: "👕",
        disponible: true,
        rating: 4.5,
        tiempoPrep: "Inmediato"
      },
      {
        id: 12,
        nombre: "Shorts Running",
        descripcion: "Shorts ligeros para correr con bolsillos",
        precio: 34.99,
        categoria: "ropa",
        imagen: "🩳",
        disponible: true,
        rating: 4.3,
        tiempoPrep: "Inmediato"
      },
      {
        id: 13,
        nombre: "Mochila Deportiva",
        descripcion: "Mochila resistente para deportes y gimnasio",
        precio: 49.99,
        categoria: "accesorios",
        imagen: "🎒",
        disponible: true,
        rating: 4.6,
        tiempoPrep: "Inmediato"
      }
    ]
  }

  // Usar productos reales o ejemplos como fallback
  const productosDisponibles = productos.length > 0 ? productos : (productosEjemplo[comercio.id] || [])

  const agregarAlCarrito = (producto) => {
    setCarrito(prev => {
      const productoId = producto._id || producto.id
      const existente = prev.find(item => (item._id || item.id) === productoId)
      if (existente) {
        return prev.map(item =>
          (item._id || item.id) === productoId
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      }
      return [...prev, { ...producto, cantidad: 1 }]
    })
    toast.success(`${producto.name || producto.nombre} agregado al carrito`)
  }

  const removerDelCarrito = (productoId) => {
    setCarrito(prev => {
      const existente = prev.find(item => (item._id || item.id) === productoId)
      if (existente && existente.cantidad > 1) {
        return prev.map(item =>
          (item._id || item.id) === productoId
            ? { ...item, cantidad: item.cantidad - 1 }
            : item
        )
      }
      return prev.filter(item => (item._id || item.id) !== productoId)
    })
  }

  const calcularTotal = () => {
    return carrito.reduce((total, item) => total + ((item.price || item.precio) * item.cantidad), 0)
  }

  const procesarPago = async () => {
    const total = calcularTotal()
    
    // Validar saldo suficiente
    if (!paymentService.validarSaldoSuficiente(user?.saldoDisponible || 0, total)) {
      toast.error('Saldo insuficiente para realizar la compra')
      return
    }

    setProcesandoPago(true)
    let transaccionCreada = null

    try {
      // Validaciones previas
      toast.loading('Validando compra...', { id: 'payment' })
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Crear transacción en BD
      const pagoData = {
        monto: total,
        comercioId: comercio._id || comercio.id,
        comercioNombre: comercio.name || comercio.nombre,
        descripcion: `Compra en ${comercio.name || comercio.nombre}`,
        productos: carrito.map(item => ({
          id: item._id || item.id,
          nombre: item.name || item.nombre,
          cantidad: item.cantidad,
          precio: item.price || item.precio,
          subtotal: (item.price || item.precio) * item.cantidad
        }))
      }

      transaccionCreada = await paymentService.procesarPagoComercio(pagoData)

      toast.loading('Procesando pago en blockchain...', { id: 'payment' })

      // Simular transacción blockchain
      const resultadoBlockchain = await paymentService.simularTransaccionBlockchain(
        total, 
        comercio.walletAddress || '0x742d35Cc6634C0532925a3b8D404d3aABE8f5425'
      )

      // Confirmar transacción en BD
      await paymentService.confirmarTransaccion(
        transaccionCreada.transaction._id, 
        resultadoBlockchain.hash
      )

      toast.success('¡Pago realizado exitosamente!', { id: 'payment' })
      
      // Mostrar detalles de la transacción
      const recibo = paymentService.generarRecibo({
        ...transaccionCreada.transaction,
        transactionHash: resultadoBlockchain.hash,
        status: 'completed'
      })

      // Limpiar carrito y cerrar checkout
      setCarrito([])
      setMostrarCheckout(false)
      
      // Mostrar resumen de compra
      setTimeout(() => {
        toast.success(
          `Compra realizada en ${comercio.name || comercio.nombre}. Total: ${paymentService.formatearMonto(total)}`, 
          { duration: 5000 }
        )
      }, 1000)

      // Opcional: Mostrar modal con detalles del recibo
      console.log('Recibo de compra:', recibo)

    } catch (error) {
      console.error('Error en el pago:', error)
      
      // Si se creó la transacción pero falló el blockchain, cancelarla
      if (transaccionCreada) {
        try {
          await paymentService.cancelarTransaccion(
            transaccionCreada.transaction._id, 
            'Error en procesamiento blockchain'
          )
        } catch (cancelError) {
          console.error('Error al cancelar transacción:', cancelError)
        }
      }

      toast.error(error.message || 'Error al procesar el pago. Inténtalo de nuevo.', { id: 'payment' })
    } finally {
      setProcesandoPago(false)
    }
  }

  const categorias = [...new Set(productosDisponibles.map(p => p.category || p.categoria))]

  const productosFiltrados = categoriaSeleccionada === 'todos' 
    ? productosDisponibles 
    : productosDisponibles.filter(p => (p.category || p.categoria) === categoriaSeleccionada)

  return (
    <div className="space-y-6">
      {/* Header de la tienda */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onVolver}
            className="flex items-center space-x-2 text-blue-100 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Volver</span>
          </button>
          
          <button
            onClick={() => setMostrarCheckout(true)}
            className="flex items-center space-x-2 bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Carrito ({carrito.reduce((total, item) => total + item.cantidad, 0)})</span>
          </button>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center space-x-4 mb-2">
            <div className="text-4xl">{comercio.imagen}</div>
            <div>
              <h1 className="text-2xl font-bold">{comercio.name || comercio.nombre}</h1>
              <p className="text-blue-100">{comercio.businessCategory || comercio.descripcion}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-blue-100">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-current" />
              <span>4.5 (234 reseñas)</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Abierto hasta 22:00</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>A 0.5 km de ti</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros por categoría */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        <button 
          onClick={() => setCategoriaSeleccionada('todos')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            categoriaSeleccionada === 'todos'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todos
        </button>
        {categorias.map(categoria => (
          <button
            key={categoria}
            onClick={() => setCategoriaSeleccionada(categoria)}
            className={`px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors capitalize whitespace-nowrap ${
              categoriaSeleccionada === categoria
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {categoria}
          </button>
        ))}
      </div>

      {/* Grid de productos */}
      {cargandoProductos ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      ) : productosFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productosFiltrados.map(producto => {
            const productoId = producto._id || producto.id
            const enCarrito = carrito.find(item => (item._id || item.id) === productoId)
          
            return (
              <motion.div
                key={productoId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="text-center mb-4">
                  {/* Imagen del producto */}
                  <div className="w-24 h-24 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                    {producto.images && producto.images.length > 0 ? (
                      <img 
                        src={producto.images[0]} 
                        alt={producto.name || producto.nombre}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-4xl">{producto.imagen || '📦'}</div>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-1">{producto.name || producto.nombre}</h3>
                  <p className="text-sm text-gray-600 mb-2">{producto.description || producto.descripcion}</p>
                  
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-current text-yellow-400" />
                      <span>{producto.rating || '4.5'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{producto.tiempoPrep || 'Inmediato'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-green-600">
                    ${producto.price || producto.precio}
                  </span>
                  <span className="text-sm text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded">
                    {producto.category || producto.categoria}
                  </span>
                </div>

                {producto.stock !== undefined && (
                  <div className="text-sm text-gray-600 mb-3 text-center">
                    Stock: {producto.stock} disponibles
                  </div>
                )}

                {enCarrito ? (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => removerDelCarrito(productoId)}
                      className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    
                    <span className="text-lg font-semibold">
                      {enCarrito.cantidad}
                    </span>
                    
                    <button
                      onClick={() => agregarAlCarrito(producto)}
                      className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => agregarAlCarrito(producto)}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                    disabled={!(producto.isActive !== undefined ? producto.isActive : producto.disponible)}
                  >
                    <Plus className="h-4 w-4" />
                    <span>
                      {(producto.isActive !== undefined ? producto.isActive : producto.disponible) 
                        ? 'Agregar' 
                        : 'No disponible'
                      }
                    </span>
                  </button>
                )}
              </motion.div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No hay productos disponibles</h3>
          <p className="text-gray-500">Este comercio aún no ha agregado productos.</p>
        </div>
      )}

      {/* Modal de checkout */}
      {mostrarCheckout && (
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Resumen de Compra</h3>
              <button
                onClick={() => setMostrarCheckout(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {carrito.length > 0 ? (
              <>
                <div className="space-y-3 mb-4">
                  {carrito.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          {item.images && item.images.length > 0 ? (
                            <img 
                              src={item.images[0]} 
                              alt={item.name || item.nombre}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <span className="text-xl">{item.imagen || '📦'}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{item.name || item.nombre}</h4>
                          <p className="text-sm text-gray-600">${item.price || item.precio} c/u</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">x{item.cantidad}</div>
                        <div className="text-sm text-gray-600">
                          ${((item.price || item.precio) * item.cantidad).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span>Subtotal:</span>
                    <span>${calcularTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Impuestos:</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">${calcularTotal().toFixed(2)}</span>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Saldo disponible:</span>
                    <span className="font-medium">${user?.saldoDisponible || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Después de la compra:</span>
                    <span className={`font-medium ${
                      (user?.saldoDisponible || 0) - calcularTotal() >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      ${((user?.saldoDisponible || 0) - calcularTotal()).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={procesarPago}
                  disabled={procesandoPago || calcularTotal() > (user?.saldoDisponible || 0)}
                  className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCard className="h-4 w-4" />
                  <span>
                    {procesandoPago ? 'Procesando...' : 'Pagar Ahora'}
                  </span>
                </button>

                {calcularTotal() > (user?.saldoDisponible || 0) && (
                  <p className="text-sm text-red-600 text-center mt-2">
                    Saldo insuficiente para realizar esta compra
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Carrito vacío</h3>
                <p className="text-gray-500 mb-4">Agrega productos para continuar</p>
                <button
                  onClick={() => setMostrarCheckout(false)}
                  className="btn-primary"
                >
                  Seguir Comprando
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default TiendaComercio