const express = require('express')
const router = express.Router()
const Producto = require('../models/Producto')
const auth = require('../middleware/auth')
const { body, validationResult } = require('express-validator')

// GET /api/productos - Obtener todos los productos (públicos)
router.get('/', async (req, res) => {
  try {
    const { comercio, categoria, disponible, search } = req.query
    let query = {}

    if (comercio) query.comercio = comercio
    if (categoria) query.categoria = categoria
    if (disponible !== undefined) query.disponible = disponible === 'true'

    let productos

    if (search) {
      productos = await Producto.find({
        ...query,
        $text: { $search: search }
      }).populate('comercio', 'nombreComercio nombrePropietario')
    } else {
      productos = await Producto.find(query)
        .populate('comercio', 'nombreComercio nombrePropietario')
        .sort({ createdAt: -1 })
    }

    res.json(productos)
  } catch (error) {
    console.error('Error al obtener productos:', error)
    res.status(500).json({ message: 'Error del servidor' })
  }
})

// GET /api/productos/comercio/:comercioId - Obtener productos de un comercio específico
router.get('/comercio/:comercioId', async (req, res) => {
  try {
    const productos = await Producto.find({ 
      comercio: req.params.comercioId,
      disponible: true 
    }).sort({ createdAt: -1 })

    res.json(productos)
  } catch (error) {
    console.error('Error al obtener productos del comercio:', error)
    res.status(500).json({ message: 'Error del servidor' })
  }
})

// GET /api/productos/:id - Obtener un producto específico
router.get('/:id', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id)
      .populate('comercio', 'nombreComercio nombrePropietario')

    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' })
    }

    res.json(producto)
  } catch (error) {
    console.error('Error al obtener producto:', error)
    res.status(500).json({ message: 'Error del servidor' })
  }
})

// POST /api/productos - Crear nuevo producto (solo comercios)
router.post('/', [
  auth,
  body('nombre').trim().isLength({ min: 1 }).withMessage('El nombre es requerido'),
  body('descripcion').trim().isLength({ min: 1 }).withMessage('La descripción es requerida'),
  body('precio').isFloat({ min: 0 }).withMessage('El precio debe ser mayor a 0'),
  body('categoria').isIn(['comida', 'bebida', 'postre', 'producto', 'servicio', 'videojuegos', 'accesorios', 'tarjetas', 'calzado', 'ropa']).withMessage('Categoría inválida')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    // Verificar que el usuario sea un comercio
    if (req.user.rol !== 'comercio') {
      return res.status(403).json({ message: 'Solo los comercios pueden crear productos' })
    }

    const producto = new Producto({
      ...req.body,
      comercio: req.user.id
    })

    await producto.save()
    await producto.populate('comercio', 'nombreComercio nombrePropietario')

    res.status(201).json(producto)
  } catch (error) {
    console.error('Error al crear producto:', error)
    res.status(500).json({ message: 'Error del servidor' })
  }
})

// PUT /api/productos/:id - Actualizar producto (solo el comercio propietario)
router.put('/:id', [
  auth,
  body('nombre').optional().trim().isLength({ min: 1 }).withMessage('El nombre no puede estar vacío'),
  body('descripcion').optional().trim().isLength({ min: 1 }).withMessage('La descripción no puede estar vacía'),
  body('precio').optional().isFloat({ min: 0 }).withMessage('El precio debe ser mayor a 0'),
  body('categoria').optional().isIn(['comida', 'bebida', 'postre', 'producto', 'servicio', 'videojuegos', 'accesorios', 'tarjetas', 'calzado', 'ropa']).withMessage('Categoría inválida')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const producto = await Producto.findById(req.params.id)

    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' })
    }

    // Verificar que el usuario sea el propietario del producto
    if (producto.comercio.toString() !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permisos para editar este producto' })
    }

    Object.assign(producto, req.body)
    await producto.save()
    await producto.populate('comercio', 'nombreComercio nombrePropietario')

    res.json(producto)
  } catch (error) {
    console.error('Error al actualizar producto:', error)
    res.status(500).json({ message: 'Error del servidor' })
  }
})

// DELETE /api/productos/:id - Eliminar producto (solo el comercio propietario)
router.delete('/:id', auth, async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id)

    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' })
    }

    // Verificar que el usuario sea el propietario del producto
    if (producto.comercio.toString() !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permisos para eliminar este producto' })
    }

    await Producto.findByIdAndDelete(req.params.id)

    res.json({ message: 'Producto eliminado exitosamente' })
  } catch (error) {
    console.error('Error al eliminar producto:', error)
    res.status(500).json({ message: 'Error del servidor' })
  }
})

// PATCH /api/productos/:id/disponibilidad - Cambiar disponibilidad del producto
router.patch('/:id/disponibilidad', auth, async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id)

    if (!producto) {
      return res.status(404).json({ message: 'Producto no encontrado' })
    }

    // Verificar que el usuario sea el propietario del producto
    if (producto.comercio.toString() !== req.user.id) {
      return res.status(403).json({ message: 'No tienes permisos para modificar este producto' })
    }

    producto.disponible = !producto.disponible
    await producto.save()

    res.json(producto)
  } catch (error) {
    console.error('Error al cambiar disponibilidad:', error)
    res.status(500).json({ message: 'Error del servidor' })
  }
})

// GET /api/productos/mis-productos - Obtener productos del comercio autenticado
router.get('/mis/productos', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'comercio') {
      return res.status(403).json({ message: 'Solo los comercios pueden acceder a esta ruta' })
    }

    const productos = await Producto.find({ comercio: req.user.id })
      .sort({ createdAt: -1 })

    res.json(productos)
  } catch (error) {
    console.error('Error al obtener mis productos:', error)
    res.status(500).json({ message: 'Error del servidor' })
  }
})

module.exports = router