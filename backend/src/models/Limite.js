const mongoose = require('mongoose');

const limiteSchema = new mongoose.Schema({
  hijoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  fecha: {
    type: Date,
    required: true,
    index: true
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
  gastado: {
    type: Number,
    default: 0,
    min: 0
  },
  activo: {
    type: Boolean,
    default: true
  },
  descripcion: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Índice compuesto para búsquedas rápidas
limiteSchema.index({ hijoId: 1, fecha: 1 });
limiteSchema.index({ hijoId: 1, activo: 1 });

// Método para verificar si está vigente hoy
limiteSchema.methods.esVigenteHoy = function() {
  const hoy = new Date();
  const fechaLimite = new Date(this.fecha);
  
  return hoy.toDateString() === fechaLimite.toDateString() && this.activo;
};

// Método para calcular porcentaje gastado
limiteSchema.methods.porcentajeGastado = function() {
  if (this.monto === 0) return 0;
  return Math.min((this.gastado / this.monto) * 100, 100);
};

// Método estático para obtener límites de un hijo por fecha
limiteSchema.statics.obtenerPorFecha = function(hijoId, fecha) {
  const fechaInicio = new Date(fecha);
  fechaInicio.setHours(0, 0, 0, 0);
  
  const fechaFin = new Date(fecha);
  fechaFin.setHours(23, 59, 59, 999);
  
  return this.find({
    hijoId: hijoId,
    fecha: {
      $gte: fechaInicio,
      $lte: fechaFin
    }
  });
};

module.exports = mongoose.model('Limite', limiteSchema);