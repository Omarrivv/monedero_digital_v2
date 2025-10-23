// Script de inicialización para MongoDB
db = db.getSiblingDB('digital-wallet');

// Crear usuario para la aplicación
db.createUser({
  user: 'monedero_user',
  pwd: 'monedero_pass_2025',
  roles: [
    {
      role: 'readWrite',
      db: 'digital-wallet'
    }
  ]
});

// Crear colecciones iniciales
db.createCollection('users');
db.createCollection('transactions');
db.createCollection('products');
db.createCollection('limits');

// Insertar datos de ejemplo (opcional)
db.users.insertOne({
  name: 'Usuario Demo',
  email: 'demo@monedero.com',
  role: 'padre',
  wallet: '0x0000000000000000000000000000000000000000',
  createdAt: new Date()
});

print('Base de datos inicializada correctamente');