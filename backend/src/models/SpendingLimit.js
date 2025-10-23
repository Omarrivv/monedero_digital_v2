const mongoose = require('mongoose');

const spendingLimitSchema = new mongoose.Schema({
  hijo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tipo: {
    type: String,
    required: true,
    enum: ['diario', 'semanal', 'mensual', 'personalizado']
  },
  monto: {
    type: Number,
    required: true,
    min: 0
  },
  categoria: {
    type: String,
    default: 'general',
    enum: [
      'general',
      'alimentacion',
      'educacion',
      'entretenimiento',
      'deportes',
      'tecnologia',
      'ropa',
      'transporte'
    ]
  },
  fechaInicio: {
    type: Date,
    required: true
  },
  fechaFin: {
    type: Date,
    required: true
  },
  descripcion: {
    type: String,
    default: ''
  },
  activo: {
    type: Boolean,
    default: true
  },
  gastado: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Índices compuestos para búsquedas eficientes
spendingLimitSchema.index({ hijo: 1, activo: 1 });
spendingLimitSchema.index({ hijo: 1, fechaInicio: 1, fechaFin: 1 });

// Método para verificar si el límite está vigente
spendingLimitSchema.methods.isVigente = function() {
  const ahora = new Date();
  return this.activo && ahora >= this.fechaInicio && ahora <= this.fechaFin;
};

// Método para calcular el porcentaje gastado
spendingLimitSchema.methods.getPorcentajeGastado = function() {
  if (this.monto === 0) return 0;
  return Math.min((this.gastado / this.monto) * 100, 100);
};

// Método para verificar si se excedió el límite
spendingLimitSchema.methods.isExcedido = function() {
  return this.gastado >= this.monto;
};

// Método estático para obtener límites activos de un hijo
spendingLimitSchema.statics.getLimitesActivos = function(hijoId) {
  const ahora = new Date();
  return this.find({
    hijo: hijoId,
    activo: true,
    fechaInicio: { $lte: ahora },
    fechaFin: { $gte: ahora }
  });
};

// Método estático para obtener límites por rango de fechas
spendingLimitSchema.statics.getLimitesPorRango = function(hijoId, fechaInicio, fechaFin) {
  return this.find({
    hijo: hijoId,
    $or: [
      {
        fechaInicio: { $gte: fechaInicio, $lte: fechaFin }
      },
      {
        fechaFin: { $gte: fechaInicio, $lte: fechaFin }
      },
      {
        fechaInicio: { $lte: fechaInicio },
        fechaFin: { $gte: fechaFin }
      }
    ]
  });
};

module.exports = mongoose.model('SpendingLimit', spendingLimitSchema);
