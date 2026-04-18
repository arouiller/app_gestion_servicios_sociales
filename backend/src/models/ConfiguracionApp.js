const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConfiguracionApp = sequelize.define('ConfiguracionApp', {
  tipo_notificacion: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  duracion_ms: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5000,
  },
}, {
  tableName: 'configuracion_app',
  timestamps: true,
});

module.exports = ConfiguracionApp;
