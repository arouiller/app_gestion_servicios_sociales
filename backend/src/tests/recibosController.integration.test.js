const db = require('../models');
const sequelize = require('../config/database');
const recibosController = require('../controllers/recibosController');

describe('recibosController.generar() - Full Integration (BACKLOG-079)', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    // Cleanup
    await db.Recibo.destroy({ where: {} });
    await db.PeriodosRecibos.destroy({ where: {} });
    await db.PlanIntegrante.destroy({ where: {} });
    await db.Persona.destroy({ where: {} });
    await db.PlanV1.destroy({ where: {} });
  });

  test('crea recibos con desglose completo y consistente', async () => {
    // Setup: ConfiguracionApp
    const config = await db.ConfiguracionApp.create({
      valor_cuota_social: 75.00
    });

    // Setup: Plan
    const plan = await db.PlanV1.create({
      plan_numero: 2001,
      numero_afiliado: 'INTEG001',
      valor_cuota: 200.00,
      estado: 'ACTIVO'
    });

    // Setup: Persona
    const persona = await db.Persona.create({
      apellido: 'Integración',
      nombre: 'Test',
      tipo_documento: 'DNI',
      numero_documento: '99999999'
    });

    // Setup: Integrante
    await db.PlanIntegrante.create({
      plan_numero: plan.plan_numero,
      persona_id: persona.id,
      rol: 'titular'
    });

    // Execute: Generate recibos
    const req = {
      user: { id: 1 },
      body: {
        periodo: '2026-05-01',
        planes: [plan.plan_numero]
      }
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    const next = jest.fn();

    await recibosController.generar(req, res, next);

    // Verify response structure
    expect(res.status).toHaveBeenCalledWith(201);
    const responseCall = res.json.mock.calls[0][0];
    expect(responseCall.success).toBe(true);
    expect(responseCall.recibos).toHaveLength(1);

    // Verify breakdown values
    const recibo = responseCall.recibos[0];
    expect(recibo.cuota_social).toBe(75);
    expect(recibo.arancel_por_servicio).toBe(125);
    expect(recibo.valor_cuota).toBe(200);

    // Verify invariant
    expect(recibo.cuota_social + recibo.arancel_por_servicio).toBe(recibo.valor_cuota);

    // Verify record persisted in database
    const dbRecibo = await db.Recibo.findByPk(recibo.id);
    expect(dbRecibo).toBeDefined();
    expect(dbRecibo.cuota_social).toBe(75);
    expect(dbRecibo.arancel_por_servicio).toBe(125);
    expect(dbRecibo.valor_cuota).toBe(200);

    // Verify PeriodosRecibos record
    const periodRecord = await db.PeriodosRecibos.findOne({
      where: { periodo: '2026-05' }
    });
    expect(periodRecord).toBeDefined();
    expect(periodRecord.cantidad_recibos).toBe(1);

    // Verify ReciboIntegrante created
    const reciboIntegrantes = await db.ReciboIntegrante.findAll({
      where: { recibo_id: recibo.id }
    });
    expect(reciboIntegrantes).toHaveLength(1);
    expect(reciboIntegrantes[0].rol).toBe('titular');
  });

  test('fuerza regeneración de período cuando force=true', async () => {
    // Setup: Initial config and plan
    await db.ConfiguracionApp.create({
      valor_cuota_social: 50.00
    });

    const plan = await db.PlanV1.create({
      plan_numero: 2002,
      numero_afiliado: 'FORCE001',
      valor_cuota: 150.00,
      estado: 'ACTIVO'
    });

    const persona = await db.Persona.create({
      apellido: 'Force',
      nombre: 'Test',
      tipo_documento: 'DNI',
      numero_documento: '88888888'
    });

    await db.PlanIntegrante.create({
      plan_numero: plan.plan_numero,
      persona_id: persona.id,
      rol: 'titular'
    });

    // First generation
    const req1 = {
      user: { id: 1 },
      body: {
        periodo: '2026-05-01',
        planes: [plan.plan_numero]
      }
    };

    const res1 = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await recibosController.generar(req1, res1, jest.fn());
    const firstRecibo = res1.json.mock.calls[0][0].recibos[0];

    // Update plan cuota
    await plan.update({ valor_cuota: 175.00 });

    // Force regeneration
    const req2 = {
      user: { id: 1 },
      body: {
        periodo: '2026-05-01',
        planes: [plan.plan_numero],
        force: true
      }
    };

    const res2 = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    await recibosController.generar(req2, res2, jest.fn());
    const secondRecibo = res2.json.mock.calls[0][0].recibos[0];

    // Verify new breakdown
    expect(secondRecibo.valor_cuota).toBe(175);
    expect(secondRecibo.arancel_por_servicio).toBe(125);
    expect(secondRecibo.id).not.toBe(firstRecibo.id);

    // Verify old recibo is deleted
    const oldRecibo = await db.Recibo.findByPk(firstRecibo.id);
    expect(oldRecibo).toBeNull();
  });
});
