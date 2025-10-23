const mongoose = require('mongoose')

const productoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true
  },
  precio: {
    type: Number,
    required: true,
    min: 0
  },
  categoria: {
    type: String,
    required: true,
    enum: ['comida', 'bebida', 'postre', 'producto', 'servicio', 'videojuegos', 'accesorios', 'tarjetas', 'calzado', 'ropa']
  },
  imagen: {
    type: String,
    default: '📦'
  },
  imagenUrl: {
    type: String // URL de Cloudinary
  },
  disponible: {
    type: Boolean,
    default: true
  },
  comercio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stock: {
    type: Number,
    default: 0
  },
  ventasTotal: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  tiempoPreparacion: {
    type: String,
    default: 'Inmediato'
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true
})

// Índices para búsquedas eficientes
productoSchema.index({ comercio: 1, disponible: 1 })
productoSchema.index({ categoria: 1, disponible: 1 })
productoSchema.index({ nombre: 'text', descripcion: 'text' })

module.exports = mongoose.model('Producto', productoSchema)