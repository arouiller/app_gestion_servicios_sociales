const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReciboTemplate = sequelize.define('ReciboTemplate', {
  id: {
    type: DataTypes.STRING(36),
    primaryKey: true,
    defaultValue: () => require('uuid').v4(),
    comment: 'UUID del template'
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'El nombre del template no puede estar vacío' },
      len: { args: [1, 100], msg: 'El nombre debe tener entre 1 y 100 caracteres' }
    },
    comment: 'Nombre identificador del template'
  },
  descripcion: {
    type: DataTypes.TEXT,
    comment: 'Descripción opcional del template'
  },
  bloque_encabezado: {
    type: DataTypes.JSON,
    comment: 'Bloque 1: Logo, empresa, contacto'
  },
  bloque_afiliado: {
    type: DataTypes.JSON,
    comment: 'Bloque 2: Datos del afiliado (filas editables)'
  },
  bloque_detalles: {
    type: DataTypes.JSON,
    comment: 'Bloque 3: Tabla de detalles (cuota, arancel, total)'
  },
  bloque_pie: {
    type: DataTypes.JSON,
    comment: 'Bloque 4: Pie de página, firma, aclaraciones'
  },
  bloque_pageconfig: {
    type: DataTypes.JSON,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Bloque 5 (Configuración de Página) es obligatorio' }
    },
    comment: 'Bloque 5 (OBLIGATORIO): Tamaño, orientación, márgenes, layout'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Solo un template activo a la vez globalmente'
  },
  usuario_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'FK: Usuario que creó el template (creador inmutable)'
  }
}, {
  tableName: 'recibo_templates',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ReciboTemplate;
