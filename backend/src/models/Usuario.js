const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const Usuario = sequelize.define('usuarios', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true, // null para usuarios que usen OAuth en el futuro
  },
  rol: {
    type: DataTypes.ENUM('admin', 'usuario'),
    defaultValue: 'usuario',
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo', 'suspendido'),
    defaultValue: 'activo',
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  ultimo_login: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  tema_preferido: {
    type: DataTypes.STRING(50),
    defaultValue: 'claro',
    allowNull: false,
  },
}, {
  timestamps: false,
  tableName: 'usuarios',
});

// ── Métodos de instancia ────────────────────────────────────────────────────

/**
 * Verifica si la contraseña dada coincide con el hash almacenado
 */
Usuario.prototype.verificarPassword = async function (password) {
  if (!this.password_hash) return false;
  return bcrypt.compare(password, this.password_hash);
};

/**
 * Serialización segura: excluye password_hash de las respuestas JSON
 */
Usuario.prototype.toSafeJSON = function () {
  const { password_hash, ...data } = this.get(); // eslint-disable-line no-unused-vars
  return data;
};

// ── Métodos estáticos ───────────────────────────────────────────────────────

/**
 * Hashea una contraseña en texto plano
 */
Usuario.hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

/**
 * Registra la fecha del último login
 */
Usuario.registrarLogin = async (usuarioId) => {
  return Usuario.update({ ultimo_login: new Date() }, { where: { id: usuarioId } });
};

// ── Hooks ───────────────────────────────────────────────────────────────────

Usuario.beforeSave((usuario) => {
  usuario.fecha_actualizacion = new Date();
});

module.exports = Usuario;
