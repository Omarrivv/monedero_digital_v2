
# 💰 Monedero Digital v2

Una aplicación completa de monedero digital para padres e hijos, construida con React, Node.js, MongoDB y integración blockchain.

## INICIO

### ✅ 1) Descripción

Monedero Digital v2 es una DApp orientada a familias: permite a padres/tutores crear y gestionar cuentas para sus hijos, asignar límites de gasto, transferir fondos entre wallets y efectuar pagos en comercios autorizados. Usa un frontend moderno (React + Vite), backend en Node.js con MongoDB y soporte para wallets Ethereum (Metamask). Además incorpora subida y gestión de imágenes mediante Cloudinary.

### ✅ 2) Objetivos

- Proveer una plataforma segura y accesible para que padres administren el dinero de sus hijos mediante wallets.
- Permitir control parental mediante límites de gasto por día/semana y categorías.
- Ofrecer a comercios una forma sencilla de aceptar pagos desde las wallets de los hijos.
- Mantener trazabilidad completa de transacciones y actividades (historial y auditoría).

### ✅ 3) Beneficios

- Control y visibilidad para padres sobre el gasto de los hijos.
- Flujo de pagos simplificado para comercios pequeños.
- Registro de transacciones y límites con fácil visualización.
- Arquitectura modular que facilita pruebas y despliegues.

### ✅ 4) Características

- Roles: Padre/Tutor, Hijo y Comercio.
- Calendario de límites y categorías de gasto.
- Transferencias internas y pagos a comercios.
- Perfiles con imagen (Cloudinary) y edición de datos.
- Historial de transacciones y filtros.
- Integración con Metamask y soporte para testnets.

### ✅ 5) Integrantes del equipo

- Frank Salazar — Frontend (React, Vite, Tailwind).  
	![Frank Salazar](docs/team/frank.jpg "Frank Salazar")

- Omar Rivera — Backend (Node.js, Express, MongoDB, Smart Contracts).  
	![Omar Rivera](docs/team/omar.jpg "Omar Rivera")

> Nota: coloca las fotos en `docs/team/` (por ejemplo `docs/team/frank.jpg`). Si no tienes las imágenes, reemplaza las rutas por URLs públicas o elimina las líneas de imagen.

## 🚀 Características

- **👨‍👩‍👧‍👦 Gestión Familiar**: Los padres pueden registrar y gestionar cuentas de sus hijos
- **💳 Wallet Integration**: Integración con wallets de Ethereum
- **📊 Límites de Gasto**: Los padres pueden establecer límites diarios, semanales y mensuales
- **🏪 Sistema de Comercios**: Comercios pueden registrarse y vender productos
- **📱 Interfaz Moderna**: UI/UX moderna y responsive
- **☁️ Upload de Imágenes**: Integración con Cloudinary para manejo de imágenes
- **🔐 Autenticación JWT**: Sistema seguro de autenticación
- **📈 Historial de Transacciones**: Seguimiento completo de todas las transacciones

## 🛠️ Tecnologías

### Frontend
- **React 18** con Vite
- **Tailwind CSS** para estilos
- **React Router** para navegación
- **Axios** para peticiones HTTP
- **React Hot Toast** para notificaciones
- **Lucide React** para iconos

### Backend
- **Node.js** con Express
- **MongoDB** con Mongoose
- **JWT** para autenticación
- **Cloudinary** para manejo de imágenes
- **Multer** para upload de archivos
- **bcryptjs** para hash de passwords

### Base de Datos
- **MongoDB Atlas** (Cloud)
- Modelos para Users, Transactions, Products, etc.

## 📋 Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Cuenta de MongoDB Atlas
- Cuenta de Cloudinary
- Git

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/Omarrivv/monedero_digital_v2.git
cd monedero_digital_v2
```

### 2. Configurar Backend
```bash
cd backend
npm install
```

Crear archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://tu_usuario:tu_password@cluster0.xxxxx.mongodb.net/digital-wallet?retryWrites=true&w=majority

# Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro
```

### 3. Configurar Frontend
```bash
cd ../frontend
npm install
```

### 4. Ejecutar la aplicación

**Backend** (Puerto 5000):
```bash
cd backend
npm run dev
```

**Frontend** (Puerto 3000):
```bash
cd frontend
npm run dev
```

## 📁 Estructura del Proyecto

```
monedero_digital_v2/
├── backend/
│   ├── src/
│   │   ├── models/          # Modelos de MongoDB
│   │   ├── routes/          # Rutas de la API
│   │   ├── middleware/      # Middlewares (auth, upload, etc.)
│   │   └── utils/           # Utilidades (database, cloudinary)
│   ├── server.js            # Servidor principal
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes reutilizables
│   │   ├── pages/           # Páginas principales
│   │   ├── services/        # Servicios API
│   │   └── utils/           # Utilidades del frontend
│   ├── index.html
│   └── package.json
└── README.md
```

## 🔧 Configuración

### MongoDB Atlas
1. Crear cuenta en [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crear un cluster
3. Configurar Network Access (0.0.0.0/0 para desarrollo)
4. Crear usuario de base de datos
5. Obtener connection string

### Cloudinary
1. Crear cuenta en [Cloudinary](https://cloudinary.com/)
2. Obtener Cloud Name, API Key y API Secret del dashboard
3. Configurar en variables de entorno

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/register/padre` - Registrar padre
- `POST /api/auth/register/hijo` - Registrar hijo
- `POST /api/auth/register/comercio` - Registrar comercio
- `GET /api/auth/check/:walletAddress` - Verificar usuario

### Upload de Imágenes
- `POST /api/upload/register-image` - Subir imagen durante registro
- `POST /api/upload/profile` - Actualizar imagen de perfil

### Límites
- `POST /api/auth/set-limits` - Establecer límites de gasto
- `GET /api/auth/get-limits/:hijoId` - Obtener límites

## 🚀 Deployment

### Backend (Railway/Heroku)
1. Configurar variables de entorno en la plataforma
2. Conectar repositorio
3. Deploy automático

### Frontend (Vercel/Netlify)
1. Configurar build command: `npm run build`
2. Configurar output directory: `dist`
3. Configurar variables de entorno

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👨‍💻 Autor

**Omar Rivera** - [@Omarrivv](https://github.com/Omarrivv)

## 🙏 Agradecimientos

- React Team por el excelente framework
- MongoDB por la base de datos cloud
- Cloudinary por el servicio de imágenes
- Tailwind CSS por los estilos

---

⭐ ¡Dale una estrella si este proyecto te ayudó!
