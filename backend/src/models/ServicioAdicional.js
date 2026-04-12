const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ServicioAdicional = sequelize.define('ServicioAdicional', {
    servicio_adicional_numero: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: false },
    servicio_adicional_nombre: { type: DataTypes.STRING(100), allowNull: false },
    fecha_creacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    fecha_actualizacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { tableName: 'servicios_adicionales', timestamps: false });

  return ServicioAdicional;
};
