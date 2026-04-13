const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ObraSocial = sequelize.define('ObraSocial', {
  os_numero: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: false },
  os_nombre: { type: DataTypes.STRING(100), allowNull: false },
  fecha_creacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_actualizacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'obras_sociales', timestamps: false });

module.exports = ObraSocial;
