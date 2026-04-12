const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const IntegranteServicio = sequelize.define('IntegranteServicio', {
    plan_integrante_id: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    servicio_adicional_numero: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
  }, { tableName: 'integrante_servicios', timestamps: false });

  return IntegranteServicio;
};
