const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Afiliado = sequelize.define('afiliados', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  fecha_nacimiento: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  tipo_documento: {
    type: DataTypes.ENUM('DNI', 'CI', 'Pasaporte'),
    allowNull: false,
  },
  numero_documento: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  genero: {
    type: DataTypes.ENUM('M', 'F', 'Otro'),
    allowNull: true,
  },
  direccion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  ciudad: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  provincia: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  codigo_postal: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  telefonos: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  email_contacto: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo', 'suspendido'),
    defaultValue: 'activo',
  },
  rol: {
    type: DataTypes.ENUM('titular', 'beneficiario'),
    defaultValue: 'titular',
    allowNull: false,
  },
  grupo_familiar_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  tableName: 'afiliados',
});

// ── Hooks ───────────────────────────────────────────────────────────────────

Afiliado.beforeSave((afiliado) => {
  afiliado.fecha_actualizacion = new Date();
});

module.exports = Afiliado;
