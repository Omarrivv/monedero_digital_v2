const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Registro de usuario
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, walletAddress } = req.body;

    // Verificar si el usuario ya existe
    let user = await User.findOne({
      $or: [{ email }, { walletAddress }],
    });

    if (user) {
      return res.status(400).json({
        message: "Usuario ya existe con este email o wallet address",
      });
    }

    // Validar role
    const validRoles = ["padre", "hijo", "comercio"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: "Rol no válido",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      walletAddress,
      isActive: true,
    });

    await user.save();

    // Crear token JWT
    const payload = {
      userId: user._id,
      role: user.role,
      walletAddress: user.walletAddress,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// Login de usuario
router.post("/login", async (req, res) => {
  try {
    const { email, password, walletAddress } = req.body;

    // Buscar usuario por email o wallet address
    let user = await User.findOne({
      $or: [{ email }, { walletAddress }],
    });

    if (!user) {
      return res.status(400).json({
        message: "Credenciales inválidas",
      });
    }

    // Verificar password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Credenciales inválidas",
      });
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return res.status(400).json({
        message: "Cuenta desactivada",
      });
    }

    // Crear token JWT
    const payload = {
      userId: user._id,
      role: user.role,
      walletAddress: user.walletAddress,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    // Actualizar última conexión
    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        profileImage: user.profileImage,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// Verificar token
router.get("/verify", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        profileImage: user.profileImage,
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Error en verificación:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// Logout (invalidar token en el cliente)
router.post("/logout", auth, async (req, res) => {
  try {
    // En una implementación más robusta, podrías mantener una blacklist de tokens
    res.json({
      success: true,
      message: "Logout exitoso",
    });
  } catch (error) {
    console.error("Error en logout:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// Cambiar password
router.put("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Verificar password actual
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Password actual incorrecto",
      });
    }

    // Hash nuevo password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error al cambiar password:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// Obtener perfil del usuario
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select("-password")
      .populate("children", "name walletAddress profileImage");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// Actualizar perfil
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, profileImage, businessCategory } = req.body;

    const updateData = { name };

    if (profileImage) {
      updateData.profileImage = profileImage;
    }

    if (businessCategory && req.user.role === "comercio") {
      updateData.businessCategory = businessCategory;
    }

    const user = await User.findByIdAndUpdate(req.user.userId, updateData, {
      new: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// Rutas específicas para compatibilidad con frontend
router.post("/register/padre", async (req, res) => {
  try {
    console.log("🔍 Registro de padre iniciado");
    console.log("📋 Body recibido:", JSON.stringify(req.body, null, 2));

    const {
      nombre,
      apellido,
      email,
      walletAddress,
      password,
      telefono,
      fotoPerfil,
    } = req.body;

    // Validaciones básicas - solo campos esenciales
    if (!nombre || !email || !walletAddress || !password) {
      console.log("❌ Faltan campos requeridos");
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: nombre, email, walletAddress, password",
      });
    }

    console.log("🔍 Verificando si usuario existe...");
    console.log("📧 Email a verificar:", email);
    console.log("💳 Wallet a verificar:", walletAddress);

    // Verificar si el usuario ya existe
    let user = await User.findOne({
      $or: [{ email }, { walletAddress }],
    });

    if (user) {
      console.log("❌ Usuario ya existe:", {
        existingEmail: user.email,
        existingWallet: user.walletAddress,
        role: user.role
      });
      return res.status(400).json({
        success: false,
        message: "Usuario ya existe con este email o wallet address",
      });
    }

    console.log("✅ Usuario no existe, procediendo con registro");

    // Hash password
    console.log("🔐 Hasheando password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("✅ Password hasheado exitosamente");

    // Crear nuevo padre con datos mínimos y manejo de campos opcionales
    console.log("👤 Creando usuario...");
    const userData = {
      name: apellido ? `${nombre} ${apellido}` : nombre,
      email,
      password: hashedPassword,
      role: "padre",
      walletAddress,
      isActive: true,
      children: [], // Inicializar array vacío
    };

    // Agregar campos opcionales solo si están presentes
    if (telefono && telefono.trim()) {
      userData.telefono = telefono.trim();
    }
    if (fotoPerfil && fotoPerfil.trim()) {
      userData.profileImage = fotoPerfil.trim();
    }

    console.log("📝 Datos del usuario a crear:", {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      walletAddress: userData.walletAddress,
      telefono: userData.telefono || 'No proporcionado',
      profileImage: userData.profileImage || 'No proporcionado'
    });

    user = new User(userData);

    console.log("💾 Guardando usuario en BD...");
    await user.save();
    console.log("✅ Usuario guardado exitosamente con ID:", user._id);

    // Generar token
    console.log("🔑 Generando token JWT...");
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role, 
        walletAddress: user.walletAddress 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    console.log("✅ Token generado exitosamente");

    console.log("🎉 Registro completado exitosamente");

    res.json({
      success: true,
      message: "Padre registrado exitosamente",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        telefono: user.telefono,
        profileImage: user.profileImage,
      },
      token,
    });
  } catch (error) {
    console.error("❌ Error detallado al registrar padre:", {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });

    // Manejar errores específicos de MongoDB
    let errorMessage = "Error del servidor";

    if (error.name === "ValidationError") {
      console.error("❌ Error de validación:", error.errors);
      errorMessage = "Datos de entrada inválidos";
      
      // Detalles específicos de validación
      const validationErrors = Object.keys(error.errors).map(key => 
        `${key}: ${error.errors[key].message}`
      );
      console.error("❌ Errores de validación específicos:", validationErrors);
      
    } else if (error.code === 11000) {
      console.error("❌ Error de duplicado:", error.keyPattern);
      errorMessage = "El email o wallet address ya están registrados";
    } else if (error.name === "MongoNetworkError") {
      console.error("❌ Error de red MongoDB");
      errorMessage = "Error de conexión a la base de datos";
    } else if (error.name === "MongoTimeoutError") {
      console.error("❌ Timeout MongoDB");
      errorMessage = "Timeout de conexión a la base de datos";
    } else if (error.name === "MongoServerError") {
      console.error("❌ Error del servidor MongoDB");
      errorMessage = "Error del servidor de base de datos";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? {
        message: error.message,
        name: error.name,
        code: error.code
      } : undefined,
    });
  }
});

router.post("/register/comercio", async (req, res) => {
  try {
    const userData = { ...req.body, role: "comercio" };

    const {
      nombre,
      email,
      walletAddress,
      telefono,
      categoria,
      descripcion,
      direccion,
      logoUrl,
      bannerUrl,
    } = userData;

    // Verificar si el usuario ya existe
    let user = await User.findOne({
      $or: [{ email }, { walletAddress }],
    });

    if (user) {
      return res.status(400).json({
        success: false,
        message: "Usuario ya existe con este email o wallet address",
      });
    }

    // Crear nuevo comercio
    user = new User({
      name: nombre,
      email,
      role: "comercio",
      walletAddress,
      telefono,
      businessCategory: categoria,
      businessDescription: descripcion,
      businessAddress: direccion,
      profileImage: logoUrl,
      bannerImage: bannerUrl,
    });

    await user.save();

    // Generar token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: "Comercio registrado exitosamente",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        businessCategory: user.businessCategory,
        businessDescription: user.businessDescription,
        businessAddress: user.businessAddress,
        profileImage: user.profileImage,
        bannerImage: user.bannerImage,
      },
      token,
    });
  } catch (error) {
    console.error("Error al registrar comercio:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor",
    });
  }
});

