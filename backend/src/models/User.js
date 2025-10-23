const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxLength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  apellido: {
    type: String,
    trim: true,
    maxLength: [50, 'El apellido no puede exceder 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
  },
  telefono: {
    type: String,
    trim: true,
    default: null
    // Removida validación regex para evitar errores 500
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minLength: [6, 'La contraseña debe tener al menos 6 caracteres']
  },
  role: {
    type: String,
    required: [true, 'El rol es requerido'],
    enum: {
      values: ['padre', 'hijo', 'comercio'],
      message: 'El rol debe ser: padre, hijo o comercio'
    }
  },
  walletAddress: {
    type: String,
    required: [true, 'La dirección de wallet es requerida'],
    unique: true,
    trim: true
    // Removida validación regex para evitar errores 500
  },
  profileImage: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },

  // Campos específicos para rol 'padre'
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Campos específicos para rol 'hijo'
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.role === 'hijo';
    }
  },
  age: {
    type: Number,
    min: [5, 'La edad mínima es 5 años'],
    max: [18, 'La edad máxima es 18 años'],
    required: function() {
      return this.role === 'hijo';
    }
  },
  allowance: {
    type: Number,
    default: 0,
    min: [0, 'La mesada no puede ser negativa']
  },
  dailyLimit: {
    type: Number,
    default: 0,
    min: [0, 'El límite diario no puede ser negativo']
  },
  weeklyLimit: {
    type: Number,
    default: 0,
    min: [0, 'El límite semanal no puede ser negativo']
  },
  monthlyLimit: {
    type: Number,
    default: 0,
    min: [0, 'El límite mensual no puede ser negativo']
  },
  allowedCategories: [{
    type: String,
    trim: true
  }],
  spendingLimits: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  allowedCommerces: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  timeRestrictions: {
    allowedHours: {
      start: {
        type: Number,
        min: 0,
        max: 23,
        default: 8
      },
      end: {
        type: Number,
        min: 0,
        max: 23,
        default: 20
      }
    },
    allowedDays: [{
      type: Number,
      min: 0,
      max: 6
    }]
  },
  limitsUpdatedAt: {
    type: Date,
    default: null
  },

  // Campos específicos para rol 'comercio'
  businessCategory: {
    type: String,
    required: function() {
      return this.role === 'comercio';
    },
    default: 'otros'
    // Removida validación enum para evitar errores 500
  },
  description: {
    type: String,
    maxLength: [500, 'La descripción no puede exceder 500 caracteres'],
    default: ''
  },
  address: {
    type: String,
    maxLength: [200, 'La dirección no puede exceder 200 caracteres'],
    default: ''
  },
  phone: {
    type: String,
    match: [/^\+?[\d\s\-\(\)]{10,}$/, 'Número de teléfono inválido'],
    default: ''
  },
  businessHours: {
    open: {
      type: String,
      default: '09:00'
    },
    close: {
      type: String,
      default: '18:00'
    },
    days: [{
      type: Number,
      min: 0,
      max: 6
    }]
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para mejorar rendimiento (solo los que no tienen unique: true)
userSchema.index({ role: 1 });
userSchema.index({ parent: 1 });
userSchema.index({ businessCategory: 1 });
userSchema.index({ isActive: 1 });

// Virtual para obtener el nombre completo
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual para verificar si el usuario es menor de edad
userSchema.virtual('isMinor').get(function() {
  return this.role === 'hijo' && this.age < 18;
});

// Virtual para obtener el número total de hijos
userSchema.virtual('childrenCount').get(function() {
  return this.children ? this.children.length : 0;
});

// Middleware pre-save
userSchema.pre('save', function(next) {
  // Validar que los hijos tengan padre
  if (this.role === 'hijo' && !this.parent) {
    return next(new Error('Los hijos deben tener un padre asignado'));
  }

  // Validar que los comercios tengan categoría
  if (this.role === 'comercio' && !this.businessCategory) {
    return next(new Error('Los comercios deben tener una categoría de negocio'));
  }

  // Limpiar campos no aplicables según el rol
  if (this.role !== 'hijo') {
    this.parent = undefined;
    this.age = undefined;
    this.allowance = undefined;
    this.dailyLimit = undefined;
    this.weeklyLimit = undefined;
    this.monthlyLimit = undefined;
    this.allowedCategories = undefined;
    this.allowedCommerces = undefined;
    this.timeRestrictions = undefined;
  }

  if (this.role !== 'padre') {
    this.children = undefined;
  }

  if (this.role !== 'comercio') {
    this.businessCategory = undefined;
    this.description = undefined;
    this.address = undefined;
    this.phone = undefined;
    this.businessHours = undefined;
    this.isVerified = undefined;
    this.rating = undefined;
    this.totalRatings = undefined;
  }

  next();
});

// Middleware pre-remove
userSchema.pre('remove', async function(next) {
  try {
    // Si es un padre, actualizar los hijos
    if (this.role === 'padre' && this.children && this.children.length > 0) {
      await this.model('User').updateMany(
        { _id: { $in: this.children } },
        { $set: { isActive: false } }
      );
    }

    // Si es un hijo, remover de la lista de hijos del padre
    if (this.role === 'hijo' && this.parent) {
      await this.model('User').updateOne(
        { _id: this.parent },
        { $pull: { children: this._id } }
      );
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Métodos estáticos
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

userSchema.statics.findActiveCommerces = function(category = null) {
  const query = { role: 'comercio', isActive: true };
  if (category) {
    query.businessCategory = category;
  }
  return this.find(query);
};

userSchema.statics.findChildrenByParent = function(parentId) {
  return this.find({ parent: parentId, role: 'hijo', isActive: true });
};

// Métodos de instancia
userSchema.methods.addChild = async function(childData) {
  if (this.role !== 'padre') {
    throw new Error('Solo los padres pueden agregar hijos');
  }

  const Child = this.model('User');
  const child = new Child({
    ...childData,
    role: 'hijo',
    parent: this._id
  });

  await child.save();
  
  this.children.push(child._id);
  await this.save();

  return child;
};

userSchema.methods.removeChild = async function(childId) {
  if (this.role !== 'padre') {
    throw new Error('Solo los padres pueden remover hijos');
  }

  const child = await this.model('User').findById(childId);
  if (!child || child.parent.toString() !== this._id.toString()) {
    throw new Error('Hijo no encontrado o no pertenece a este padre');
  }

  child.isActive = false;
  await child.save();

  this.children.pull(childId);
  await this.save();

  return child;
};

userSchema.methods.setLimits = async function(limits) {
  if (this.role !== 'hijo') {
    throw new Error('Solo se pueden establecer límites para hijos');
  }

  const { dailyLimit, weeklyLimit, monthlyLimit, allowedCategories, allowedCommerces, timeRestrictions } = limits;

  if (dailyLimit !== undefined) this.dailyLimit = dailyLimit;
  if (weeklyLimit !== undefined) this.weeklyLimit = weeklyLimit;
  if (monthlyLimit !== undefined) this.monthlyLimit = monthlyLimit;
  if (allowedCategories) this.allowedCategories = allowedCategories;
  if (allowedCommerces) this.allowedCommerces = allowedCommerces;
  if (timeRestrictions) this.timeRestrictions = timeRestrictions;

  this.limitsUpdatedAt = new Date();
  
  return this.save();
};

userSchema.methods.updateRating = async function(newRating) {
  if (this.role !== 'comercio') {
    throw new Error('Solo se puede calificar a comercios');
  }

  const currentTotal = this.rating * this.totalRatings;
  this.totalRatings += 1;
  this.rating = (currentTotal + newRating) / this.totalRatings;

  return this.save();
};

// Transformar JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);