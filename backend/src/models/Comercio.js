import mongoose from 'mongoose'

const comercioSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  nombreComercio: {
    type: String,
    required: true,
    trim: true
  },
  nombrePropietario: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  telefono: {
    type: String,
    required: true
  },
  direccion: {
    calle: { type: String, required: true },
    ciudad: { type: String, required: true },
    estado: { type: String, required: true },
    codigoPostal: { type: String, required: true }
  },
  categoria: {
    type: String,
    required: true,
    enum: [
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
  },
  descripcion: {
    type: String,
    maxlength: 500
  },
  imagenes: {
    logo: { type: String, default: null },
    portada: { type: String, default: null },
    galeria: [String]
  },
  productos: [{
    nombre: { type: String, required: true },
    descripcion: { type: String, required: true },
    precio: { type: Number, required: true, min: 0 },
    imagen: { type: String, default: null },
    categoria: { type: String, required: true },
    disponible: { type: Boolean, default: true },
    fechaCreacion: { type: Date, default: Date.now }
  }],
  horarioAtencion: {
    lunes: { abierto: Boolean, inicio: String, fin: String },
    martes: { abierto: Boolean, inicio: String, fin: String },
    miercoles: { abierto: Boolean, inicio: String, fin: String },
    jueves: { abierto: Boolean, inicio: String, fin: String },
    viernes: { abierto: Boolean, inicio: String, fin: String },
    sabado: { abierto: Boolean, inicio: String, fin: String },
    domingo: { abierto: Boolean, inicio: String, fin: String }
  },
  role: {
    type: String,
    default: 'comercio',
    enum: ['comercio']
  },
  verificado: {
    type: Boolean,
    default: false
  },
  calificacion: {
    promedio: { type: Number, default: 0, min: 0, max: 5 },
    totalReseñas: { type: Number, default: 0 }
  },
  ventasTotales: {
    cantidad: { type: Number, default: 0 },
    monto: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Índices
comercioSchema.index({ walletAddress: 1 })
comercioSchema.index({ email: 1 })
comercioSchema.index({ categoria: 1 })
comercioSchema.index({ 'direccion.ciudad': 1 })

const Comercio = mongoose.model('Comercio', comercioSchema)

export default Comercio