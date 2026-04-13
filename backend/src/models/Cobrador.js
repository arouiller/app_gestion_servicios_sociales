const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cobrador = sequelize.define('Cobrador', {
  cobrador_numero: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: false },
  cobrador_apellido: { type: DataTypes.STRING(100), allowNull: false },
  cobrador_nombre: { type: DataTypes.STRING(100), allowNull: false },
  fecha_creacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_actualizacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'cobradores', timestamps: false });

module.exports = Cobrador;
