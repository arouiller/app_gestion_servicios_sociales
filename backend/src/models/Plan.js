const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Plan = sequelize.define('planes', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  precio_mensual: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  cobertura: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      const val = this.getDataValue('cobertura');
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return null; }
      }
      return val;
    },
  },
  beneficios: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      const val = this.getDataValue('beneficios');
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return null; }
      }
      return val;
    },
  },
  duracion_meses: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 12,
  },
  limite_dependientes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo', 'descontinuado'),
    defaultValue: 'activo',
  },
  fecha_creacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  fecha_actualizacion: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
  tableName: 'planes_v2_backup',
});

Plan.beforeSave((plan) => {
  plan.fecha_actualizacion = new Date();
});

module.exports = Plan;
