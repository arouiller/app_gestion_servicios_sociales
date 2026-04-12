const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HistorialGrupoFamiliar = sequelize.define('historial_grupo_familiar', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  grupo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  afiliado_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  accion: {
    type: DataTypes.ENUM('ingreso', 'baja'),
    allowNull: false,
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  notas: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  tableName: 'historial_grupo_familiar',
});

module.exports = HistorialGrupoFamiliar;
