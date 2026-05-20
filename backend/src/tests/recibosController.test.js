const db = require('../models');
const sequelize = require('../config/database');
const recibosController = require('../controllers/recibosController');

describe('recibosController.generar() - Breakdown Calculation (BACKLOG-079)', () => {
  beforeAll(async () => {
    // Setup: Ensure database is initialized
    await sequelize.authenticate();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    // Cleanup: Delete test data
    await db.Recibo.destroy({ where: {} });
    await db.PeriodosRecibos.destroy({ where: {} });
  });

  test('calcula desglose correcto cuando parámetro existe', async () => {
    // Setup: Create ConfiguracionApp with valor_cuota_social = 50
    const config = await db.ConfiguracionApp.create({
      valor_cuota_social: 50.00
    });

    // Setup: Create plan with valor_cuota = 150
    const plan = await db.PlanV1.create({
      plan_numero: 1001,
      numero_afiliado: 'TEST001',
      valor_cuota: 150.00,
      estado: 'ACTIVO'
    });

    // Setup: Create persona (titular)
    const persona = await db.Persona.create({
      apellido: 'Test',
      nombre: 'Usuario',
      tipo_documento: 'DNI',
      numero_documento: '12345678'
    });

    // Setup: Create plan_integrante (titular)
    const integrante = await db.PlanIntegrante.create({
      plan_numero: plan.plan_numero,
      persona_id: persona.id,
      rol: 'titular'
    });

    // Execute: Call generar via controller with mocked request/response
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

    // Verify response
    expect(res.status).toHaveBeenCalledWith(201);
    const responseCall = res.json.mock.calls[0][0];
    expect(responseCall.success).toBe(true);
    expect(responseCall.recibos).toHaveLength(1);

    // Verify breakdown values
    const recibo = responseCall.recibos[0];
    expect(recibo.cuota_social).toBe(50);
    expect(recibo.arancel_por_servicio).toBe(100);
    expect(recibo.valor_cuota).toBe(150);

    // Verify invariant
    expect(recibo.cuota_social + recibo.arancel_por_servicio).toBe(recibo.valor_cuota);
  });

  test('usa 0 cuando parámetro valor_cuota_social no existe', async () => {
    // Setup: Ensure no ConfiguracionApp
    await db.ConfiguracionApp.destroy({ where: {} });

    // Setup: Create plan
    const plan = await db.PlanV1.create({
      plan_numero: 1002,
      numero_afiliado: 'TEST002',
      valor_cuota: 100.00,
      estado: 'ACTIVO'
    });

    // Setup: Create persona
    const persona = await db.Persona.create({
      apellido: 'Test',
      nombre: 'Usuario',
      tipo_documento: 'DNI',
      numero_documento: '87654321'
    });

    // Setup: Create integrante
    await db.PlanIntegrante.create({
      plan_numero: plan.plan_numero,
      persona_id: persona.id,
      rol: 'titular'
    });

    // Execute
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

    // Verify
    const responseCall = res.json.mock.calls[0][0];
    const recibo = responseCall.recibos[0];
    expect(recibo.cuota_social).toBe(0);
    expect(recibo.arancel_por_servicio).toBe(100);
    expect(recibo.valor_cuota).toBe(100);
  });

  test('registra warning cuando arancel es negativo', async () => {
    // Setup: Create ConfiguracionApp with valor_cuota_social = 200 (higher than plan cuota)
    await db.ConfiguracionApp.create({
      valor_cuota_social: 200.00
    });

    // Setup: Create plan with valor_cuota = 150
    const plan = await db.PlanV1.create({
      plan_numero: 1003,
      numero_afiliado: 'TEST003',
      valor_cuota: 150.00,
      estado: 'ACTIVO'
    });

    // Setup: Create persona
    const persona = await db.Persona.create({
      apellido: 'Test',
      nombre: 'Usuario',
      tipo_documento: 'DNI',
      numero_documento: '11111111'
    });

    // Setup: Create integrante
    await db.PlanIntegrante.create({
      plan_numero: plan.plan_numero,
      persona_id: persona.id,
      rol: 'titular'
    });

    // Spy on logger.warn
    const logger = require('../utils/logger');
    const warnSpy = jest.spyOn(logger, 'warn');

    // Execute
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

    // Verify warning was called
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('arancel_por_servicio negativo')
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('BACKLOG-079')
    );

    // Verify breakdown
    const responseCall = res.json.mock.calls[0][0];
    const recibo = responseCall.recibos[0];
    expect(recibo.arancel_por_servicio).toBe(-50);

    warnSpy.mockRestore();
  });

  test('valida invariante de desglose (suma = total)', async () => {
    // Setup
    await db.ConfiguracionApp.create({
      valor_cuota_social: 75.00
    });

    const plan = await db.PlanV1.create({
      plan_numero: 1004,
      numero_afiliado: 'TEST004',
      valor_cuota: 200.00,
      estado: 'ACTIVO'
    });

    const persona = await db.Persona.create({
      apellido: 'Test',
      nombre: 'Usuario',
      tipo_documento: 'DNI',
      numero_documento: '22222222'
    });

    await db.PlanIntegrante.create({
      plan_numero: plan.plan_numero,
      persona_id: persona.id,
      rol: 'titular'
    });

    // Execute
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

    // Verify invariant holds
    const responseCall = res.json.mock.calls[0][0];
    const recibo = responseCall.recibos[0];
    const invariante = Math.abs(
      (recibo.cuota_social + recibo.arancel_por_servicio) - recibo.valor_cuota
    );
    expect(invariante).toBeLessThanOrEqual(0.01);
  });
});
