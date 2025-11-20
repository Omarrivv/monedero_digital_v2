import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useWeb3 } from '../context/Web3Context'
import { useAuth } from '../context/AuthContext'
import { uploadAPI } from '../services/apiService'
import { 
  Store, 
  Upload, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Camera,
  FileText,
  Clock
} from 'lucide-react'
import toast from 'react-hot-toast'

function ComercioRegister() {
  const [formData, setFormData] = useState({
    nombreComercio: '',
    nombrePropietario: '',
    email: '',
    telefono: '',
    direccion: {
      calle: '',
      ciudad: '',
      estado: '',
      codigoPostal: ''
    },
    categoria: '',
    descripcion: '',
    imagenes: {
      logo: null,
      portada: null
    },
    horarioAtencion: {
      lunes: { abierto: true, inicio: '09:00', fin: '18:00' },
      martes: { abierto: true, inicio: '09:00', fin: '18:00' },
      miercoles: { abierto: true, inicio: '09:00', fin: '18:00' },
      jueves: { abierto: true, inicio: '09:00', fin: '18:00' },
      viernes: { abierto: true, inicio: '09:00', fin: '18:00' },
      sabado: { abierto: true, inicio: '09:00', fin: '16:00' },
      domingo: { abierto: false, inicio: '', fin: '' }
    }
  })
  const [imagePreviews, setImagePreviews] = useState({
    logo: null,
    portada: null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingImages, setUploadingImages] = useState({
    logo: false,
    portada: false
  })
  
  const navigate = useNavigate()
  const { account, connectWallet } = useWeb3()
  const { registerComercio } = useAuth()

  const categorias = [
    { value: 'alimentacion', label: 'Alimentación' },
    { value: 'educacion', label: 'Educación' },
    { value: 'entretenimiento', label: 'Entretenimiento' },
    { value: 'deportes', label: 'Deportes' },
    { value: 'tecnologia', label: 'Tecnología' },
    { value: 'ropa', label: 'Ropa y Accesorios' },
    { value: 'salud', label: 'Salud y Bienestar' },
    { value: 'transporte', label: 'Transporte' },
    { value: 'otros', label: 'Otros' }
  ]

  const diasSemana = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    if (name.startsWith('direccion.')) {
      const field = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        direccion: {
          ...prev.direccion,
          [field]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleHorarioChange = (dia, campo, valor) => {
    setFormData(prev => ({
      ...prev,
      horarioAtencion: {
        ...prev.horarioAtencion,
        [dia]: {
          ...prev.horarioAtencion[dia],
          [campo]: valor
        }
      }
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

  const handleImageUpload = async (e, tipo) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      setUploadingImages(prev => ({ ...prev, [tipo]: true }))
      toast.loading('Subiendo imagen... Por favor espere')
      let fileToUpload = file
      if (file.size > 2 * 1024 * 1024) {
        toast.loading('Comprimiendo imagen...')
        fileToUpload = await compressImage(file)
      }
      // Preview local
      const reader = new FileReader()
      reader.onload = (ev) => setImagePreviews(prev => ({ ...prev, [tipo]: ev.target.result }))
      reader.readAsDataURL(fileToUpload)
      // Upload to Cloudinary
      const formDataUpload = new FormData()
      formDataUpload.append('image', fileToUpload)
      const response = await uploadAPI.uploadImageForRegister(formDataUpload)
      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          imagenes: {
            ...prev.imagenes,
            [tipo]: response.data.data.url
          }
        }))
        toast.success(`${tipo === 'logo' ? 'Logo' : 'Imagen de portada'} subida exitosamente`)
      }
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
      setImagePreviews(prev => ({ ...prev, [tipo]: null }))
      setFormData(prev => ({
        ...prev,
        imagenes: {
          ...prev.imagenes,
          [tipo]: ''
        }
      }))
    } finally {
      setUploadingImages(prev => ({ ...prev, [tipo]: false }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!account) {
      toast.error('Por favor conecta tu wallet primero')
      return
    }

    // Validaciones
    const camposRequeridos = [
      'nombreComercio', 'nombrePropietario', 'email', 'telefono', 'categoria'
    ]
    
    for (const campo of camposRequeridos) {
      if (!formData[campo]) {
        toast.error('Por favor completa todos los campos obligatorios')
        return
      }
    }

    const direccionRequerida = ['calle', 'ciudad', 'estado', 'codigoPostal']
    for (const campo of direccionRequerida) {
      if (!formData.direccion[campo]) {
        toast.error('Por favor completa la dirección completa')
        return
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Por favor ingresa un email válido')
      return
    }

    try {
      setIsLoading(true)
      const result = await registerComercio(formData)
      
      if (result.success) {
        toast.success('¡Registro exitoso!')
        navigate('/comercio/dashboard')
      }
    } catch (error) {
      console.error('Error en registro:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!account) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <div className="card text-center">
          <Store className="h-16 w-16 text-primary-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-4">Registro de Comercio</h2>
          <p className="text-gray-600 mb-6">
            Para registrar tu comercio, primero debes conectar tu wallet MetaMask
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
    <div className="max-w-4xl mx-auto mt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="text-center mb-8">
          <Store className="h-16 w-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registro de Comercio
          </h1>
          <p className="text-gray-600">
            Registra tu negocio para recibir pagos de la plataforma
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Imágenes del comercio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logo del Comercio
              </label>
              <div className="text-center">
                {imagePreviews.logo ? (
                  <img
                    src={imagePreviews.logo}
                    alt="Logo"
                    className="w-32 h-32 mx-auto rounded-lg object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-32 h-32 mx-auto rounded-lg bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                    <Camera className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                
                <label className="mt-2 btn-outline inline-flex items-center space-x-2 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span>{uploadingImages.logo ? 'Subiendo...' : 'Subir Logo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'logo')}
                    className="hidden"
                    disabled={uploadingImages.logo}
                  />
                </label>
              </div>
            </div>

            {/* Imagen de portada */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen de Portada
              </label>
              <div className="text-center">
                {imagePreviews.portada ? (
                  <img
                    src={imagePreviews.portada}
                    alt="Portada"
                    className="w-full h-32 rounded-lg object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-full h-32 rounded-lg bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                    <Camera className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                
                <label className="mt-2 btn-outline inline-flex items-center space-x-2 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  <span>{uploadingImages.portada ? 'Subiendo...' : 'Subir Portada'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'portada')}
                    className="hidden"
                    disabled={uploadingImages.portada}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Store className="inline h-4 w-4 mr-1" />
                Nombre del Comercio *
              </label>
              <input
                type="text"
                name="nombreComercio"
                value={formData.nombreComercio}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Ej: Tienda de María"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Nombre del Propietario *
              </label>
              <input
                type="text"
                name="nombrePropietario"
                value={formData.nombrePropietario}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Tu nombre completo"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                placeholder="contacto@tucomercio.com"
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
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría del Comercio *
            </label>
            <select
              name="categoria"
              value={formData.categoria}
              onChange={handleInputChange}
              className="input-field"
              required
            >
              <option value="">Selecciona una categoría</option>
              {categorias.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="inline h-4 w-4 mr-1" />
              Descripción del Negocio
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              rows={3}
              className="input-field"
              placeholder="Describe tu negocio, productos o servicios..."
              maxLength={500}
            />
          </div>

          {/* Dirección */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Dirección del Comercio
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  name="direccion.calle"
                  value={formData.direccion.calle}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Calle y número *"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  name="direccion.ciudad"
                  value={formData.direccion.ciudad}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Ciudad *"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  name="direccion.estado"
                  value={formData.direccion.estado}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Estado/Provincia *"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  name="direccion.codigoPostal"
                  value={formData.direccion.codigoPostal}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Código Postal *"
                  required
                />
              </div>
            </div>
          </div>

          {/* Horario de atención */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Horario de Atención
            </h3>
            <div className="space-y-3">
              {diasSemana.map(dia => (
                <div key={dia.key} className="flex items-center space-x-4">
                  <div className="w-20">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.horarioAtencion[dia.key].abierto}
                        onChange={(e) => handleHorarioChange(dia.key, 'abierto', e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium">{dia.label}</span>
                    </label>
                  </div>
                  
                  {formData.horarioAtencion[dia.key].abierto && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={formData.horarioAtencion[dia.key].inicio}
                        onChange={(e) => handleHorarioChange(dia.key, 'inicio', e.target.value)}
                        className="input-field w-24"
                      />
                      <span>a</span>
                      <input
                        type="time"
                        value={formData.horarioAtencion[dia.key].fin}
                        onChange={(e) => handleHorarioChange(dia.key, 'fin', e.target.value)}
                        className="input-field w-24"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Información de la wallet */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Información de Wallet</h3>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Dirección:</strong> {account}
            </p>
            <p className="text-xs text-gray-500">
              Esta será tu wallet para recibir pagos de los usuarios
            </p>
          </div>

          {/* Beneficios */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">Como Comercio podrás:</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Recibir pagos digitales de forma segura</li>
              <li>• Gestionar tu catálogo de productos/servicios</li>
              <li>• Ver el historial de todas tus ventas</li>
              <li>• Configurar tu perfil y horarios de atención</li>
              <li>• Retirar fondos directamente a tu wallet</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading || uploadingImages.logo || uploadingImages.portada}
            className="btn-primary w-full"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Registrando...</span>
              </div>
            ) : (
              'Registrar Comercio'
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

export default ComercioRegister