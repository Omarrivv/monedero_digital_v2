const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Obtener token del header
    const token = req.header('Authorization');
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Acceso denegado. No se proporcionó token.' 
      });
    }

    // Remover 'Bearer ' del token si existe
    const cleanToken = token.startsWith('Bearer ') 
      ? token.slice(7) 
      : token;

    // Verificar token
    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    
    // Verificar que el usuario todavía existe
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Token inválido. Usuario no encontrado.' 
      });
    }

    // Verificar que el usuario está activo
    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Cuenta desactivada.' 
      });
    }

    // Agregar usuario al request
    req.user = {
      userId: user._id.toString(),
      role: user.role,
      walletAddress: user.walletAddress,
      name: user.name,
      email: user.email
    };

    next();
    
  } catch (error) {
    console.error('Error en middleware auth:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token inválido.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expirado.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Error del servidor en autenticación.' 
    });
  }
};

// Middleware para verificar roles específicos
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Usuario no autenticado.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}` 
      });
    }

    next();
  };
};

// Middleware para verificar que es padre
const requirePadre = (req, res, next) => {
  if (req.user.role !== 'padre') {
    return res.status(403).json({ 
      message: 'Acceso denegado. Solo disponible para padres.' 
    });
  }
  next();
};

// Middleware para verificar que es hijo
const requireHijo = (req, res, next) => {
  if (req.user.role !== 'hijo') {
    return res.status(403).json({ 
      message: 'Acceso denegado. Solo disponible para hijos.' 
    });
  }
  next();
};

// Middleware para verificar que es comercio
const requireComercio = (req, res, next) => {
  if (req.user.role !== 'comercio') {
    return res.status(403).json({ 
      message: 'Acceso denegado. Solo disponible para comercios.' 
    });
  }
  next();
};

// Middleware opcional de autenticación (no falla si no hay token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization');
    
    if (!token) {
      req.user = null;
      return next();
    }

    const cleanToken = token.startsWith('Bearer ') 
      ? token.slice(7) 
      : token;

    const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive) {
      req.user = {
        userId: user._id.toString(),
        role: user.role,
        walletAddress: user.walletAddress,
        name: user.name,
        email: user.email
      };
    } else {
      req.user = null;
    }

    next();
    
  } catch (error) {
    // En caso de error, simplemente continuar sin usuario
    req.user = null;
    next();
  }
};

module.exports = {
  auth,
  requireRole,
  requirePadre,
  requireHijo,
  requireComercio,
  optionalAuth
};