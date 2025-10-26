# 🚀 GUÍA DE DEPLOYMENT - MONEDERO DIGITAL V2

Esta guía te ayudará a desplegar tu aplicación en diferentes plataformas de la nube.

## 📋 CONFIGURACIÓN PREVIA

### 1. Variables de Entorno Requeridas
```bash
# Obligatorias
MONGODB_URI=tu_mongodb_atlas_uri
JWT_SECRET=tu_jwt_secret_super_seguro
CLOUDINARY_CLOUD_NAME=tu_cloudinary_name
CLOUDINARY_API_KEY=tu_cloudinary_key
CLOUDINARY_API_SECRET=tu_cloudinary_secret

# URLs (se configuran automáticamente según la plataforma)
FRONTEND_URL=https://tu-frontend-url.com
BACKEND_URL=https://tu-backend-url.com
```

---

## 🌐 DEPLOYMENT EN RENDER

### Backend (API)
1. **Conectar repositorio** en Render
2. **Configurar build:**
   ```bash
   Build Command: cd backend && npm install
   Start Command: cd backend && npm start
   ```
3. **Variables de entorno:**
   ```bash
   NODE_ENV=production
   MONGODB_URI=tu_mongodb_uri
   JWT_SECRET=tu_jwt_secret
   CLOUDINARY_CLOUD_NAME=tu_cloudinary_name
   CLOUDINARY_API_KEY=tu_cloudinary_key
   CLOUDINARY_API_SECRET=tu_cloudinary_secret
   FRONTEND_URL=https://tu-frontend.onrender.com
   ```

### Frontend (React)
1. **Configurar build:**
   ```bash
   Build Command: cd frontend && npm install && npm run build
   Publish Directory: frontend/dist
   ```
2. **Variables de entorno:**
   ```bash
   VITE_API_URL=https://tu-backend.onrender.com/api
   VITE_BACKEND_URL=https://tu-backend.onrender.com
   ```

---

## ⚡ DEPLOYMENT EN VERCEL + RAILWAY

### Frontend en Vercel
1. **Conectar repositorio**
2. **Configurar:**
   ```bash
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```
3. **Variables de entorno:**
   ```bash
   VITE_API_URL=https://tu-backend.up.railway.app/api
   VITE_BACKEND_URL=https://tu-backend.up.railway.app
   ```

### Backend en Railway
1. **Conectar repositorio**
2. **Configurar:**
   ```bash
   Start Command: cd backend && npm start
   ```
3. **Variables de entorno:** (igual que Render)

---

## 🐳 DEPLOYMENT CON DOCKER

### Desarrollo Local
```bash
# Configurar variables en .env
cp .env.example .env

# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

### Producción
```bash
# Build para producción
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🛠️ SCRIPT AUTOMÁTICO DE CONFIGURACIÓN

Usa nuestro script para configurar automáticamente las variables:

```bash
# Para Render
node scripts/setup-env.js render

# Para Railway
node scripts/setup-env.js railway

# Para Heroku
node scripts/setup-env.js heroku
```

---

## ✅ CHECKLIST DE DEPLOYMENT

### Antes del Deploy:
- [ ] MongoDB Atlas configurado y accesible
- [ ] Cloudinary configurado
- [ ] Variables de entorno configuradas
- [ ] CORS configurado para tu dominio
- [ ] JWT_SECRET cambiado (no usar el de ejemplo)

### Después del Deploy:
- [ ] Backend responde en `/health`
- [ ] Frontend carga correctamente
- [ ] Registro de usuarios funciona
- [ ] Upload de imágenes funciona
- [ ] CORS permite requests del frontend

---

## 🔧 TROUBLESHOOTING

### Error de CORS
```javascript
// El backend automáticamente permite tu FRONTEND_URL
// Asegúrate de que FRONTEND_URL esté configurada correctamente
```

### Error de MongoDB
```bash
# Verifica que tu IP esté en la whitelist de MongoDB Atlas
# O usa 0.0.0.0/0 para permitir todas las IPs
```

### Error de Cloudinary
```bash
# Verifica que todas las variables de Cloudinary estén configuradas:
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key  
CLOUDINARY_API_SECRET=tu_api_secret
```

---

## 📊 MONITOREO

### Health Checks
- Backend: `https://tu-backend.com/health`
- API: `https://tu-backend.com/api/health`

### Logs
```bash
# Render
Ver logs en el dashboard de Render

# Railway  
railway logs

# Docker
docker-compose logs -f
```

---

## 🚀 OPTIMIZACIONES PARA PRODUCCIÓN

### Backend
- Rate limiting configurado automáticamente
- CORS dinámico según FRONTEND_URL
- Helmet para seguridad
- Compresión habilitada

### Frontend
- Build optimizado con Vite
- Assets minificados
- Lazy loading implementado

---

¡Tu aplicación está lista para producción! 🎉