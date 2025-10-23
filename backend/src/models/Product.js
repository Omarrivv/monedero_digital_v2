const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del producto es requerido'],
    trim: true,
    maxLength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  description: {
    type: String,
    maxLength: [1000, 'La descripción no puede exceder 1000 caracteres'],
    default: ''
  },
  price: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: [0.01, 'El precio debe ser mayor a 0']
  },
  category: {
    type: String,
    required: [true, 'La categoría es requerida'],
    enum: {
      values: [
        'comida',
        'bebidas',
        'dulces',
        'juguetes',
        'libros',
        'deportes',
        'tecnologia',
        'ropa',
        'calzado',
        'entretenimiento',
        'salud',
        'educacion',
        'servicios',
        'otros'
      ],
      message: 'Categoría inválida'
    },
    default: 'otros'
  },
  stock: {
    type: Number,
    required: [true, 'El stock es requerido'],
    min: [0, 'El stock no puede ser negativo'],
    default: 0
  },
  images: [{
    type: String,
    match: [/^https?:\/\/.+/, 'URL de imagen inválida']
  }],
  comercio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El comercio es requerido']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },

  // Información adicional del producto
  specifications: {
    weight: {
      type: Number,
      min: 0
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['cm', 'in', 'm'],
        default: 'cm'
      }
    },
    material: String,
    color: String,
    brand: String,
    model: String,
    ageRange: {
      min: {
        type: Number,
        min: 0,
        max: 18
      },
      max: {
        type: Number,
        min: 0,
        max: 18
      }
    }
  },

  // Información nutricional (para productos de comida)
  nutritionInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    sugar: Number,
    sodium: Number,
    allergens: [{
      type: String,
      enum: ['gluten', 'lactose', 'nuts', 'eggs', 'soy', 'fish', 'shellfish']
    }]
  },

  // Restricciones de edad
  ageRestrictions: {
    minAge: {
      type: Number,
      min: 0,
      max: 18,
      default: 0
    },
    maxAge: {
      type: Number,
      min: 0,
      max: 18,
      default: 18
    },
    requiresParentalApproval: {
      type: Boolean,
      default: false
    }
  },

  // Tags para búsqueda
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // SEO y metadata
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },

  // Estadísticas del producto
  stats: {
    views: {
      type: Number,
      default: 0
    },
    purchases: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
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
    },
    lastPurchase: {
      type: Date,
      default: null
    }
  },

  // Fechas importantes
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date,
    default: null
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para mejorar rendimiento
productSchema.index({ comercio: 1, isActive: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ 'stats.rating': -1 });
productSchema.index({ 'stats.purchases': -1 });
productSchema.index({ createdAt: -1 });

// Índices compuestos
productSchema.index({ category: 1, price: 1, isActive: 1 });
productSchema.index({ comercio: 1, category: 1, isActive: 1 });

// Virtuals
productSchema.virtual('isInStock').get(function() {
  return this.stock > 0;
});

productSchema.virtual('isOutOfStock').get(function() {
  return this.stock === 0;
});

productSchema.virtual('isLowStock').get(function() {
  return this.stock > 0 && this.stock <= 5;
});

productSchema.virtual('formattedPrice').get(function() {
  return `$${this.price.toFixed(2)}`;
});

productSchema.virtual('averageRating').get(function() {
  return this.stats.totalRatings > 0 ? this.stats.rating : 0;
});

productSchema.virtual('isPopular').get(function() {
  return this.stats.purchases >= 10 || this.stats.rating >= 4.0;
});

productSchema.virtual('mainImage').get(function() {
  return this.images && this.images.length > 0 ? this.images[0] : null;
});

// Middleware pre-save
productSchema.pre('save', function(next) {
  // Actualizar updatedAt
  this.updatedAt = new Date();

  // Validar que el comercio existe y es de tipo comercio
  if (this.isNew || this.isModified('comercio')) {
    this.model('User').findOne({ 
      _id: this.comercio, 
      role: 'comercio',
      isActive: true 
    }).then(comercio => {
      if (!comercio) {
        return next(new Error('Comercio no válido'));
      }
      next();
    }).catch(next);
  } else {
    next();
  }
});

// Middleware pre-validate
productSchema.pre('validate', function(next) {
  // Validar restricciones de edad
  if (this.ageRestrictions && this.ageRestrictions.minAge > this.ageRestrictions.maxAge) {
    return next(new Error('La edad mínima no puede ser mayor que la edad máxima'));
  }

  // Generar tags automáticamente si no existen
  if (!this.tags || this.tags.length === 0) {
    this.tags = [
      this.category,
      ...this.name.toLowerCase().split(' ').filter(word => word.length > 2)
    ];
  }

  next();
});

