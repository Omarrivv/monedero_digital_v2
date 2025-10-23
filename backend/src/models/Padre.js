import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const padreSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellido: {
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
  fotoPerfil: {
    type: String,
    default: null
  },
  role: {
    type: String,
    default: 'padre',
    enum: ['padre']
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hijo'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Índices
padreSchema.index({ walletAddress: 1 })
padreSchema.index({ email: 1 })

const Padre = mongoose.model('Padre', padreSchema)

export default Padre