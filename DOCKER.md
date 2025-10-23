# 🐳 Docker Setup - Monedero Digital v2

Este proyecto incluye configuración completa de Docker para desarrollo y producción.

## 📦 Estructura de Contenedores

- **Frontend**: React + Vite servido con Nginx
- **Backend**: Node.js + Express API
- **MongoDB**: Base de datos principal
- **Redis**: Cache y sessions (opcional)

## 🚀 Inicio Rápido

### 1. Configurar variables de entorno
```bash
# Copiar archivo de configuración
copy .env.docker .env

# Editar .env con tus credenciales reales
# Especialmente Cloudinary y JWT_SECRET
```

### 2. Levantar todos los servicios
```bash
# Construir y ejecutar en segundo plano
docker-compose up --build -d

# Ver logs en tiempo real
docker-compose logs -f
```

### 3. Acceder a la aplicación
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017

## 🛠️ Comandos Útiles

### Gestión de contenedores
```bash
# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ borra datos)
docker-compose down -v

# Reconstruir solo un servicio
docker-compose build backend
docker-compose up -d backend

# Ver estado de servicios
docker-compose ps
```

### Logs y debugging
```bash
# Ver logs de un servicio específico
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# Acceder al contenedor
docker-compose exec backend sh
docker-compose exec mongodb mongosh
```

### Base de datos
```bash
# Backup de MongoDB
docker-compose exec mongodb mongodump --uri="mongodb://admin:password123@localhost:27017/digital-wallet?authSource=admin" --out=/tmp/backup

# Restore de MongoDB
docker-compose exec mongodb mongorestore --uri="mongodb://admin:password123@localhost:27017/digital-wallet?authSource=admin" /tmp/backup/digital-wallet
```

## 🔧 Configuración Avanzada

### Variables de entorno importantes

```env
# JWT (cambiar en producción)
JWT_SECRET=monedero_digital_secret_key_2025_docker

# MongoDB
MONGO_USERNAME=admin
MONGO_PASSWORD=password123

# Cloudinary (necesario para subida de imágenes)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Puertos por defecto
- Frontend: 3000
- Backend: 5000
- MongoDB: 27017
- Redis: 6379

### Volúmenes persistentes
- `mongodb_data`: Datos de MongoDB
- `redis_data`: Cache de Redis
- `./backend/src/temp-images`: Imágenes temporales

## 🏭 Producción

### Build optimizado
```bash
# Solo servicios principales
docker-compose -f docker-compose.yml up -d frontend backend mongodb

# Con variables de producción
NODE_ENV=production docker-compose up -d
```

### Nginx personalizado
El frontend usa una configuración Nginx optimizada con:
- Gzip compression
- Cache headers
- Seguridad headers
- SPA routing

### Escalado horizontal
```bash
# Múltiples instancias del backend
docker-compose up -d --scale backend=3
```

## 🛡️ Seguridad

### Recomendaciones para producción:
1. **Cambiar credenciales por defecto** en `.env`
2. **Usar secretos de Docker** en lugar de variables de entorno
3. **Configurar firewall** para limitar acceso a puertos
4. **Usar HTTPS** con certificados SSL
5. **Actualizar imágenes base** regularmente

### Ejemplo con secretos:
```yaml
# En docker-compose.yml
secrets:
  jwt_secret:
    file: ./secrets/jwt_secret.txt
  mongo_password:
    file: ./secrets/mongo_password.txt
```

## 🐛 Troubleshooting

### Problemas comunes:

**Error de conexión MongoDB:**
```bash
# Verificar que MongoDB esté iniciado
docker-compose ps mongodb

# Revisar logs
docker-compose logs mongodb
```

**Frontend no carga:**
```bash
# Verificar build
docker-compose logs frontend

# Reconstruir
docker-compose build frontend --no-cache
```

**Backend no conecta a MongoDB:**
```bash
# Verificar variables de entorno
docker-compose exec backend env | grep MONGO

# Probar conexión manual
docker-compose exec backend node -e "console.log(process.env.MONGODB_URI)"
```

**Puertos ocupados:**
```bash
# Cambiar puertos en docker-compose.yml
ports:
  - "3001:80"  # Frontend en puerto 3001
  - "5001:5000"  # Backend en puerto 5001
```

## 📊 Monitoreo

### Health checks
```bash
# Verificar salud de servicios
curl http://localhost:5000/health
curl http://localhost:3000
```

### Métricas básicas
```bash
# Uso de recursos
docker stats

# Espacio en disco
docker system df
```

---

## 🤝 Desarrollo

Para desarrollo local con hot-reload, usar:
```bash
# Solo base de datos en Docker
docker-compose up -d mongodb redis

# Backend y frontend localmente
cd backend && npm run dev
cd frontend && npm run dev
```