import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Calendar,
  Plus,
  Target,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
  DollarSign,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import API_CONFIG from '../../config/apiConfig.js'

// 🚀 USAR CONFIGURACIÓN CENTRALIZADA
const API_BASE = API_CONFIG.BASE_URL

const LimitesCompletos = ({ hijoId, onLimitsUpdate }) => {
  const [limits, setLimits] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingLimit, setEditingLimit] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newLimit, setNewLimit] = useState({
    categoria: '',
    limite: '',
    periodo: 'diario',
    activo: true
  })

  useEffect(() => {
    if (hijoId) {
      loadLimits()
    }
  }, [hijoId])

  const loadLimits = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE}/limites/${hijoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al cargar límites')
      }

      const data = await response.json()
      setLimits(data.limits || [])
    } catch (error) {
      console.error('Error loading limits:', error)
      toast.error('Error al cargar los límites')
    } finally {
      setLoading(false)
    }
  }

  const handleAddLimit = async () => {
    try {
      if (!newLimit.categoria || !newLimit.limite) {
        toast.error('Por favor completa todos los campos')
        return
      }

      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE}/limites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hijoId,
          ...newLimit,
          limite: parseFloat(newLimit.limite)
        })
      })

      if (!response.ok) {
        throw new Error('Error al crear límite')
      }

      toast.success('Límite creado exitosamente')
      setShowAddForm(false)
      setNewLimit({
        categoria: '',
        limite: '',
        periodo: 'diario',
        activo: true
      })
      loadLimits()
      
      if (onLimitsUpdate) {
        onLimitsUpdate()
      }
    } catch (error) {
      console.error('Error adding limit:', error)
      toast.error('Error al crear el límite')
    }
  }

  const handleEditLimit = async (limitId, updatedData) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE}/limites/${limitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      })

      if (!response.ok) {
        throw new Error('Error al actualizar límite')
      }

      toast.success('Límite actualizado exitosamente')
      setEditingLimit(null)
      loadLimits()
      
      if (onLimitsUpdate) {
        onLimitsUpdate()
      }
    } catch (error) {
      console.error('Error editing limit:', error)
      toast.error('Error al actualizar el límite')
    }
  }

  const handleDeleteLimit = async (limitId) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE}/limites/${limitId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Error al eliminar límite')
      }

      toast.success('Límite eliminado exitosamente')
      loadLimits()
      
      if (onLimitsUpdate) {
        onLimitsUpdate()
      }
    } catch (error) {
      console.error('Error deleting limit:', error)
      toast.error('Error al eliminar el límite')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Target className="w-5 h-5 text-blue-500" />
          Gestión de Límites
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Límite
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-50 p-4 rounded-lg border"
        >
          <h4 className="font-medium text-gray-900 mb-4">Nuevo Límite de Gasto</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={newLimit.categoria}
                onChange={(e) => setNewLimit({ ...newLimit, categoria: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar categoría</option>
                <option value="comida">Comida</option>
                <option value="transporte">Transporte</option>
                <option value="entretenimiento">Entretenimiento</option>
                <option value="educacion">Educación</option>
                <option value="ropa">Ropa</option>
                <option value="otros">Otros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Límite ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newLimit.limite}
                onChange={(e) => setNewLimit({ ...newLimit, limite: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                value={newLimit.periodo}
                onChange={(e) => setNewLimit({ ...newLimit, periodo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newLimit.activo}
                  onChange={(e) => setNewLimit({ ...newLimit, activo: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Límite activo</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddLimit}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>
        </motion.div>
      )}

      {/* Limits List */}
      {limits.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No hay límites configurados</p>
          <p className="text-sm">Comienza agregando un nuevo límite de gasto</p>
        </div>
      ) : (
        <div className="space-y-4">
          {limits.map((limit) => (
            <LimitCard
              key={limit._id}
              limit={limit}
              isEditing={editingLimit === limit._id}
              onEdit={() => setEditingLimit(limit._id)}
              onCancelEdit={() => setEditingLimit(null)}
              onSave={(updatedData) => handleEditLimit(limit._id, updatedData)}
              onDelete={() => handleDeleteLimit(limit._id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

const LimitCard = ({ limit, isEditing, onEdit, onCancelEdit, onSave, onDelete }) => {
  const [editData, setEditData] = useState({
    categoria: limit.categoria,
    limite: limit.limite.toString(),
    periodo: limit.periodo,
    activo: limit.activo
  })

  const handleSave = () => {
    onSave({
      ...editData,
      limite: parseFloat(editData.limite)
    })
  }

  const getStatusColor = (activo) => {
    return activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getPeriodoIcon = (periodo) => {
    switch (periodo) {
      case 'diario':
        return <Calendar className="w-4 h-4" />
      case 'semanal':
        return <Calendar className="w-4 h-4" />
      case 'mensual':
        return <Calendar className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={editData.categoria}
              onChange={(e) => setEditData({ ...editData, categoria: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="comida">Comida</option>
              <option value="transporte">Transporte</option>
              <option value="entretenimiento">Entretenimiento</option>
              <option value="educacion">Educación</option>
              <option value="ropa">Ropa</option>
              <option value="otros">Otros</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Límite ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={editData.limite}
              onChange={(e) => setEditData({ ...editData, limite: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <select
              value={editData.periodo}
              onChange={(e) => setEditData({ ...editData, periodo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={editData.activo}
                onChange={(e) => setEditData({ ...editData, activo: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Límite activo</span>
            </label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onCancelEdit}
            className="px-3 py-1.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-1"
          >
            <Save className="w-4 h-4" />
            Guardar
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="capitalize font-medium text-gray-900">
              {limit.categoria}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(limit.activo)}`}>
              {limit.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium">${limit.limite}</span>
            </div>
            <div className="flex items-center gap-1">
              {getPeriodoIcon(limit.periodo)}
              <span className="capitalize">{limit.periodo}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default LimitesCompletos