const sequelize = require('../config/database');
const Persona = require('./Persona');
const Plan = require('./Plan');
const PlanIntegrante = require('./PlanIntegrante');
const IntegranteServicio = require('./IntegranteServicio');
const Cobrador = require('./Cobrador');
const TipoDePlan = require('./TipoDePlan');
const ObraSocial = require('./ObraSocial');
const ServicioAdicional = require('./ServicioAdicional');
const TipoDeGrupo = require('./TipoDeGrupo');
const Usuario = require('./Usuario');

// Initialize all models
const db = {
  sequelize,
  Persona: Persona(sequelize),
  Plan: Plan(sequelize),
  PlanIntegrante: PlanIntegrante(sequelize),
  IntegranteServicio: IntegranteServicio(sequelize),
  Cobrador: Cobrador(sequelize),
  TipoDePlan: TipoDePlan(sequelize),
  ObraSocial: ObraSocial(sequelize),
  ServicioAdicional: ServicioAdicional(sequelize),
  TipoDeGrupo: TipoDeGrupo(sequelize),
  Usuario: Usuario(sequelize),
};

// Define associations
if (db.Plan && db.TipoDePlan) {
  db.Plan.belongsTo(db.TipoDePlan, { foreignKey: 'tipo_plan_numero' });
}
if (db.Plan && db.Cobrador) {
  db.Plan.belongsTo(db.Cobrador, { foreignKey: 'cobrador_numero' });
}
if (db.Plan && db.TipoDeGrupo) {
  db.Plan.belongsTo(db.TipoDeGrupo, { foreignKey: 'tipo_de_grupo_numero' });
}
if (db.Plan && db.ObraSocial) {
  db.Plan.belongsTo(db.ObraSocial, { foreignKey: 'os_numero' });
}
if (db.PlanIntegrante && db.Plan) {
  db.PlanIntegrante.belongsTo(db.Plan, { foreignKey: 'plan_numero', onDelete: 'CASCADE' });
  db.Plan.hasMany(db.PlanIntegrante, { foreignKey: 'plan_numero' });
}
if (db.PlanIntegrante && db.Persona) {
  db.PlanIntegrante.belongsTo(db.Persona, { foreignKey: 'persona_id' });
}
if (db.IntegranteServicio && db.PlanIntegrante) {
  db.IntegranteServicio.belongsTo(db.PlanIntegrante, { foreignKey: 'plan_integrante_id', onDelete: 'CASCADE' });
  db.PlanIntegrante.hasMany(db.IntegranteServicio, { foreignKey: 'plan_integrante_id' });
}
if (db.IntegranteServicio && db.ServicioAdicional) {
  db.IntegranteServicio.belongsTo(db.ServicioAdicional, { foreignKey: 'servicio_adicional_numero' });
}

module.exports = db;
