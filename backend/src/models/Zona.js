module.exports = (sequelize, DataTypes) => {
  const Zona = sequelize.define('Zona', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    provincia_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'provincias',
        key: 'id'
      }
    },
    codigo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El código de zona es requerido' }
      }
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre de la zona es requerido' }
      }
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'zonas',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['provincia_id', 'codigo']
      }
    ]
  });

  Zona.associate = (models) => {
    Zona.belongsTo(models.Provincia, {
      foreignKey: 'provincia_id',
      as: 'provincia',
      onDelete: 'RESTRICT'
    });
    Zona.hasMany(models.PlanIntegrante, {
      foreignKey: 'zona_id',
      as: 'planes'
    });
  };

  return Zona;
};
