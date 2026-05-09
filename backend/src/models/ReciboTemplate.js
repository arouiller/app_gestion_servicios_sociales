const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReciboTemplate = sequelize.define('ReciboTemplate', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING(255), allowNull: false },
  html: { type: DataTypes.TEXT('long'), allowNull: false },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
  activo: { type: DataTypes.BOOLEAN, defaultValue: false },
  fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  descripcion: { type: DataTypes.TEXT },
}, { tableName: 'recibo_templates', timestamps: false });

module.exports = ReciboTemplate;
