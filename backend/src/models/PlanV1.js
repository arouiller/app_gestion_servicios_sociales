const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Plan = sequelize.define('planes', {
  plan_numero: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tipo_plan_numero: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  cobrador_numero: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  tipo_de_grupo_numero: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  os_numero: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  numero_afiliado: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  telefono_1: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  telefono_2: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  domicilio: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  localidad: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  valor_cuota: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('ACTIVO', 'SUSPENDIDO'),
    defaultValue: 'ACTIVO',
  },
  zona: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
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
  tableName: 'planes',
});

Plan.beforeSave((plan) => {
  plan.fecha_actualizacion = new Date();
});

module.exports = Plan;
