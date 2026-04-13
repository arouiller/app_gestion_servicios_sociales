const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HistorialCuota = sequelize.define('HistorialCuota', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  plan_numero: { type: DataTypes.INTEGER, allowNull: false },
  valor_anterior: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  valor_nuevo: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  fecha_cambio: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'historial_cuota', timestamps: false });

module.exports = HistorialCuota;
