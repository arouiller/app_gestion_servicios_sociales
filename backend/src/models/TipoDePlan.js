const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TipoDePlan = sequelize.define('TipoDePlan', {
    tipo_plan_numero: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: false },
    tipo_plan_nombre: { type: DataTypes.STRING(100), allowNull: false },
    fecha_creacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    fecha_actualizacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { tableName: 'tipos_de_plan', timestamps: false });

  return TipoDePlan;
};
