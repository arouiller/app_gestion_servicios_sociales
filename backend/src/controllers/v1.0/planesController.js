const { Op } = require('sequelize');
const sequelize = require('../../config/database');
const db = require('../../models');

// ── GET /api/v1.0/planes ───────────────────────────────────────────────────────
// Listar planes con filtros opcionales (estado, cobrador, obraSocial, tipoGrupo)

const listar = async (req, res, next) => {
  try {
    const { estado, cobrador_numero, os_numero, tipo_de_grupo_numero } = req.query;
    const where = {};

    if (estado) where.estado = estado;
    if (cobrador_numero) where.cobrador_numero = cobrador_numero;
    if (os_numero) where.os_numero = os_numero;
    if (tipo_de_grupo_numero) where.tipo_de_grupo_numero = tipo_de_grupo_numero;

    const planes = await db.PlanV1.findAll({
      where,
      include: [
        { model: db.TipoDePlan, attributes: ['tipo_plan_numero', 'tipo_plan_nombre'] },
        { model: db.Cobrador, attributes: ['cobrador_numero', 'cobrador_apellido', 'cobrador_nombre'] },
        { model: db.TipoDeGrupo, attributes: ['tipo_de_grupo_numero', 'tipo_de_grupo_nombre'] },
        { model: db.ObraSocial, attributes: ['os_numero', 'os_nombre'] },
        { model: db.Zona, attributes: ['id', 'codigo', 'nombre'] },
        { model: db.Localidad, attributes: ['id', 'codigo', 'nombre'] },
      ],
      order: [['plan_numero', 'DESC']],
    });

    return res.json({ success: true, data: planes });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/v1.0/planes/por-persona/:personaId ────────────────────────────────
// Obtener todos los planes en los que una persona es integrante

const getByPersona = async (req, res, next) => {
  try {
    const { personaId } = req.params;

    const planes = await db.PlanV1.findAll({
      include: [
        {
          model: db.PlanIntegrante,
          where: { persona_id: personaId },
          include: [
            { model: db.Persona, attributes: ['id', 'apellido', 'nombre', 'numero_documento'] },
          ],
        },
        { model: db.TipoDePlan, attributes: ['tipo_plan_numero', 'tipo_plan_nombre'] },
        { model: db.Cobrador, attributes: ['cobrador_numero', 'cobrador_apellido', 'cobrador_nombre'] },
        { model: db.ObraSocial, attributes: ['os_numero', 'os_nombre'] },
        { model: db.Zona, attributes: ['id', 'codigo', 'nombre'] },
        { model: db.Localidad, attributes: ['id', 'codigo', 'nombre'] },
      ],
    });

    return res.json({ success: true, data: planes });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/v1.0/planes/:planNumero ────────────────────────────────────────────

const obtener = async (req, res, next) => {
  try {
    const { planNumero } = req.params;

    const plan = await db.PlanV1.findByPk(planNumero, {
      include: [
        {
          model: db.PlanIntegrante,
          include: [{ model: db.Persona, attributes: ['id', 'apellido', 'nombre', 'numero_documento', 'tipo_documento', 'fecha_nacimiento', 'fecha_cobertura'] }],
          order: [['orden', 'ASC']],
        },
        { model: db.TipoDePlan, attributes: ['tipo_plan_numero', 'tipo_plan_nombre'] },
        { model: db.Cobrador, attributes: ['cobrador_numero', 'cobrador_apellido', 'cobrador_nombre'] },
        { model: db.TipoDeGrupo, attributes: ['tipo_de_grupo_numero', 'tipo_de_grupo_nombre'] },
        { model: db.ObraSocial, attributes: ['os_numero', 'os_nombre'] },
        { model: db.Zona, attributes: ['id', 'codigo', 'nombre'] },
        { model: db.Localidad, attributes: ['id', 'codigo', 'nombre'] },
      ],
    });

    // Cargar Recibos por separado para evitar problemas de schema
    if (plan) {
      try {
        const recibos = await db.Recibo.findAll({
          where: { plan_numero: planNumero },
          attributes: ['id', 'periodo', 'valor_cuota', 'fecha_emision'],
          order: [['fecha_emision', 'DESC']],
        });
        plan.Recibos = recibos;
      } catch (err) {
        console.warn('Error loading Recibos:', err.message);
        plan.Recibos = [];
      }
    }

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan no encontrado' });
    }

    return res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/v1.0/planes (admin) ────────────────────────────────────────────────
// Crear un nuevo plan

const crear = async (req, res, next) => {
  try {
    const {
      tipo_plan_numero,
      cobrador_numero,
      tipo_de_grupo_numero,
      os_numero,
      numero_afiliado,
      telefono_1,
      telefono_2,
      domicilio,
      localidad,
      valor_cuota,
      estado,
      zona,
      zona_id,
      localidad_id,
    } = req.body;

    // Aplicar padding a 5 dígitos
    const numeroAfiliadoPadded = String(numero_afiliado).trim().padStart(5, '0');

    // Validar que el resultado sea exactamente 5 dígitos numéricos
    if (!/^\d{5}$/.test(numeroAfiliadoPadded)) {
      return res.status(422).json({
        success: false,
        message: 'El número de afiliado debe ser numérico de hasta 5 dígitos',
        errors: { numero_afiliado: 'Solo se permiten números (máximo 5 dígitos)' },
      });
    }

    // Verificar que el número de afiliado sea único con el valor padded
    const existente = await db.PlanV1.findOne({ where: { numero_afiliado: numeroAfiliadoPadded } });
    if (existente) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un plan con ese número de afiliado',
        errors: { numero_afiliado: 'Ya existe un plan con ese número de afiliado' },
      });
    }

    const plan = await db.PlanV1.create({
      tipo_plan_numero,
      cobrador_numero,
      tipo_de_grupo_numero,
      os_numero,
      numero_afiliado: numeroAfiliadoPadded,
      telefono_1,
      telefono_2,
      domicilio,
      localidad,
      valor_cuota,
      estado: estado || 'ACTIVO',
      zona: zona ?? 0,
      zona_id: zona_id || null,
      localidad_id: localidad_id || null,
    });

    return res.status(201).json({
      success: true,
      message: 'Plan creado exitosamente',
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/v1.0/planes/:planNumero (admin) ────────────────────────────────────

const actualizar = async (req, res, next) => {
  try {
    const { planNumero } = req.params;

    const plan = await db.PlanV1.findByPk(planNumero);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan no encontrado' });
    }

    // Si se proporciona número de afiliado, aplicar padding y validar
    if (req.body.numero_afiliado) {
      const padded = String(req.body.numero_afiliado).trim().padStart(5, '0');
      if (!/^\d{5}$/.test(padded)) {
        return res.status(422).json({
          success: false,
          message: 'El número de afiliado debe ser numérico de hasta 5 dígitos',
          errors: { numero_afiliado: 'Solo se permiten números (máximo 5 dígitos)' },
        });
      }
      // Si se intenta cambiar el número de afiliado, verificar unicidad con el valor padded
      if (padded !== plan.numero_afiliado) {
        const existente = await db.PlanV1.findOne({ where: { numero_afiliado: padded } });
        if (existente) {
          return res.status(409).json({
            success: false,
            message: 'Ya existe un plan con ese número de afiliado',
            errors: { numero_afiliado: 'Ya existe un plan con ese número de afiliado' },
          });
        }
      }
      req.body.numero_afiliado = padded;
    }

    const camposPermitidos = [
      'tipo_plan_numero',
      'cobrador_numero',
      'tipo_de_grupo_numero',
      'os_numero',
      'numero_afiliado',
      'telefono_1',
      'telefono_2',
      'domicilio',
      'localidad',
      'valor_cuota',
      'estado',
      'zona',
      'zona_id',
      'localidad_id',
    ];

    const actualizaciones = {};
    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) actualizaciones[campo] = req.body[campo];
    });

    // Procesar integrantes reordenados si se proporciona
    if (req.body.integrantes && Array.isArray(req.body.integrantes)) {
      try {
        // Validar que hay al menos 1 integrante
        if (req.body.integrantes.length === 0) {
          return res.status(422).json({
            success: false,
            message: 'Un plan debe tener al menos 1 integrante',
            errors: { integrantes: 'Mínimo 1 integrante requerido' },
          });
        }

        // Actualizar integrantes en BD
        const { PlanIntegrante } = db;

        // Eliminar integrantes viejos para este plan
        await PlanIntegrante.destroy({ where: { plan_numero: plan.plan_numero } });

        // Insertar integrantes nuevos en orden correcto
        const integrantesNuevos = req.body.integrantes.map((integrante, index) => ({
          plan_numero: plan.plan_numero,
          persona_id: integrante.persona_id,
          orden: index + 1, // 1-based
          rol: index === 0 ? 'titular' : 'integrante', // Primero = titular, resto = integrante
          credencial: integrante.credencial || 'N', // Default si no viene
          fecha_creacion: new Date(),
        }));

        await PlanIntegrante.bulkCreate(integrantesNuevos);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: 'Error al procesar integrantes',
          errors: { integrantes: error.message },
        });
      }
    }

    await plan.update(actualizaciones);

    return res.json({
      success: true,
      message: 'Plan actualizado correctamente',
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/v1.0/planes/:planNumero (admin) ────────────────────────────────

const eliminar = async (req, res, next) => {
  try {
    const { planNumero } = req.params;

    const plan = await db.PlanV1.findByPk(planNumero);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan no encontrado' });
    }

    await plan.destroy();

    return res.json({ success: true, message: 'Plan eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/v1.0/planes/numero-afiliado/max ────────────────────────────────────
// Get the max affiliate number to suggest the next one

const getMaxAfiliadoNumber = async (req, res, next) => {
  try {
    const result = await db.PlanV1.findOne({
      attributes: [[sequelize.fn('MAX', sequelize.col('numero_afiliado')), 'maxNumber']],
      raw: true,
    });

    const maxStr = result?.maxNumber || '0';
    const maxNumber = parseInt(maxStr, 10) || 0;
    const suggestedNumber = maxNumber + 1;

    return res.json({ success: true, data: { maxNumber, suggestedNumber: String(suggestedNumber).padStart(5, '0') } });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/v1.0/planes/:planNumero/historial-cuota ────────────────────────────
// Obtener historial de cambios de cuota para un plan

const getHistorialCuota = async (req, res, next) => {
  try {
    const { planNumero } = req.params;

    // Verificar que el plan existe
    const plan = await db.PlanV1.findByPk(planNumero);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan no encontrado' });
    }

    // Obtener historial de cuota ordenado por fecha descendente
    const historial = await db.HistorialCuota.findAll({
      where: { plan_numero: planNumero },
      order: [['fecha_cambio', 'DESC']],
      raw: true,
    });

    return res.json({ success: true, data: historial || [] });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
  getByPersona,
  obtener,
  crear,
  actualizar,
  eliminar,
  getMaxAfiliadoNumber,
  getHistorialCuota,
};
