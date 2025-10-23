import React, { useState, useEffect } from 'react'
import { Plus, Target, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

function LimitesSimples({ hijoId, nombreHijo }) {
  const [limites, setLimites] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nuevoLimite, setNuevoLimite] = useState({
    fecha: '',
    monto: '',
    categoria: 'general',
    descripcion: ''
  })

  useEffect(() => {
    cargarLimites()
  }, [hijoId])

  const cargarLimites = async () => {
    try {
      setCargando(true)
      console.log('🔄 Cargando límites simples para:', hijoId)
      
      const token = localStorage.getItem('authToken')
      if (!token) {
        console.log('❌ No hay token')
        setLimites([])
        return
      }

      const url = `${import.meta.env.VITE_API_URL}/limites-simples/hijo/${hijoId}`
      console.log('📡 URL:', url)

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      console.log('📥 Status:', response.status)
      const data = await response.json()
      console.log('📥 Data:', data)

      if (response.ok && data.success) {
        setLimites(data.limites || [])
        console.log('✅ Límites cargados:', data.limites?.length || 0)
      } else {
        console.log('⚠️ Error o sin límites:', data.message)
        setLimites([])
      }
    } catch (error) {
      console.error('❌ Error al cargar:', error)
      setLimites([])
    } finally {
      setCargando(false)
    }
  }

  const crearLimite = async (e) => {
    e.preventDefault()
    
    if (!nuevoLimite.fecha || !nuevoLimite.monto) {
      toast.error('Fecha y monto son requeridos')
      return
    }

    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        toast.error('No hay sesión activa')
        return
      }

      const limitData = {
        fecha: nuevoLimite.fecha,
        monto: parseFloat(nuevoLimite.monto),
        categoria: nuevoLimite.categoria,
        descripcion: nuevoLimite.descripcion
      }

      console.log('📤 Creando límite:', limitData)

      const url = `${import.meta.env.VITE_API_URL}/limites-simples/crear/${hijoId}`
      console.log('📡 URL:', url)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(limitData)
      })

      console.log('📥 Status:', response.status)
      const data = await response.json()
      console.log('📥 Data:', data)

      if (response.ok && data.success) {
        toast.success('¡Límite creado exitosamente!')
        setMostrarForm(false)
        setNuevoLimite({
          fecha: '',
          monto: '',
          categoria: 'general',
          descripcion: ''
        })
        cargarLimites()
      } else {
        toast.error(data.message || 'Error al crear límite')
      }
    } catch (error) {
      console.error('❌ Error:', error)
      toast.error(`Error: ${error.message}`)
    }
  }

  const eliminarLimite = async (limiteId) => {
    if (!confirm('¿Eliminar este límite?')) return

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/limites-simples/eliminar/${limiteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Límite eliminado')
        cargarLimites()
      } else {
        toast.error(data.message || 'Error al eliminar')
      }
    } catch (error) {
      console.error('❌ Error:', error)
      toast.error('Error al eliminar')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Límites de Gasto</h2>
          <p className="text-gray-600">Límites para {nombreHijo}</p>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Nuevo Límite</span>
        </button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Crear Nuevo Límite</h3>
          <form onSubmit={crearLimite} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fecha</label>
                <input
                  type="date"
                  value={nuevoLimite.fecha}
                  onChange={(e) => setNuevoLimite(prev => ({ ...prev, fecha: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="25.00"
                  value={nuevoLimite.monto}
                  onChange={(e) => setNuevoLimite(prev => ({ ...prev, monto: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Categoría</label>
              <select
                value={nuevoLimite.categoria}
                onChange={(e) => setNuevoLimite(prev => ({ ...prev, categoria: e.target.value }))}
                className="w-full p-2 border rounded-lg"
              >
                <option value="general">General</option>
                <option value="alimentacion">Alimentación</option>
                <option value="educacion">Educación</option>
                <option value="entretenimiento">Entretenimiento</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <input
                type="text"
                placeholder="Descripción opcional..."
                value={nuevoLimite.descripcion}
                onChange={(e) => setNuevoLimite(prev => ({ ...prev, descripcion: e.target.value }))}
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setMostrarForm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Crear Límite
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de límites */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Límites Configurados</h3>
        </div>

        {cargando ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Cargando límites...</p>
          </div>
        ) : limites.length > 0 ? (
          <div className="divide-y">
            {limites.map((limite) => (
              <div key={limite._id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">
                    {new Date(limite.fecha).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-sm text-gray-600">
                    ${limite.monto} • {limite.categoria}
                  </div>
                  {limite.descripcion && (
                    <div className="text-sm text-gray-500">{limite.descripcion}</div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <div className="font-semibold">${limite.gastado} / ${limite.monto}</div>
                    <div className="text-xs text-gray-500">
                      {((limite.gastado / limite.monto) * 100).toFixed(1)}% usado
                    </div>
                  </div>
                  <button
                    onClick={() => eliminarLimite(limite._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No hay límites</h3>
            <p className="text-gray-500 mb-4">Crea el primer límite para {nombreHijo}</p>
            <button
              onClick={() => setMostrarForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Crear Límite
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default LimitesSimples