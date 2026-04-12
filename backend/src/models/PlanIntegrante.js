const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PlanIntegrante = sequelize.define('PlanIntegrante', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    plan_numero: { type: DataTypes.INTEGER, allowNull: false },
    persona_id: { type: DataTypes.INTEGER, allowNull: false },
    rol: { type: DataTypes.ENUM('titular', 'integrante'), allowNull: false },
    credencial: { type: DataTypes.CHAR(1), allowNull: false },
    fecha_creacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { tableName: 'plan_integrantes', timestamps: false });

  return PlanIntegrante;
};
