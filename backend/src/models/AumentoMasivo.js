const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AumentoMasivo = sequelize.define('AumentoMasivo', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fecha: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  porcentaje: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'aumentos_masivos' });

module.exports = AumentoMasivo;
