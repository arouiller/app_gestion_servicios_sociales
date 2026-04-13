const sequelize = require('../config/database');
const Afiliado = require('./Afiliado');
const GrupoFamiliar = require('./GrupoFamiliar');
const HistorialGrupoFamiliar = require('./HistorialGrupoFamiliar');
const Plan = require('./Plan');
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
  Afiliado,
  GrupoFamiliar,
  HistorialGrupoFamiliar,
  Plan,
  IntegranteServicio,
  Cobrador,
  TipoDePlan,
  ObraSocial,
  ServicioAdicional,
  TipoDeGrupo,
  Usuario,
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
if (db.GrupoFamiliar && db.Plan) {
  db.GrupoFamiliar.hasMany(db.Plan, { foreignKey: 'grupo_id', onDelete: 'CASCADE' });
  db.Plan.belongsTo(db.GrupoFamiliar, { foreignKey: 'grupo_id' });
}
if (db.IntegranteServicio && db.ServicioAdicional) {
  db.IntegranteServicio.belongsTo(db.ServicioAdicional, { foreignKey: 'servicio_adicional_numero' });
}

module.exports = db;