// Registrar hijo
router.post("/register/hijo", async (req, res) => {
  try {
    const { nombre, apellido, edad, walletAddress, password, padreAddress } =
      req.body;

    // Validaciones básicas
    if (
      !nombre ||
      !apellido ||
      !edad ||
      !walletAddress ||
      !password ||
      !padreAddress
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Faltan campos requeridos: nombre, apellido, edad, walletAddress, password, padreAddress",
      });
    }

    // Verificar que la edad esté en el rango válido
    if (edad < 5 || edad > 18) {
      return res.status(400).json({
        success: false,
        message: "La edad debe estar entre 5 y 18 años",
      });
    }

    // Verificar que el padre existe
    const padre = await User.findOne({
      walletAddress: padreAddress,
      role: "padre",
      isActive: true,
    });

    if (!padre) {
      return res.status(400).json({
        success: false,
        message: "Padre no encontrado o no activo",
      });
    }

    // Validar formato de wallet address
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        message:
          "La dirección de wallet debe tener el formato 0x seguido de 40 caracteres hexadecimales",
      });
    }

    // Verificar si ya existe un usuario con esa wallet
    let existingUser = await User.findOne({ walletAddress });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un usuario con esta wallet address",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear nuevo hijo
    const hijo = new User({
      name: `${nombre} ${apellido}`,
      apellido,
      email: `${nombre.toLowerCase().replace(/\s+/g, "")}.${apellido
        .toLowerCase()
        .replace(/\s+/g, "")}@hijo.com`, // Email temporal para hijos
      role: "hijo",
      walletAddress,
      password: hashedPassword,
      parent: padre._id,
      age: parseInt(edad),
      allowance: 0,
      isActive: true,
    });

    await hijo.save();

    // Actualizar la lista de hijos del padre
    await User.findByIdAndUpdate(padre._id, { $push: { children: hijo._id } });

    res.json({
      success: true,
      message: "Hijo registrado exitosamente",
      hijo: {
        id: hijo._id,
        name: hijo.name,
        apellido: hijo.apellido,
        walletAddress: hijo.walletAddress,
        age: hijo.age,
        allowance: hijo.allowance,
        parent: padre._id,
      },
    });
  } catch (error) {
    // Manejar errores específicos de MongoDB
    let errorMessage = "Error del servidor";

    if (error.name === "ValidationError") {
      errorMessage = "Datos de entrada inválidos";
    } else if (error.code === 11000) {
      errorMessage = "La wallet address ya está registrada";
    } else if (error.name === "MongoNetworkError") {
      errorMessage = "Error de conexión a la base de datos";
    } else if (error.name === "MongoTimeoutError") {
      errorMessage = "Timeout de conexión a la base de datos";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Ruta para verificar si un wallet existe
router.get("/check/:walletAddress", async (req, res) => {
  try {
    const { walletAddress } = req.params;

    // Validar que walletAddress no esté vacío
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet address es requerido",
      });
    }

    console.log(`Verificando usuario con wallet: ${walletAddress}`);

    // Verificar si mongoose está conectado
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) {
      console.log("MongoDB no conectado, devolviendo usuario no encontrado");
      return res.json({
        exists: false,
        message: "Database not connected - development mode",
      });
    }

    // Buscar usuario por wallet address (case insensitive)
    const user = await User.findOne({
      walletAddress: { $regex: new RegExp(`^${walletAddress}$`, "i") },
    });

    console.log(`Usuario encontrado:`, user ? "Sí" : "No");
    console.log(`Wallet buscada: ${walletAddress}`);

    // También buscar todos los usuarios para debug
    const allUsers = await User.find({}, "walletAddress role name email");
    console.log(
      "Usuarios en BD:",
      allUsers.map((u) => ({
        wallet: u.walletAddress,
        role: u.role,
        name: u.name,
      }))
    );

    if (user) {
      // Si es padre, incluir children
      const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        profileImage: user.profileImage || user.fotoPerfil,
      };

      // Si es padre, agregar children si existen
      if (user.role === "padre" && user.children) {
        userData.children = user.children;
      }

      // Generar token JWT para el usuario autenticado
      const jwt = require("jsonwebtoken");
      const token = jwt.sign(
        {
          userId: user._id,
          walletAddress: user.walletAddress,
          role: user.role,
        },
        process.env.JWT_SECRET || "fallback_secret_key",
        { expiresIn: "24h" }
      );

      res.json({
        exists: true,
        user: userData,
        token: token,
      });
    } else {
      res.json({
        exists: false,
      });
    }
  } catch (error) {
    console.error("Error detallado al verificar usuario:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Error interno",
    });
  }
});

