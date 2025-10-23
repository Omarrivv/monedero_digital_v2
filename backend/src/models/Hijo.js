import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const hijoSchema = new mongoose.Schema({
  hijoId: {
    type: String,
    required: true,
    unique: true
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
  edad: {
    type: Number,
    required: true,
    min: 5,
    max: 18
  },
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  fotoPerfil: {
    type: String,
    default: null
  },
  padre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Padre',
    required: true
  },
  padreWalletAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  role: {
    type: String,
    default: 'hijo',
    enum: ['hijo']
  },
  saldoDisponible: {
    type: Number,
    default: 0,
    min: 0
  },
  limitesGasto: {
    diario: {
      monto: { type: Number, default: 0 },
      gastoHoy: { type: Number, default: 0 },
      fechaReset: { type: Date, default: Date.now }
    },
    semanal: {
      monto: { type: Number, default: 0 },
      gastoSemana: { type: Number, default: 0 },
      fechaReset: { type: Date, default: Date.now }
    },
    mensual: {
      monto: { type: Number, default: 0 },
      gastoMes: { type: Number, default: 0 },
      fechaReset: { type: Date, default: Date.now }
    },
    categorias: [{
      categoria: { type: String, required: true },
      limite: { type: Number, required: true },
      gastado: { type: Number, default: 0 },
      periodo: { type: String, enum: ['diario', 'semanal', 'mensual'], default: 'diario' }
    }]
  },
  configuracionCalendario: [{
    fecha: { type: Date, required: true },
    limiteEspecial: { type: Number, required: true },
    categorias: [String],
    activo: { type: Boolean, default: true }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Middleware para hashear password antes de guardar
hijoSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Método para comparar passwords
hijoSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Método para generar hijoId único
hijoSchema.statics.generateHijoId = async function() {
  let hijoId
  let exists = true
  
  while (exists) {
    hijoId = 'HIJO' + Math.random().toString(36).substr(2, 8).toUpperCase()
    exists = await this.findOne({ hijoId })
  }
  
  return hijoId
}

// Método para verificar límites de gasto
hijoSchema.methods.checkSpendingLimit = function(amount, categoria = null) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // Verificar límite diario
  if (this.limitesGasto.diario.fechaReset < today) {
    this.limitesGasto.diario.gastoHoy = 0
    this.limitesGasto.diario.fechaReset = today
  }
  
  if (this.limitesGasto.diario.monto > 0) {
    const nuevoGastoDiario = this.limitesGasto.diario.gastoHoy + amount
    if (nuevoGastoDiario > this.limitesGasto.diario.monto) {
      return { allowed: false, reason: 'Límite diario excedido' }
    }
  }
  
  // Verificar límite por categoría si se especifica
  if (categoria) {
    const categoriaLimit = this.limitesGasto.categorias.find(c => c.categoria === categoria)
    if (categoriaLimit) {
      const nuevoGastoCategoria = categoriaLimit.gastado + amount
      if (nuevoGastoCategoria > categoriaLimit.limite) {
        return { allowed: false, reason: `Límite de categoría ${categoria} excedido` }
      }
    }
  }
  
  // Verificar saldo disponible
  if (amount > this.saldoDisponible) {
    return { allowed: false, reason: 'Saldo insuficiente' }
  }
  
  return { allowed: true }
}

// Índices
hijoSchema.index({ hijoId: 1 })
hijoSchema.index({ walletAddress: 1 })
hijoSchema.index({ padre: 1 })
hijoSchema.index({ padreWalletAddress: 1 })

const Hijo = mongoose.model('Hijo', hijoSchema)

export default Hijo