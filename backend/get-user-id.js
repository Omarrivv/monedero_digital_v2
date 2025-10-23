// Script para obtener el ID correcto del usuario
const mongoose = require('mongoose');
require('dotenv').config();

async function getUserId() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar usuario por wallet address
    const User = require('./src/models/User');
    const walletAddress = '0x6b9147dd8dd96b11e4d176243808b3ef99d53c6';
    
    const user = await User.findOne({ walletAddress });
    
    if (user) {
      console.log('👤 Usuario encontrado:');
      console.log('- ID:', user._id.toString());
      console.log('- Name:', user.name);
      console.log('- Email:', user.email);
      console.log('- Role:', user.role);
      console.log('- Wallet:', user.walletAddress);
      console.log('- Profile Image:', user.profileImage);
    } else {
      console.log('❌ Usuario no encontrado');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

getUserId();