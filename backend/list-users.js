// Script para listar todos los usuarios
const mongoose = require('mongoose');
require('dotenv').config();

async function listUsers() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener todos los usuarios
    const User = require('./src/models/User');
    const users = await User.find({}).select('-password');
    
    console.log(`📋 Total de usuarios: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`👤 Usuario ${index + 1}:`);
      console.log('- ID:', user._id.toString());
      console.log('- Name:', user.name);
      console.log('- Email:', user.email);
      console.log('- Role:', user.role);
      console.log('- Wallet:', user.walletAddress);
      console.log('- Profile Image:', user.profileImage);
      console.log('- Created:', user.createdAt);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

listUsers();