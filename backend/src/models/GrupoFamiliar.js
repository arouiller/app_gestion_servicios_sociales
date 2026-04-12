const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GrupoFamiliar = sequelize.define('grupos_familiares', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo'),
    defaultValue: 'activo',
    allowNull: false,
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
  tableName: 'grupos_familiares',
});

GrupoFamiliar.beforeSave((grupo) => {
  grupo.fecha_actualizacion = new Date();
});

module.exports = GrupoFamiliar;
