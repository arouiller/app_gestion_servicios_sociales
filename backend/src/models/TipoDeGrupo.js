const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TipoDeGrupo = sequelize.define('TipoDeGrupo', {
  tipo_de_grupo_numero: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: false },
  tipo_de_grupo_nombre: { type: DataTypes.STRING(100), allowNull: false },
  abreviacion: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La abreviación no puede estar vacía',
      },
    },
  },
  fecha_creacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  fecha_actualizacion: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'tipos_de_grupo', timestamps: false });

module.exports = TipoDeGrupo;
