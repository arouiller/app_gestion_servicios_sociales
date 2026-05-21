const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReciboTemplate = sequelize.define(
  'ReciboTemplate',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    html: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    pageSize: {
      type: DataTypes.ENUM('A4', 'A5', 'Carta', 'Personalizado'),
      defaultValue: 'A4',
      field: 'page_size',
    },
    orientation: {
      type: DataTypes.ENUM('portrait', 'landscape'),
      defaultValue: 'portrait',
    },
    margins: {
      type: DataTypes.INTEGER,
      defaultValue: 8,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    templateGroupId: {
      type: DataTypes.INTEGER,
      field: 'template_group_id',
      allowNull: true,
      references: {
        model: 'recibo_templates',
        key: 'id',
      },
    },
    versionNumber: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'version_number',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      field: 'created_by',
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      field: 'updated_by',
      allowNull: true,
    },
  },
  {
    tableName: 'recibo_templates',
    timestamps: true,
    underscored: true,
  }
);

ReciboTemplate.associate = (models) => {
  // Self-reference para versionado
  ReciboTemplate.hasMany(ReciboTemplate, {
    as: 'versions',
    foreignKey: 'templateGroupId',
  });
  ReciboTemplate.belongsTo(ReciboTemplate, {
    as: 'templateGroup',
    foreignKey: 'templateGroupId',
  });

  // Auditoría: usuario que creó/actualizó
  if (models.Usuario) {
    ReciboTemplate.belongsTo(models.Usuario, {
      as: 'creator',
      foreignKey: 'createdBy',
    });
    ReciboTemplate.belongsTo(models.Usuario, {
      as: 'updater',
      foreignKey: 'updatedBy',
    });
  }
};

module.exports = ReciboTemplate;
