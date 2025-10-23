import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, DollarSign, Plus, Edit, Trash2, Check, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

function CalendarioLimites({ hijoId, onLimiteChange }) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date())
  const [limitesDiarios, setLimitesDiarios] = useState({})
  const [mostrarModal, setMostrarModal] = useState(false)
  const [limiteTemp, setLimiteTemp] = useState('')
  const [categoriasTemp, setCategoriasTemp] = useState([])
  const [modoEdicion, setModoEdicion] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { getLimits } = useAuth()

  // Cargar límites existentes cuando cambia el hijoId
  useEffect(() => {
    if (hijoId) {
      loadExistingLimits()
    }
  }, [hijoId])

  const loadExistingLimits = async () => {
    setIsLoading(true)
    try {
      const result = await getLimits(hijoId)
      if (result.success && result.limits) {
        console.log('📥 Límites recibidos de BD:', result.limits)
        
        // Los límites ahora vienen en formato { "2025-10-20": { limite: 3, categorias: [...] } }
        // Si es el formato antiguo (con fecha), convertir
        if (result.limits.fecha) {
          const fechaKey = new Date(result.limits.fecha).toISOString().split('T')[0]
          const limitesPorFecha = {
            [fechaKey]: {
              limite: result.limits.limite,
              categorias: result.limits.categorias || [],
              activo: result.limits.activo !== false
            }
          }
          setLimitesDiarios(limitesPorFecha)
        } else {
          // Formato nuevo - usar directamente
          setLimitesDiarios(result.limits)
        }
        
        console.log('✅ Límites cargados en componente')
      }
    } catch (error) {
      console.error('Error cargando límites:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const categorias = [
    'alimentacion',
    'educacion', 
    'entretenimiento',
    'deportes',
    'tecnologia',
    'ropa',
    'salud',
    'transporte',
    'otros'
  ]

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const fechaKey = (fecha) => {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
  }

  const obtenerDiasDelMes = () => {
    const año = fechaSeleccionada.getFullYear()
    const mes = fechaSeleccionada.getMonth()
    const primerDia = new Date(año, mes, 1)
    const ultimoDia = new Date(año, mes + 1, 0)
    const diasEnMes = ultimoDia.getDate()
    const diaInicio = primerDia.getDay()

    const dias = []
    
    // Días del mes anterior
    for (let i = diaInicio - 1; i >= 0; i--) {
      const fecha = new Date(año, mes, -i)
      dias.push({ fecha, esDelMes: false })
    }
    
    // Días del mes actual
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = new Date(año, mes, dia)
      dias.push({ fecha, esDelMes: true })
    }
    
    // Completar la grilla (42 días = 6 semanas)
    const diasFaltantes = 42 - dias.length
    for (let i = 1; i <= diasFaltantes; i++) {
      const fecha = new Date(año, mes + 1, i)
      dias.push({ fecha, esDelMes: false })
    }

    return dias
  }

  const navegarMes = (direccion) => {
    const nuevaFecha = new Date(fechaSeleccionada)
    nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion)
    setFechaSeleccionada(nuevaFecha)
  }

  const seleccionarFecha = (fecha) => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    if (fecha < hoy) {
      toast.error('No puedes establecer límites para fechas pasadas')
      return
    }

    setFechaSeleccionada(fecha)
    const key = fechaKey(fecha)
    const limiteExistente = limitesDiarios[key]
    
    if (limiteExistente) {
      setLimiteTemp(limiteExistente.limite.toString())
      setCategoriasTemp(limiteExistente.categorias || [])
      setModoEdicion(true)
    } else {
      setLimiteTemp('')
      setCategoriasTemp([])
      setModoEdicion(false)
    }
    
    setMostrarModal(true)
  }

  const guardarLimite = () => {
    if (!limiteTemp || parseFloat(limiteTemp) <= 0) {
      toast.error('Ingresa un límite válido')
      return
    }

    const key = fechaKey(fechaSeleccionada)
    const nuevoLimite = {
      fecha: fechaSeleccionada,
      limite: parseFloat(limiteTemp),
      categorias: categoriasTemp,
      activo: true
    }

    setLimitesDiarios(prev => ({
      ...prev,
      [key]: nuevoLimite
    }))

    if (onLimiteChange) {
      onLimiteChange(hijoId, nuevoLimite)
    }

    toast.success(modoEdicion ? 'Límite actualizado' : 'Límite establecido')
    setMostrarModal(false)
    setLimiteTemp('')
    setCategoriasTemp([])
  }

  const eliminarLimite = () => {
    const key = fechaKey(fechaSeleccionada)
    const nuevosLimites = { ...limitesDiarios }
    delete nuevosLimites[key]
    setLimitesDiarios(nuevosLimites)
    
    toast.success('Límite eliminado')
    setMostrarModal(false)
  }

  const toggleCategoria = (categoria) => {
    setCategoriasTemp(prev => 
      prev.includes(categoria)
        ? prev.filter(c => c !== categoria)
        : [...prev, categoria]
    )
  }

  const tieneLimite = (fecha) => {
    const key = fechaKey(fecha)
    return limitesDiarios[key]
  }

  const esFechaActual = (fecha) => {
    const hoy = new Date()
    return fecha.toDateString() === hoy.toDateString()
  }

  const dias = obtenerDiasDelMes()

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="h-6 w-6 text-primary-600" />
          <h3 className="text-xl font-semibold">Calendario de Límites</h3>
        </div>
        <div className="text-sm text-gray-600">
          Establecer límites por día
        </div>
      </div>

      {/* Navegación del mes */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navegarMes(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ←
        </button>
        
        <motion.h4 
          key={`${fechaSeleccionada.getMonth()}-${fechaSeleccionada.getFullYear()}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-lg font-medium"
        >
          {meses[fechaSeleccionada.getMonth()]} {fechaSeleccionada.getFullYear()}
        </motion.h4>
        
        <button 
          onClick={() => navegarMes(1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          →
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {diasSemana.map(dia => (
          <div key={dia} className="text-center text-sm font-medium text-gray-600 p-2">
            {dia}
          </div>
        ))}
      </div>

      {/* Grilla del calendario */}
      <div className="grid grid-cols-7 gap-1">
        {dias.map((diaObj, index) => {
          const { fecha, esDelMes } = diaObj
          const limite = tieneLimite(fecha)
          const esHoy = esFechaActual(fecha)
          const esPasado = fecha < new Date().setHours(0, 0, 0, 0)

          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              onClick={() => seleccionarFecha(fecha)}
              disabled={esPasado}
              title={limite ? `Límite: $${limite.limite} - Categorías: ${limite.categorias?.join(', ') || 'Todas'}` : ''}
              className={`
                relative p-3 text-sm rounded-lg transition-all duration-200 
                ${esDelMes 
                  ? esPasado
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-900 hover:bg-blue-50 cursor-pointer'
                  : 'text-gray-400'
                }
                ${esHoy ? 'bg-blue-100 font-bold' : ''}
                ${limite ? 'bg-green-100 border border-green-300' : ''}
              `}
            >
              <span>{fecha.getDate()}</span>
              
              {limite && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"
                >
                  <DollarSign className="h-3 w-3" />
                </motion.div>
              )}
              
              {limite && (
                <div className="absolute bottom-0 left-0 right-0 text-xs text-green-800 font-bold bg-green-200/80 rounded-b-lg px-1 py-0.5">
                  ${limite.limite}
                </div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Leyenda */}
      <div className="mt-6 space-y-2">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 rounded"></div>
            <span>Hoy</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded relative">
              <div className="absolute bottom-0 left-0 right-0 bg-green-200 h-1 rounded-b"></div>
            </div>
            <span>Con límite diario</span>
          </div>
        </div>
        <div className="text-xs text-gray-600">
          💡 Haz clic en un día para establecer o editar límites. Pasa el cursor sobre días con límites para ver detalles.
        </div>
      </div>

      {/* Modal para establecer límites */}
      <AnimatePresence>
        {mostrarModal && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold">
                  {modoEdicion ? 'Editar Límite' : 'Establecer Límite'}
                </h4>
                <button 
                  onClick={() => setMostrarModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Fecha: {fechaSeleccionada.toLocaleDateString()}
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Límite de gasto ($)
                  </label>
                  <input
                    type="number"
                    value={limiteTemp}
                    onChange={(e) => setLimiteTemp(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Categorías permitidas (opcional)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {categorias.map(categoria => (
                      <button
                        key={categoria}
                        type="button"
                        onClick={() => toggleCategoria(categoria)}
                        className={`
                          text-sm p-2 rounded-lg border transition-all
                          ${categoriasTemp.includes(categoria)
                            ? 'bg-blue-50 border-blue-300 text-blue-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }
                        `}
                      >
                        {categoria}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Si no seleccionas categorías, el límite aplicará para todas
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                {modoEdicion && (
                  <button
                    onClick={eliminarLimite}
                    className="flex items-center space-x-1 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Eliminar</span>
                  </button>
                )}
                
                <button
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                
                <button
                  onClick={guardarLimite}
                  className="btn-primary flex items-center space-x-1"
                >
                  <Check className="h-4 w-4" />
                  <span>{modoEdicion ? 'Actualizar' : 'Guardar'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CalendarioLimites