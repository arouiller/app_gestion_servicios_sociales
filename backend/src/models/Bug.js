const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bug = sequelize.define('bugs', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  numero: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  descripcion: {
    type: DataTypes.TEXT('long'),
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('REGISTRADO', 'DESARROLLADO', 'DESESTIMADO', 'CERRADO'),
    allowNull: false,
    defaultValue: 'REGISTRADO',
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'bugs',
  timestamps: false,
});

Bug.beforeSave((bug) => {
  bug.fecha_actualizacion = new Date();
});

module.exports = Bug;
