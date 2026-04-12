const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Plan = sequelize.define('Plan', {
    plan_numero: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tipo_plan_numero: { type: DataTypes.INTEGER, allowNull: false },
    cobrador_numero: { type: DataTypes.INTEGER, allowNull: false },
    tipo_de_grupo_numero: { type: DataTypes.INTEGER, allowNull: false },
    os_numero: { type: DataTypes.INTEGER, allowNull: false },
    numero_afiliado: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    telefono_1: { type: DataTypes.STRING(30), allowNull: true },
    telefono_2: { type: DataTypes.STRING(30), allowNull: true },
    domicilio: { type: DataTypes.STRING(255), allowNull: true },
    localidad: { type: DataTypes.STRING(100), allowNull: true },
    valor_cuota: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    estado: { type: DataTypes.ENUM('ACTIVO', 'SUSPENDIDO'), allowNull: false, defaultValue: 'ACTIVO' },
    fecha_creacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    fecha_actualizacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { tableName: 'planes', timestamps: false });

  return Plan;
};
