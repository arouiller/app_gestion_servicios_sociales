const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('audit_log', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  fecha_hora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  metodo: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  endpoint: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  parametros_json: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
  status_response: {
    type: DataTypes.SMALLINT,
    allowNull: true,
  },
  duracion_ms: {
    type: DataTypes.SMALLINT,
    allowNull: true,
  },
}, {
  tableName: 'audit_log',
  timestamps: false,
});

module.exports = AuditLog;
