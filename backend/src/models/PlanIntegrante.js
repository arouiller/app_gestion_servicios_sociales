const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlanIntegrante = sequelize.define('PlanIntegrante', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  plan_numero: { type: DataTypes.INTEGER, allowNull: false },
  persona_id: { type: DataTypes.INTEGER, allowNull: false },
  zona_id: { type: DataTypes.INTEGER, allowNull: true },
  rol: { type: DataTypes.ENUM('titular','integrante'), allowNull: false },
  credencial: { type: DataTypes.CHAR(1), allowNull: false },
  fecha_creacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  zona_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'zonas',
      key: 'id'
    }
  },
}, { tableName: 'plan_integrantes', timestamps: false });

PlanIntegrante.associate = (models) => {
  PlanIntegrante.belongsTo(models.Zona, {
    foreignKey: 'zona_id',
    as: 'zona'
  });
};

module.exports = PlanIntegrante;
