const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Persona = sequelize.define('Persona', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  apellido: { type: DataTypes.STRING(100), allowNull: false },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  tipo_documento: { type: DataTypes.ENUM('DNI','LC','LE','PASAPORTE'), allowNull: false },
  numero_documento: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  fecha_nacimiento: { type: DataTypes.DATE, allowNull: false },
  fecha_cobertura: { type: DataTypes.DATE, allowNull: false },
  zona: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  fecha_creacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_actualizacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'personas', timestamps: false });

module.exports = Persona;
