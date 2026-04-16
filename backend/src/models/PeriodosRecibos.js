const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PeriodosRecibos = sequelize.define('PeriodosRecibos', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  periodo: {
    type: DataTypes.STRING(7),
    allowNull: false,
    unique: true,
    comment: 'Formato YYYY-MM',
  },
  cantidad_recibos: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Cantidad de recibos generados en este período',
  },
  fecha_generacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'Cuándo se generaron los recibos',
  },
}, {
  tableName: 'periodos_recibos',
  timestamps: true,
});

module.exports = PeriodosRecibos;