// Métodos estáticos
productSchema.statics.findActiveProducts = function(filters = {}) {
  const query = { isActive: true, isAvailable: true };
  
  if (filters.category) {
    query.category = filters.category;
  }
  
  if (filters.comercio) {
    query.comercio = filters.comercio;
  }
  
  if (filters.minPrice || filters.maxPrice) {
    query.price = {};
    if (filters.minPrice) query.price.$gte = filters.minPrice;
    if (filters.maxPrice) query.price.$lte = filters.maxPrice;
  }

  if (filters.inStock) {
    query.stock = { $gt: 0 };
  }

  if (filters.ageRange) {
    query['ageRestrictions.minAge'] = { $lte: filters.ageRange };
    query['ageRestrictions.maxAge'] = { $gte: filters.ageRange };
  }

  return this.find(query)
    .populate('comercio', 'name businessCategory profileImage')
    .sort({ 'stats.rating': -1, 'stats.purchases': -1 });
};

productSchema.statics.findByComercio = function(comercioId, includeInactive = false) {
  const query = { comercio: comercioId };
  if (!includeInactive) {
    query.isActive = true;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

productSchema.statics.searchProducts = function(searchTerm, filters = {}) {
  const query = {
    $and: [
      { isActive: true, isAvailable: true },
      {
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { tags: { $in: [new RegExp(searchTerm, 'i')] } },
          { 'specifications.brand': { $regex: searchTerm, $options: 'i' } }
        ]
      }
    ]
  };

  if (filters.category) {
    query.$and.push({ category: filters.category });
  }

  if (filters.minPrice || filters.maxPrice) {
    const priceQuery = {};
    if (filters.minPrice) priceQuery.$gte = filters.minPrice;
    if (filters.maxPrice) priceQuery.$lte = filters.maxPrice;
    query.$and.push({ price: priceQuery });
  }

  return this.find(query)
    .populate('comercio', 'name businessCategory')
    .sort({ 'stats.rating': -1, 'stats.purchases': -1 });
};

productSchema.statics.getFeaturedProducts = function(limit = 8) {
  return this.find({ 
    isFeatured: true, 
    isActive: true, 
    isAvailable: true 
  })
  .populate('comercio', 'name businessCategory')
  .sort({ 'stats.rating': -1 })
  .limit(limit);
};

productSchema.statics.getPopularProducts = function(limit = 10) {
  return this.find({ 
    isActive: true, 
    isAvailable: true,
    'stats.purchases': { $gte: 5 }
  })
  .populate('comercio', 'name businessCategory')
  .sort({ 'stats.purchases': -1, 'stats.rating': -1 })
  .limit(limit);
};

// Métodos de instancia
productSchema.methods.incrementView = function() {
  this.stats.views += 1;
  return this.save();
};

productSchema.methods.recordPurchase = function(amount = 1) {
  this.stats.purchases += amount;
  this.stats.revenue += (this.price * amount);
  this.stats.lastPurchase = new Date();
  
  // Decrementar stock
  if (this.stock >= amount) {
    this.stock -= amount;
  }
  
  return this.save();
};

productSchema.methods.addRating = function(rating) {
  if (rating < 1 || rating > 5) {
    throw new Error('La calificación debe estar entre 1 y 5');
  }

  const currentTotal = this.stats.rating * this.stats.totalRatings;
  this.stats.totalRatings += 1;
  this.stats.rating = (currentTotal + rating) / this.stats.totalRatings;

  return this.save();
};

productSchema.methods.updateStock = function(newStock) {
  if (newStock < 0) {
    throw new Error('El stock no puede ser negativo');
  }
  
  this.stock = newStock;
  this.isAvailable = newStock > 0;
  
  return this.save();
};

productSchema.methods.toggleFeatured = function() {
  this.isFeatured = !this.isFeatured;
  return this.save();
};

productSchema.methods.deactivate = function() {
  this.isActive = false;
  this.deletedAt = new Date();
  return this.save();
};

productSchema.methods.activate = function() {
  this.isActive = true;
  this.deletedAt = null;
  return this.save();
};

productSchema.methods.isAgeAppropriate = function(age) {
  return age >= this.ageRestrictions.minAge && age <= this.ageRestrictions.maxAge;
};

productSchema.methods.needsParentalApproval = function(age) {
  return this.ageRestrictions.requiresParentalApproval || 
         !this.isAgeAppropriate(age);
};

// Transformar JSON output
productSchema.methods.toJSON = function() {
  const product = this.toObject();
  
  // Agregar campos calculados
  product.formattedPrice = this.formattedPrice;
  product.isInStock = this.isInStock;
  product.isLowStock = this.isLowStock;
  product.averageRating = this.averageRating;
  product.isPopular = this.isPopular;
  product.mainImage = this.mainImage;
  
  return product;
};

module.exports = mongoose.model('Product', productSchema);