const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Zona = sequelize.define('Zona', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codigo: {
    type: DataTypes.STRING(2),
    allowNull: false,
    unique: true,
    validate: {
      len: {
        args: [2, 2],
        msg: 'El código debe tener exactamente 2 caracteres'
      }
    }
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre de la zona es requerido' }
    }
  }
}, {
  tableName: 'zonas',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['codigo']
    }
  ]
});

module.exports = Zona;
