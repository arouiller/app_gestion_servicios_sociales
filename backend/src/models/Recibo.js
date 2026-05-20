const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Recibo = sequelize.define('Recibo', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  numero_recibo: { type: DataTypes.INTEGER },
  plan_numero: { type: DataTypes.INTEGER, allowNull: false },
  periodo: { type: DataTypes.STRING(10), allowNull: false }, // YYYY-MM-DD
  numero_afiliado: { type: DataTypes.STRING(50), allowNull: false },
  titular_apellido: { type: DataTypes.STRING(100), allowNull: false },
  titular_nombre: { type: DataTypes.STRING(100), allowNull: false },
  obra_social_nombre: { type: DataTypes.STRING(100), allowNull: false },
  tipo_plan_nombre: { type: DataTypes.STRING(100), allowNull: false },
  tipo_de_grupo_nombre: { type: DataTypes.STRING(100), allowNull: false },
  cobrador_apellido: { type: DataTypes.STRING(100), allowNull: false },
  cobrador_nombre: { type: DataTypes.STRING(100), allowNull: false },
  domicilio: { type: DataTypes.STRING(255) },
  valor_cuota: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  cuota_social: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Valor de cuota social del sistema al momento de generar recibo'
  },
  arancel_por_servicio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Diferencia entre valor_cuota y cuota_social (servicios facturados)'
  },
  zona_codigo: { type: DataTypes.STRING(10) },
  fecha_emision: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'recibos', timestamps: false });

module.exports = Recibo;
