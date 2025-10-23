import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useWeb3 } from '../context/Web3Context'
import { useAuth } from '../context/AuthContext'
import { uploadAPI } from '../services/apiService'
import { Users, Upload, User, Mail, Phone, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

function PadreRegister() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    fotoPerfil: null
  })
  const [fotoPreview, setFotoPreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  const navigate = useNavigate()
  const { account, connectWallet } = useWeb3()
  const { registerPadre } = useAuth()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const compressImage = (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        const { width, height } = img
        const ratio = Math.min(maxWidth / width, maxWidth / height)
        
        canvas.width = width * ratio
        canvas.height = height * ratio
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        canvas.toBlob(resolve, 'image/jpeg', quality)
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handleImageSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    try {
      setUploadingImage(true)
      toast.loading('Subiendo imagen... Por favor espere')
      
      // Comprimir imagen si es muy grande
      let fileToUpload = file
      if (file.size > 2 * 1024 * 1024) { // Si es mayor a 2MB, comprimir
        toast.loading('Comprimiendo imagen...')
        fileToUpload = await compressImage(file)
      }
      
      // Preview local
      const reader = new FileReader()
      reader.onload = (e) => setFotoPreview(e.target.result)
      reader.readAsDataURL(fileToUpload)

      // Upload to Cloudinary
      const formDataUpload = new FormData()
      formDataUpload.append('image', fileToUpload)
      
      const response = await uploadAPI.uploadImageForRegister(formDataUpload)
      
      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          fotoPerfil: response.data.data.url
        }))
        toast.success('Imagen subida exitosamente')
      }
      
      // Store file for later use
      setSelectedFile(fileToUpload)
    } catch (error) {
      console.error('Error uploading image:', error)
      let errorMessage = 'Error al subir la imagen'
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Timeout: La imagen tardó mucho en subirse. Intente con una imagen más pequeña.'
      } else if (error.response?.status === 413) {
        errorMessage = 'La imagen es demasiado grande. Intente con una imagen más pequeña.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Error de conexión. Verifique que el servidor esté corriendo.'
      }
      toast.error(errorMessage)
      setFotoPreview(null)
      // Continuar sin imagen
      setFormData(prev => ({
        ...prev,
        fotoPerfil: ''
      }))
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!account) {
      toast.error('Por favor conecta tu wallet primero')
      return
    }

    if (!formData.nombre || !formData.apellido || !formData.email || !formData.telefono || !formData.password) {
      toast.error('Por favor completa todos los campos obligatorios')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Por favor ingresa un email válido')
      return
    }

    try {
      setIsLoading(true)
      
      // Preparar datos con la URL de la imagen (ya se subió en handleImageSelect)
      const dataToSubmit = {
        ...formData
      }
      
      const result = await registerPadre(dataToSubmit)
      
      if (result.success) {
        toast.success('¡Registro exitoso!')
        navigate('/padre/dashboard')
      } else {
        toast.error(result.error || 'Error en el registro')
      }
    } catch (error) {
      console.error('Error en registro:', error)
      let errorMessage = 'Error en el registro'
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Error de conexión. Verifique que el servidor esté corriendo.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (!account) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <div className="card text-center">
          <Users className="h-16 w-16 text-primary-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Registro de Padre/Tutor</h2>
          <p className="text-gray-600 mb-6">
            Para registrarte como Padre/Tutor, primero debes conectar tu wallet MetaMask
          </p>
          <button
            onClick={connectWallet}
            className="btn-primary w-full"
          >
            Conectar Wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto mt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="text-center mb-8">
          <Users className="h-16 w-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registro de Padre/Tutor
          </h1>
          <p className="text-gray-600">
            Crea tu perfil para gestionar las wallets de tus hijos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto de perfil */}
          <div className="text-center">
            <div className="relative inline-block">
              {fotoPreview ? (
                <img
                  src={fotoPreview}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
              )}
              
              <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 transition-colors">
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={isLoading || uploadingImage}
                />
              </label>
            </div>
            
            <p className="text-sm text-gray-500 mt-2">
              {selectedFile ? 'Imagen seleccionada - se subirá al registrarte' : 'Foto de perfil (opcional)'}
            </p>
          </div>

          {/* Información personal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Nombre *
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Tu nombre"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Apellido *
              </label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Tu apellido"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="inline h-4 w-4 mr-1" />
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="input-field"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="inline h-4 w-4 mr-1" />
              Teléfono *
            </label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              className="input-field"
              placeholder="+1234567890"
              required
            />
          </div>

          {/* Contraseña */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Repite tu contraseña"
                required
                minLength={6}
              />
            </div>
          </div>

          {/* Información de la wallet */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Información de Wallet</h3>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Dirección:</strong> {account}
            </p>
            <p className="text-xs text-gray-500">
              Esta será tu wallet principal para gestionar las wallets de tus hijos
            </p>
          </div>

          {/* Términos y condiciones */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Como Padre/Tutor podrás:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Registrar y gestionar las wallets de tus hijos</li>
              <li>• Establecer límites de gasto diarios, semanales y mensuales</li>
              <li>• Transferir fondos a las wallets de tus hijos</li>
              <li>• Configurar categorías de gasto permitidas</li>
              <li>• Ver el historial completo de transacciones</li>
              <li>• Establecer límites mediante calendario interactivo</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading || uploadingImage}
            className="btn-primary w-full"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Registrando...</span>
              </div>
            ) : (
              'Registrarse como Padre/Tutor'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <button 
              onClick={() => navigate('/login')}
              className="text-primary-600 hover:underline"
            >
              Inicia sesión aquí
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default PadreRegister