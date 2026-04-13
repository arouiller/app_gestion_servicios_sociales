const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReciboIntegrante = sequelize.define('ReciboIntegrante', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  recibo_id: { type: DataTypes.INTEGER, allowNull: false },
  apellido: { type: DataTypes.STRING(100), allowNull: false },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  tipo_documento: { type: DataTypes.ENUM('DNI','LC','LE','PASAPORTE'), allowNull: false },
  numero_documento: { type: DataTypes.STRING(20), allowNull: false },
  fecha_nacimiento: { type: DataTypes.DATE, allowNull: false },
  fecha_cobertura: { type: DataTypes.DATE, allowNull: false },
  rol: { type: DataTypes.ENUM('titular','integrante'), allowNull: false },
}, { tableName: 'recibo_integrantes', timestamps: false });

module.exports = ReciboIntegrante;
