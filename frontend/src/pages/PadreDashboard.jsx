import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useWeb3 } from '../context/Web3Context'
import apiService from '../services/apiService'
import CalendarioLimites from '../components/calendar/CalendarioLimites'
import HistorialTransaccionesAvanzado from '../components/transactions/HistorialTransaccionesAvanzado'
import LimitesSimples from '../components/limits/LimitesSimples'
import DashboardAnalytics from '../components/analytics/DashboardAnalytics'
import ProfileEdit from '../components/ProfileEdit'

import ProfileView from '../components/ProfileView'
import { 
  Users, 
  Plus, 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  Settings,
  Send,
  Eye,
  Edit,
  UserPlus,
  User,
  Check
} from 'lucide-react'
import toast from 'react-hot-toast'

function PadreDashboard() {
  const [vistaActiva, setVistaActiva] = useState('overview')
  const [mostrarModalHijo, setMostrarModalHijo] = useState(false)
  const [mostrarModalTransferir, setMostrarModalTransferir] = useState(false)
  const [mostrarEditarPerfil, setMostrarEditarPerfil] = useState(false)
  const [hijoSeleccionado, setHijoSeleccionado] = useState(null)
  const [transaccionCompletada, setTransaccionCompletada] = useState(null)
  const [mostrarGestionLimites, setMostrarGestionLimites] = useState(false)
  const [hijoParaLimites, setHijoParaLimites] = useState(null)
  const [redSeleccionada, setRedSeleccionada] = useState('todas')
  const [transaccionesFiltradas, setTransaccionesFiltradas] = useState([])
  const [nuevoHijo, setNuevoHijo] = useState({
    nombre: '',
    apellido: '',
    edad: '',
    walletAddress: '',
    password: ''
  })
  const [transferencia, setTransferencia] = useState({
    hijoId: '',
    monto: ''
  })
  
  const { user, children, registerHijo, setSpendingLimits, updateUser, loadChildren } = useAuth()
  const { balance, sendTransaction, refreshBalance, getBalanceDirectly, network, account, supportedNetworks, switchNetwork } = useWeb3()

  // Redes disponibles
  const redesDisponibles = [
    { 
      id: 'todas', 
      nombre: 'Todas las Redes', 
      chainId: null,
      color: 'bg-gray-100 text-gray-800',
      icon: '🌐'
    },
    { 
      id: 'ethereum', 
      nombre: 'Ethereum Mainnet', 
      chainId: '1',
      color: 'bg-blue-100 text-blue-800',
      icon: '🔷'
    },
    { 
      id: 'sepolia', 
      nombre: 'Sepolia Testnet', 
      chainId: '11155111',
      color: 'bg-purple-100 text-purple-800',
      icon: '🟣'
    },
    { 
      id: 'holesky', 
      nombre: 'Holesky Testnet', 
      chainId: '17000',
      color: 'bg-orange-100 text-orange-800',
      icon: '🟠'
    },
    { 
      id: 'hoodi', 
      nombre: 'Ethereum Hoodi', 
      chainId: '560048',
      color: 'bg-green-100 text-green-800',
      icon: '🟢'
    }
  ]

  // Función para obtener información de la red por chainId
  const getRedInfo = (chainId) => {
    return redesDisponibles.find(red => red.chainId === chainId?.toString()) || {
      id: 'unknown',
      nombre: 'Red Desconocida',
      chainId: chainId?.toString(),
      color: 'bg-gray-100 text-gray-600',
      icon: '❓'
    }
  }

  // Función para cambiar de red
  const handleCambiarRed = async (redId) => {
    if (redId === 'todas') {
      setRedSeleccionada('todas')
      return
    }

    try {
      const exito = await switchNetwork(redId)
      if (exito) {
        setRedSeleccionada(redId)
        toast.success(`Cambiado a ${redesDisponibles.find(r => r.id === redId)?.nombre}`)
      }
    } catch (error) {
      console.error('Error al cambiar red:', error)
      toast.error('Error al cambiar de red')
    }
  }

  // Función para filtrar transacciones por red
  const filtrarTransaccionesPorRed = (transacciones, redId) => {
    if (redId === 'todas') {
      return transacciones
    }

    const red = redesDisponibles.find(r => r.id === redId)
    if (!red || !red.chainId) {
      return transacciones
    }

    return transacciones.filter(tx => {
      // Aquí asumimos que las transacciones tienen un campo 'network' o 'chainId'
      return tx.network === redId || tx.chainId === red.chainId
    })
  }

  // Función para obtener la URL correcta del explorer
  const getExplorerUrl = (txHash) => {
    // Limpiar el hash (remover guión bajo si existe)
    const cleanHash = txHash?.replace(/_+$/, '').trim() || txHash
    
    console.log('🔗 Generando URL del explorer para hash:', cleanHash)
    console.log('🌐 Red actual:', network)
    
    if (!cleanHash) {
      console.log('❌ Hash vacío o inválido')
      return `https://sepolia.etherscan.io/tx/${cleanHash}`
    }

    // Determinar la red basada en chainId
    let chainId = network?.chainId
    
    // Convertir BigInt a string si es necesario
    if (typeof chainId === 'bigint') {
      chainId = chainId.toString()
    } else if (typeof chainId === 'number') {
      chainId = chainId.toString()
    }
    
    console.log('🔢 Chain ID detectado:', chainId)
    
    switch (chainId) {
      case '1': // Ethereum Mainnet
        console.log('🌐 Usando Ethereum Mainnet explorer')
        return `https://etherscan.io/tx/${cleanHash}`
      case '11155111': // Sepolia
        console.log('🌐 Usando Sepolia explorer')
        return `https://sepolia.etherscan.io/tx/${cleanHash}`
      case '17000': // Holesky
        console.log('🌐 Usando Holesky explorer')
        return `https://holesky.etherscan.io/tx/${cleanHash}`
      case '560048': // Hoodi
        console.log('🌐 Usando Hoodi explorer')
        return `https://hoodi.etherscan.io/tx/${cleanHash}`
      default:
        console.log('🌐 Red no reconocida, usando Sepolia por defecto')
        return `https://sepolia.etherscan.io/tx/${cleanHash}`
    }
  }

  // Cargar hijos cuando el componente se monta
  useEffect(() => {
    if (user && user.role === 'padre' && children.length === 0) {
      console.log('Cargando hijos para el padre...')
      loadChildren()
    }
  }, [user]) // Solo depender de user, no de loadChildren

  // Función para obtener el límite diario actual de un hijo
  const getLimiteDiarioActual = (hijo) => {
    console.log('🔍 Verificando límites para hijo:', hijo.name)
    console.log('📊 spendingLimits:', hijo.spendingLimits)
    
    if (!hijo.spendingLimits) {
      console.log('❌ No hay spendingLimits')
      return 0
    }
    
    // Verificar si está en formato antiguo (con campo 'fecha')
    if (hijo.spendingLimits.fecha) {
      console.log('📅 Formato antiguo detectado, límite:', hijo.spendingLimits.limite)
      return hijo.spendingLimits.limite || 0
    }
    
    // Obtener la fecha de hoy en formato YYYY-MM-DD
    const hoy = new Date().toISOString().split('T')[0]
    console.log('📅 Fecha de hoy:', hoy)
    
    // Si hay límite para hoy, devolverlo
    if (hijo.spendingLimits[hoy]) {
      console.log('✅ Límite para hoy:', hijo.spendingLimits[hoy].limite)
      return hijo.spendingLimits[hoy].limite || 0
    }
    
    // Si no hay límite específico para hoy, buscar el más reciente
    const fechasConLimite = Object.keys(hijo.spendingLimits).sort().reverse()
    console.log('📋 Fechas con límite:', fechasConLimite)
    
    if (fechasConLimite.length > 0) {
      const ultimoLimite = hijo.spendingLimits[fechasConLimite[0]]
      console.log('🔄 Usando último límite:', ultimoLimite?.limite)
      return ultimoLimite?.limite || 0
    }
    
    console.log('❌ No hay límites configurados')
    return 0
  }

  const vistas = [
    { id: 'overview', label: 'Resumen', icon: TrendingUp },
    { id: 'children', label: 'Hijos', icon: Users },
    { id: 'limits', label: 'Límites', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'history', label: 'Historial', icon: Eye },
    { id: 'profile', label: 'Perfil', icon: User }
  ]

  const handleRegistrarHijo = async (e) => {
    e.preventDefault()
    
    if (!nuevoHijo.nombre || !nuevoHijo.apellido || !nuevoHijo.edad || !nuevoHijo.walletAddress || !nuevoHijo.password) {
      toast.error('Por favor completa todos los campos')
      return
    }

    if (nuevoHijo.edad < 5 || nuevoHijo.edad > 18) {
      toast.error('La edad debe estar entre 5 y 18 años')
      return
    }

    // Validar formato de wallet address
    if (!nuevoHijo.walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error('La dirección de wallet debe tener el formato 0x seguido de 40 caracteres hexadecimales')
      return
    }

    try {
      const result = await registerHijo(nuevoHijo)
      if (result.success) {
        setMostrarModalHijo(false)
        setNuevoHijo({
          nombre: '',
          apellido: '',
          edad: '',
          walletAddress: '',
          password: ''
        })
      }
    } catch (error) {
      console.error('Error registrando hijo:', error)
    }
  }

  const handleTransferirFondos = async (e) => {
    e.preventDefault()
    
    if (!transferencia.hijoId || !transferencia.monto) {
      toast.error('Por favor completa todos los campos')
      return
    }

    const monto = parseFloat(transferencia.monto)
    if (monto <= 0) {
      toast.error('El monto debe ser mayor a 0')
      return
    }

    const hijo = children.find(h => h._id === transferencia.hijoId)
    if (!hijo) {
      toast.error('Hijo no encontrado')
      return
    }

    try {
      // 1. Crear la transacción en la base de datos primero
      console.log('📝 Creando transacción en BD...')
      const transactionResponse = await apiService.post('/transacciones-simples/crear', {
        to: transferencia.hijoId,
        amount: monto,
        type: 'transfer',
        description: `Transferencia a ${hijo.name}`,
        chainId: network?.chainId?.toString(),
        network: getRedInfo(network?.chainId?.toString()).id
      })

      if (!transactionResponse.data.success) {
        toast.error(transactionResponse.data.message || 'Error al crear la transacción')
        return
      }

      const transactionId = transactionResponse.data.transaction._id
      console.log('✅ Transacción creada con ID:', transactionId)

      // 2. Mostrar confirmación antes de proceder con MetaMask
      const confirmacion = window.confirm(
        `¿Confirmas la transferencia de $${monto} ETH a ${hijo.name}?\n\n` +
        `Esto abrirá MetaMask para confirmar la transacción blockchain.`
      )

      if (!confirmacion) {
        // Cancelar la transacción en BD
        await apiService.put(`/transacciones-simples/cancelar/${transactionId}`)
        toast.info('Transferencia cancelada')
        return
      }

      // 3. Verificar red antes de enviar transacción
      console.log('🌐 Verificando red antes de transacción...')
      console.log('Red actual:', network?.chainId?.toString())
      
      // 4. Ejecutar la transacción blockchain con MetaMask
      console.log('🔗 Ejecutando transacción blockchain...')
      toast.loading('Esperando confirmación de MetaMask...', { id: 'transfer-loading' })
      
      const tx = await sendTransaction(hijo.walletAddress, monto)
      
      if (tx) {
        console.log('✅ Transacción blockchain exitosa:', tx.hash)
        
        // 4. Confirmar la transacción en BD con el hash y red
        await apiService.put(`/transacciones-simples/confirmar/${transactionId}`, {
          txHash: tx.hash,
          chainId: network?.chainId?.toString(),
          network: getRedInfo(network?.chainId?.toString()).id
        })

        toast.success(`Transferencia exitosa! Hash: ${tx.hash.slice(0, 10)}...`, { id: 'transfer-loading' })
        
        // 5. Mostrar detalles de la transacción
        console.log('📋 Hash de transacción recibido:', tx.hash)
        setTransaccionCompletada({
          hash: tx.hash,
          monto: monto,
          destinatario: hijo.name,
          fecha: new Date().toLocaleString()
        })
        
        // 6. Limpiar formulario y cerrar modal
        setMostrarModalTransferir(false)
        setTransferencia({ hijoId: '', monto: '' })
        
        // 7. Actualizar balance
        if (refreshBalance) {
          refreshBalance()
        }
      }
    } catch (error) {
      console.error('❌ Error en transferencia:', error)
      
      // Manejar diferentes tipos de errores
      if (error.response?.status === 403) {
        toast.error(error.response.data.message || 'No tienes permisos para esta transferencia')
      } else if (error.code === 'ACTION_REJECTED') {
        toast.error('Transacción rechazada en MetaMask')
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        toast.error('Fondos insuficientes en tu wallet')
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('network changed')) {
        toast.error('Error de red durante la transacción. Verifica que no hayas cambiado de red durante el proceso.')
      } else if (error.message?.includes('network changed')) {
        toast.warning('La red cambió durante la transacción. La transacción puede estar pendiente. Verifica en el explorer.')
      } else {
        toast.error('Error en la transferencia. Revisa la consola para más detalles.')
      }
      
      toast.dismiss('transfer-loading')
    }
  }

  const handleLimiteChange = async (hijoId, limiteData) => {
    try {
      const result = await setSpendingLimits(hijoId, limiteData)
      if (result.success) {
        toast.success('Límite establecido exitosamente')
        // Recargar los datos de los hijos para mostrar los límites actualizados
        console.log('🔄 Recargando datos de hijos...')
        await loadChildren()
      }
    } catch (error) {
      console.error('Error estableciendo límite:', error)
      toast.error('Error al establecer límite')
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-white/20 border-2 border-white/30">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              <button
                onClick={() => setMostrarEditarPerfil(true)}
                className="absolute -bottom-1 -right-1 bg-white text-primary-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
              >
                <Edit className="w-3 h-3" />
              </button>
            </div>
            <div>
              <h1 className="text-2xl font-bold">¡Hola, {user?.name || 'Usuario'}!</h1>
              <p className="text-primary-100">Gestiona las wallets de tus hijos de forma segura</p>
              {user?.email && (
                <p className="text-primary-200 text-sm">{user.email}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-primary-100 flex items-center justify-end space-x-2">
              <span>Balance de Wallet</span>
              {balance === '0' && (
                <button
                  onClick={refreshBalance}
                  className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
                  title="Actualizar balance"
                >
                  🔄
                </button>
              )}
            </div>
            <div className="text-2xl font-bold">
              {balance === '0' ? '0.0000 ETH' : `${parseFloat(balance).toFixed(4)} ETH`}
            </div>
            {balance === '0' && (
              <div className="text-xs text-primary-200">
                Red: {network?.name || 'Desconocida'} (ID: {network?.chainId?.toString() || 'N/A'})
                <button
                  onClick={() => {
                    console.log('🔧 Debug Info:')
                    console.log('Account:', account)
                    console.log('Network:', network)
                    console.log('Balance:', balance)
                    console.log('Probando método directo...')
                    getBalanceDirectly()
                  }}
                  className="ml-2 text-xs bg-red-500/20 hover:bg-red-500/30 px-2 py-1 rounded"
                >
                  Debug
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selector de Redes */}
      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-800">Red Blockchain</h3>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm text-gray-600">
                Conectado a: {getRedInfo(network?.chainId?.toString()).nombre}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Cambiar a:</span>
            <div className="flex space-x-2">
              {redesDisponibles.map(red => (
                <button
                  key={red.id}
                  onClick={() => handleCambiarRed(red.id)}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${redSeleccionada === red.id || (red.chainId === network?.chainId?.toString())
                      ? red.color + ' ring-2 ring-offset-1 ring-blue-500'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }
                  `}
                  disabled={red.chainId === network?.chainId?.toString()}
                >
                  <span className="text-base">{red.icon}</span>
                  <span className="hidden sm:inline">{red.nombre}</span>
                  <span className="sm:hidden">{red.id === 'todas' ? 'Todas' : red.nombre.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Información adicional de la red */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>Chain ID: {network?.chainId?.toString() || 'N/A'}</span>
              <span>Balance: {balance === '0' ? '0.0000' : parseFloat(balance).toFixed(4)} ETH</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Filtrar transacciones:</span>
              <select
                value={redSeleccionada}
                onChange={(e) => setRedSeleccionada(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                {redesDisponibles.map(red => (
                  <option key={red.id} value={red.id}>
                    {red.icon} {red.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Indicador de red seleccionada */}
          {redSeleccionada !== 'todas' && (
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-xs text-gray-500">Mostrando transacciones de:</span>
              <span className={`px-2 py-1 text-xs rounded-full ${redesDisponibles.find(r => r.id === redSeleccionada)?.color}`}>
                {redesDisponibles.find(r => r.id === redSeleccionada)?.icon} {redesDisponibles.find(r => r.id === redSeleccionada)?.nombre}
              </span>
            </div>
          )}
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
                  ? 'bg-white text-primary-600 shadow-sm' 
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Hijos Registrados</h3>
                    <p className="text-2xl font-bold text-gray-900">{children?.length || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary-600" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Balance Total</h3>
                    <p className="text-2xl font-bold text-gray-900">
                      {balance === '0' ? '0.0000 ETH' : `${parseFloat(balance).toFixed(4)} ETH`}
                    </p>
                  </div>
                  <Wallet className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Transacciones</h3>
                    <p className="text-2xl font-bold text-gray-900">-</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setMostrarModalHijo(true)}
                  className="btn-primary flex items-center justify-center space-x-2"
                >
                  <UserPlus className="h-5 w-5" />
                  <span>Registrar Hijo</span>
                </button>
                
                <button
                  onClick={() => setMostrarModalTransferir(true)}
                  className="btn-secondary flex items-center justify-center space-x-2"
                  disabled={!children?.length}
                >
                  <Send className="h-5 w-5" />
                  <span>Transferir Fondos</span>
                </button>

                <button
                  onClick={() => {
                    if (children?.length === 1) {
                      setHijoParaLimites(children[0])
                      setMostrarGestionLimites(true)
                    } else {
                      toast.info('Selecciona un hijo para gestionar sus límites')
                    }
                  }}
                  className="btn-outline flex items-center justify-center space-x-2"
                  disabled={!children?.length}
                >
                  <Settings className="h-5 w-5" />
                  <span>Gestionar Límites</span>
                </button>
              </div>
            </div>

            {/* Lista de hijos */}
            {children?.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Mis Hijos</h3>
                <div className="space-y-3">
                  {children.map((hijo, index) => (
                    <div key={hijo._id || hijo.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{hijo.name || 'Sin nombre'}</h4>
                          <p className="text-sm text-gray-600">Edad: {hijo.age || 'N/A'} años</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Saldo</div>
                        <div className="font-semibold">${hijo.allowance || 0}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {vistaActiva === 'children' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Gestión de Hijos</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    console.log('🔄 Recargando datos manualmente...')
                    loadChildren()
                  }}
                  className="btn-secondary text-sm"
                >
                  🔄 Recargar
                </button>
                <button
                  onClick={() => setMostrarModalHijo(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Registrar Hijo</span>
                </button>
              </div>
            </div>

            {children?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {children.map(hijo => (
                  <div key={hijo._id} className="card">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                        <Users className="h-8 w-8 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{hijo.name || 'Sin nombre'}</h3>
                        <p className="text-gray-600">Edad: {hijo.age || 'N/A'} años</p>
                        <p className="text-sm text-gray-500">ID: {hijo._id || hijo.id}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Saldo disponible:</span>
                        <span className="font-semibold">${hijo.allowance || 0}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Límite diario:</span>
                        <span className="font-semibold">${getLimiteDiarioActual(hijo)}</span>
                      </div>
                      
                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => {
                            setTransferencia(prev => ({ ...prev, hijoId: hijo._id }))
                            setMostrarModalTransferir(true)
                          }}
                          className="btn-primary flex-1 flex items-center justify-center space-x-1"
                        >
                          <Send className="h-4 w-4" />
                          <span>Transferir</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setHijoSeleccionado(hijo)
                            setVistaActiva('limits')
                          }}
                          className="btn-outline flex-1 flex items-center justify-center space-x-1"
                        >
                          <Settings className="h-4 w-4" />
                          <span>Límites</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No tienes hijos registrados</h3>
                <p className="text-gray-500 mb-4">Registra a tu primer hijo para comenzar</p>
                <button
                  onClick={() => setMostrarModalHijo(true)}
                  className="btn-primary"
                >
                  Registrar Primer Hijo
                </button>
              </div>
            )}
          </motion.div>
        )}

        {vistaActiva === 'limits' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {hijoSeleccionado ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setHijoSeleccionado(null)}
                    className="text-blue-600 hover:text-blue-800 flex items-center space-x-2"
                  >
                    ← Volver a la lista
                  </button>
                </div>
                <LimitesSimples
                  hijoId={hijoSeleccionado._id}
                  nombreHijo={hijoSeleccionado.name || 'Sin nombre'}
                />
              </div>
            ) : children?.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold mb-4">Gestión de Límites</h2>
                <p className="text-gray-600 mb-6">Selecciona un hijo para configurar sus límites de gasto:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {children.map(hijo => (
                    <button
                      key={hijo._id}
                      onClick={() => setHijoSeleccionado(hijo)}
                      className="card text-left hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Users className="h-8 w-8 text-primary-600" />
                          <div>
                            <h3 className="font-medium">{hijo.name || 'Sin nombre'}</h3>
                            <p className="text-sm text-gray-600">Edad: {hijo.age || 'N/A'} años</p>
                          </div>
                        </div>
                        <Settings className="h-5 w-5 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No hay hijos para configurar</h3>
                <p className="text-gray-500">Registra un hijo primero para establecer límites</p>
              </div>
            )}
          </motion.div>
        )}

        {vistaActiva === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <DashboardAnalytics userRole="padre" userId={user?._id} />
          </motion.div>
        )}

        {vistaActiva === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <HistorialTransaccionesAvanzado 
              userRole="padre" 
              userId={user?._id} 
              redFiltro={redSeleccionada}
              redesDisponibles={redesDisponibles}
            />
          </motion.div>
        )}

        {vistaActiva === 'profile' && (
          <ProfileView 
            user={user}
            children={children}
            balance={balance}
            onEditProfile={() => setMostrarEditarPerfil(true)}
          />
        )}
      </div>

      {/* Modal registrar hijo */}
      {mostrarModalHijo && (
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold mb-4">Registrar Nuevo Hijo</h3>
            
            <form onSubmit={handleRegistrarHijo} className="space-y-4">
              <input
                type="text"
                placeholder="Nombre"
                value={nuevoHijo.nombre}
                onChange={(e) => setNuevoHijo(prev => ({ ...prev, nombre: e.target.value }))}
                className="input-field"
                required
              />
              
              <input
                type="text"
                placeholder="Apellido"
                value={nuevoHijo.apellido}
                onChange={(e) => setNuevoHijo(prev => ({ ...prev, apellido: e.target.value }))}
                className="input-field"
                required
              />
              
              <input
                type="number"
                placeholder="Edad (5-18)"
                value={nuevoHijo.edad}
                onChange={(e) => setNuevoHijo(prev => ({ ...prev, edad: e.target.value }))}
                className="input-field"
                min="5"
                max="18"
                required
              />
              
              <input
                type="text"
                placeholder="Dirección de Wallet (0x + 40 caracteres hex)"
                value={nuevoHijo.walletAddress}
                onChange={(e) => setNuevoHijo(prev => ({ ...prev, walletAddress: e.target.value }))}
                className="input-field"
                required
                pattern="^0x[a-fA-F0-9]{40}$"
                title="Debe ser una dirección Ethereum válida (0x seguido de 40 caracteres hexadecimales)"
              />
              
              <input
                type="password"
                placeholder="Contraseña para el hijo"
                value={nuevoHijo.password}
                onChange={(e) => setNuevoHijo(prev => ({ ...prev, password: e.target.value }))}
                className="input-field"
                required
              />
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setMostrarModalHijo(false)}
                  className="btn-outline flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Registrar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal transferir fondos */}
      {mostrarModalTransferir && (
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold mb-4">Transferir Fondos</h3>
            
            <form onSubmit={handleTransferirFondos} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Seleccionar Hijo</label>
                <select
                  value={transferencia.hijoId}
                  onChange={(e) => setTransferencia(prev => ({ ...prev, hijoId: e.target.value }))}
                  className="input-field"
                  required
                >
                  <option value="">Selecciona un hijo</option>
                  {children?.map(hijo => (
                    <option key={hijo._id} value={hijo._id}>
                      {hijo.name || 'Sin nombre'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Monto (ETH)</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  value={transferencia.monto}
                  onChange={(e) => setTransferencia(prev => ({ ...prev, monto: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Balance disponible:</strong> {parseFloat(balance).toFixed(4)} ETH
                </p>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setMostrarModalTransferir(false)}
                  className="btn-outline flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                >
                  Transferir
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal editar perfil */}
      {mostrarEditarPerfil && (
        <ProfileEdit
          user={user}
          onClose={() => setMostrarEditarPerfil(false)}
          onUpdate={(updatedUser) => {
            updateUser(updatedUser);
            toast.success('Perfil actualizado exitosamente');
          }}
        />
      )}

      {/* Modal de transacción completada */}
      {transaccionCompletada && (
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                ¡Transferencia Exitosa!
              </h3>
              
              <div className="space-y-3 text-left bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Destinatario:</span>
                  <span className="font-medium">{transaccionCompletada.destinatario}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto:</span>
                  <span className="font-medium">{transaccionCompletada.monto} ETH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium">{transaccionCompletada.fecha}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Hash:</span>
                  <div className="text-right">
                    <div className="font-mono text-xs break-all">
                      {transaccionCompletada.hash}
                    </div>
                    <a
                      href={getExplorerUrl(transaccionCompletada.hash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Ver en Explorer
                    </a>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setTransaccionCompletada(null)}
                className="btn-primary w-full"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default PadreDashboard