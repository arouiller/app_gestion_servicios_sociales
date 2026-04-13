require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const Usuario = require('../models/Usuario');

async function createAdminUser() {
  try {
    await sequelize.authenticate();
    console.log('✅ Base de datos conectada');

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({
      where: { email: 'alejandro.rouiller@gmail.com' },
    });

    if (usuarioExistente) {
      console.log('⚠️ El usuario ya existe');
      process.exit(0);
    }

    // Hashear password
    const hashedPassword = await bcrypt.hash('Irina2018..', 10);

    // Crear usuario
    const usuario = await Usuario.create({
      email: 'alejandro.rouiller@gmail.com',
      password: hashedPassword,
      role: 'admin',
      nombre: 'Alejandro',
      apellido: 'Rouiller',
      estado: 'activo',
    });

    console.log('✅ Usuario administrador creado exitosamente');
    console.log('Email:', usuario.email);
    console.log('Role:', usuario.role);
    console.log('ID:', usuario.id);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();
