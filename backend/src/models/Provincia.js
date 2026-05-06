module.exports = (sequelize, DataTypes) => {
  const Provincia = sequelize.define('Provincia', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'El nombre de la provincia es requerido' }
      }
    },
    codigo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'El código es requerido' }
      }
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'provincias',
    timestamps: true,
    underscored: true
  });

  Provincia.associate = (models) => {
    Provincia.hasMany(models.Zona, {
      foreignKey: 'provincia_id',
      as: 'zonas',
      onDelete: 'RESTRICT'
    });
  };

  return Provincia;
};