// Endpoint temporal para debug - listar todos los usuarios
router.get("/debug/users", async (req, res) => {
  try {
    const users = await User.find(
      {},
      "walletAddress role name email createdAt"
    );
    res.json({
      success: true,
      count: users.length,
      users: users.map((u) => ({
        id: u._id,
        wallet: u.walletAddress,
        role: u.role,
        name: u.name,
        email: u.email,
        created: u.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({
      success: false,
      message: "Error getting users",
      error: error.message,
    });
  }
});

// Establecer límites de gasto para un hijo
router.post("/set-limits", async (req, res) => {
  try {
    console.log("🔧 Estableciendo límites...");
    console.log("📥 Datos recibidos:", req.body);

    const { hijoId, limits, padreAddress } = req.body;

    // Validaciones básicas
    if (!hijoId || !limits || !padreAddress) {
      console.log("❌ Faltan campos requeridos");
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: hijoId, limits, padreAddress",
      });
    }

    // Verificar que el padre existe
    console.log("🔍 Buscando padre con wallet:", padreAddress);
    const padre = await User.findOne({
      walletAddress: padreAddress,
      role: "padre",
    });

    if (!padre) {
      console.log("❌ Padre no encontrado");
      return res.status(400).json({
        success: false,
        message: "Padre no encontrado",
      });
    }

    console.log("✅ Padre encontrado:", padre.name, "ID:", padre._id);

    // Verificar que el hijo existe y pertenece al padre
    console.log("🔍 Buscando hijo con ID:", hijoId, "y parent:", padre._id);
    const hijo = await User.findOne({
      _id: hijoId,
      role: "hijo",
      parent: padre._id,
    });

    if (!hijo) {
      console.log("❌ Hijo no encontrado o no pertenece al padre");
      // Buscar hijo sin restricción de parent para debug
      const hijoSinParent = await User.findOne({
        _id: hijoId,
        role: "hijo",
      });
      console.log(
        "🔍 Hijo encontrado sin parent:",
        hijoSinParent ? hijoSinParent.name : "No encontrado"
      );
      if (hijoSinParent) {
        console.log("🔍 Parent del hijo:", hijoSinParent.parent);
      }

      return res.status(400).json({
        success: false,
        message: "Hijo no encontrado o no pertenece a este padre",
      });
    }

    console.log("✅ Hijo encontrado:", hijo.name);
    console.log("📝 Límites a establecer:", limits);

    // Preparar los límites en el formato correcto
    const fechaKey = new Date(limits.fecha).toISOString().split("T")[0];
    const limiteData = {
      limite: limits.limite,
      categorias: limits.categorias || [],
      activo: limits.activo !== false,
    };

    // Actualizar los límites del hijo usando dot notation para agregar/actualizar por fecha
    const updateQuery = {
      [`spendingLimits.${fechaKey}`]: limiteData,
      updatedAt: new Date(),
    };

    const updatedHijo = await User.findByIdAndUpdate(
      hijoId,
      { $set: updateQuery },
      { new: true }
    ).select("-password");

    console.log("✅ Límites actualizados en BD");
    console.log("📊 Hijo actualizado:", {
      name: updatedHijo.name,
      spendingLimits: updatedHijo.spendingLimits,
    });

    res.json({
      success: true,
      message: "Límites establecidos exitosamente",
      hijo: updatedHijo,
    });
  } catch (error) {
    console.error("Error setting limits:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Error interno",
    });
  }
});

// Endpoint temporal para debug - obtener datos de un hijo específico
router.get("/debug/hijo/:hijoId", async (req, res) => {
  try {
    const { hijoId } = req.params;

    const hijo = await User.findById(hijoId).select("-password");

    if (!hijo) {
      return res.status(404).json({
        success: false,
        message: "Hijo no encontrado",
      });
    }

    res.json({
      success: true,
      hijo: {
        id: hijo._id,
        name: hijo.name,
        role: hijo.role,
        parent: hijo.parent,
        spendingLimits: hijo.spendingLimits,
        updatedAt: hijo.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error getting hijo:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor",
      error: error.message,
    });
  }
});

// Obtener límites de un hijo específico
router.get("/get-limits/:hijoId", async (req, res) => {
  try {
    const { hijoId } = req.params;

    console.log("🔍 Obteniendo límites para hijo:", hijoId);

    const hijo = await User.findById(hijoId).select("spendingLimits name");

    if (!hijo) {
      return res.status(404).json({
        success: false,
        message: "Hijo no encontrado",
      });
    }

    console.log("✅ Límites encontrados:", hijo.spendingLimits);

    res.json({
      success: true,
      limits: hijo.spendingLimits || {},
      hijoName: hijo.name,
    });
  } catch (error) {
    console.error("Error getting limits:", error);
    res.status(500).json({
      success: false,
      message: "Error del servidor",
      error: error.message,
    });
  }
});

module.exports = router;
