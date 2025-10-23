const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El remitente es requerido']
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El destinatario es requerido']
  },
  amount: {
    type: Number,
    required: [true, 'El monto es requerido'],
    min: [0.01, 'El monto debe ser mayor a 0']
  },
  type: {
    type: String,
    required: [true, 'El tipo de transacción es requerido'],
    enum: {
      values: ['transfer', 'payment', 'refund', 'allowance'],
      message: 'Tipo de transacción inválido'
    }
  },
  status: {
    type: String,
    required: [true, 'El estado es requerido'],
    enum: {
      values: ['pending', 'completed', 'cancelled', 'failed'],
      message: 'Estado de transacción inválido'
    },
    default: 'pending'
  },
  description: {
    type: String,
    maxLength: [200, 'La descripción no puede exceder 200 caracteres'],
    default: ''
  },
  
  // Referencia al producto (opcional, solo para pagos)
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },

  // Información de la blockchain
  txHash: {
    type: String,
    default: null,
    unique: true,
    sparse: true
  },
  blockNumber: {
    type: Number,
    default: null
  },
  gasUsed: {
    type: Number,
    default: null
  },
  gasPrice: {
    type: String,
    default: null
  },
  network: {
    type: String,
    enum: ['ethereum', 'sepolia', 'holesky', 'hoodi', 'localhost'],
    default: 'sepolia'
  },

  // Metadatos adicionales
  metadata: {
    category: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      maxLength: [500, 'Las notas no pueden exceder 500 caracteres'],
      default: ''
    }
  },

  // Timestamps específicos
  completedAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },

  // Información de cancelación
  cancelReason: {
    type: String,
    maxLength: [200, 'La razón de cancelación no puede exceder 200 caracteres'],
    default: null
  }

}, {
  timestamps: true
});

// Índices para mejorar rendimiento (excluye txHash que ya tiene unique: true)
transactionSchema.index({ from: 1, createdAt: -1 });
transactionSchema.index({ to: 1, createdAt: -1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ createdAt: -1 });

// Métodos estáticos
transactionSchema.statics.findByUser = function(userId, options = {}) {
  const query = {
    $or: [
      { from: userId },
      { to: userId }
    ]
  };

  if (options.status) {
    query.status = options.status;
  }

  if (options.type) {
    query.type = options.type;
  }

  return this.find(query)
    .populate('from', 'name walletAddress role')
    .populate('to', 'name walletAddress role')
    .populate('product', 'name price')
    .sort({ createdAt: -1 });
};

// Métodos de instancia
transactionSchema.methods.complete = function(txHash) {
  this.status = 'completed';
  this.txHash = txHash;
  this.completedAt = new Date();
  return this.save();
};

transactionSchema.methods.cancel = function(reason = null) {
  if (this.status !== 'pending') {
    throw new Error('Solo se pueden cancelar transacciones pendientes');
  }
  
  this.status = 'cancelled';
  this.cancelReason = reason;
  this.cancelledAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Transaction', transactionSchema);