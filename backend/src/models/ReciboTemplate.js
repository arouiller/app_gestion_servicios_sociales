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
    get() {
      const value = this.getDataValue('bloque_encabezado');
      return typeof value === 'string' ? JSON.parse(value) : value;
    },
    set(value) {
      this.setDataValue('bloque_encabezado', value);
    },
    comment: 'Bloque 1: Logo, empresa, contacto'
  },
  bloque_afiliado: {
    type: DataTypes.JSON,
    get() {
      const value = this.getDataValue('bloque_afiliado');
      return typeof value === 'string' ? JSON.parse(value) : value;
    },
    set(value) {
      this.setDataValue('bloque_afiliado', value);
    },
    comment: 'Bloque 2: Datos del afiliado (filas editables)'
  },
  bloque_detalles: {
    type: DataTypes.JSON,
    get() {
      const value = this.getDataValue('bloque_detalles');
      return typeof value === 'string' ? JSON.parse(value) : value;
    },
    set(value) {
      this.setDataValue('bloque_detalles', value);
    },
    comment: 'Bloque 3: Tabla de detalles (cuota, arancel, total)'
  },
  bloque_pie: {
    type: DataTypes.JSON,
    get() {
      const value = this.getDataValue('bloque_pie');
      return typeof value === 'string' ? JSON.parse(value) : value;
    },
    set(value) {
      this.setDataValue('bloque_pie', value);
    },
    comment: 'Bloque 4: Pie de página, firma, aclaraciones'
  },
  bloque_pageconfig: {
    type: DataTypes.JSON,
    allowNull: false,
    get() {
      const value = this.getDataValue('bloque_pageconfig');
      return typeof value === 'string' ? JSON.parse(value) : value;
    },
    set(value) {
      this.setDataValue('bloque_pageconfig', value);
    },
    validate: {
      notEmpty: { msg: 'Bloque 5 (Configuración de Página) es obligatorio' }
    },
    comment: 'Bloque 5 (OBLIGATORIO): Tamaño, orientación, márgenes, layout'
  },
  bloque_positions: {
    type: DataTypes.JSON,
    defaultValue: {
      encabezado: { x: 10, y: 10, width: 190, height: 50 },
      afiliado: { x: 10, y: 65, width: 190, height: 40 },
      detalles: { x: 10, y: 110, width: 190, height: 60 },
      pie: { x: 10, y: 175, width: 190, height: 30 }
    },
    get() {
      const value = this.getDataValue('bloque_positions');
      return typeof value === 'string' ? JSON.parse(value) : value;
    },
    set(value) {
      this.setDataValue('bloque_positions', value);
    },
    comment: 'Posición (x, y) y tamaño (width, height) en mm de cada bloque'
  },
  bloques: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const value = this.getDataValue('bloques');
      return typeof value === 'string' ? JSON.parse(value) : value;
    },
    set(value) {
      this.setDataValue('bloques', value);
    },
    comment: 'Lista de bloques genéricos configurables por el usuario'
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
