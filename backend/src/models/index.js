const sequelize = require('../config/database');

// Lookup entities
const Cobrador = require('./Cobrador');
const TipoDePlan = require('./TipoDePlan');
const ObraSocial = require('./ObraSocial');
const ServicioAdicional = require('./ServicioAdicional');
const TipoDeGrupo = require('./TipoDeGrupo');
const Zona = require('./Zona');

// Users
const Usuario = require('./Usuario');

// App Configuration
const ConfiguracionApp = require('./ConfiguracionApp');

// Provincias y Localidades
const Provincia = require('./Provincia');
const Localidad = require('./Localidad');

// 1.0.x Models
const Persona = require('./Persona');
const PlanV1 = require('./PlanV1');
const PlanIntegrante = require('./PlanIntegrante');
const IntegranteServicio = require('./IntegranteServicio');
const HistorialCuota = require('./HistorialCuota');
const Recibo = require('./Recibo');
const ReciboIntegrante = require('./ReciboIntegrante');
const PeriodosRecibos = require('./PeriodosRecibos');
const Bug = require('./Bug');
const AuditLog = require('./AuditLog');

// Initialize all models
const db = {
  sequelize,
  // Lookup entities
  Cobrador,
  TipoDePlan,
  ObraSocial,
  ServicioAdicional,
  TipoDeGrupo,
  Zona,
  Usuario,
  // App Configuration
  ConfiguracionApp,
  // Provincias y Localidades
  Provincia,
  Localidad,
  // 1.0.x Models
  Persona,
  PlanV1,
  PlanIntegrante,
  IntegranteServicio,
  HistorialCuota,
  Recibo,
  ReciboIntegrante,
  PeriodosRecibos,
  Bug,
  AuditLog,
};

// Define associations for 1.0.x
// Plan 1.0.x associations (reuse lookup models)
if (db.PlanV1 && db.TipoDePlan) {
  db.PlanV1.belongsTo(db.TipoDePlan, { foreignKey: 'tipo_plan_numero' });
}
if (db.PlanV1 && db.Cobrador) {
  db.PlanV1.belongsTo(db.Cobrador, { foreignKey: 'cobrador_numero' });
}
if (db.PlanV1 && db.TipoDeGrupo) {
  db.PlanV1.belongsTo(db.TipoDeGrupo, { foreignKey: 'tipo_de_grupo_numero' });
}
if (db.PlanV1 && db.ObraSocial) {
  db.PlanV1.belongsTo(db.ObraSocial, { foreignKey: 'os_numero' });
}
if (db.PlanV1 && db.Zona) {
  db.PlanV1.belongsTo(db.Zona, { foreignKey: 'zona_id', as: 'zona' });
}
if (db.PlanV1 && db.Localidad) {
  db.PlanV1.belongsTo(db.Localidad, { foreignKey: 'localidad_id', as: 'localidad' });
}
if (db.PlanV1 && db.PlanIntegrante) {
  db.PlanV1.hasMany(db.PlanIntegrante, { foreignKey: 'plan_numero', sourceKey: 'plan_numero', onDelete: 'CASCADE' });
  db.PlanIntegrante.belongsTo(db.PlanV1, { foreignKey: 'plan_numero', targetKey: 'plan_numero' });
}
// PlanIntegrante associations
if (db.PlanIntegrante && db.Persona) {
  db.PlanIntegrante.belongsTo(db.Persona, { foreignKey: 'persona_id', onDelete: 'CASCADE' });
  db.Persona.hasMany(db.PlanIntegrante, { foreignKey: 'persona_id' });
}
// IntegranteServicio 1.0.x associations
if (db.IntegranteServicio && db.ServicioAdicional) {
  db.IntegranteServicio.belongsTo(db.ServicioAdicional, { foreignKey: 'servicio_adicional_numero' });
}
// HistorialCuota associations
if (db.HistorialCuota && db.Usuario) {
  db.HistorialCuota.belongsTo(db.Usuario, { foreignKey: 'usuario_id' });
}
// Recibo associations
if (db.PlanV1 && db.Recibo) {
  db.PlanV1.hasMany(db.Recibo, { foreignKey: 'plan_numero', sourceKey: 'plan_numero', onDelete: 'CASCADE' });
  db.Recibo.belongsTo(db.PlanV1, { foreignKey: 'plan_numero', targetKey: 'plan_numero' });
}
if (db.Recibo && db.Usuario) {
  db.Recibo.belongsTo(db.Usuario, { foreignKey: 'usuario_id' });
}
if (db.Recibo && db.ReciboIntegrante) {
  db.Recibo.hasMany(db.ReciboIntegrante, { foreignKey: 'recibo_id', onDelete: 'CASCADE' });
}
// Bug associations
if (db.Bug && db.Usuario) {
  db.Bug.belongsTo(db.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
}

// AuditLog associations
if (db.AuditLog && db.Usuario) {
  db.AuditLog.belongsTo(db.Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
}

// Provincia and Localidad associations
if (db.Provincia && db.Localidad) {
  db.Provincia.hasMany(db.Localidad, { foreignKey: 'provincia_id', as: 'localidades', onDelete: 'RESTRICT' });
  db.Localidad.belongsTo(db.Provincia, { foreignKey: 'provincia_id', as: 'provincia', onDelete: 'RESTRICT' });
}

module.exports = db;
