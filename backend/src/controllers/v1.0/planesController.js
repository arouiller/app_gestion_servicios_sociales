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
        {
          model: db.PlanIntegrante,
          where: { orden: 1 },
          required: false,
          include: [{ model: db.Persona, attributes: ['apellido', 'nombre'] }],
        },
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
          include: [
            { model: db.Persona, attributes: ['id', 'apellido', 'nombre', 'numero_documento', 'tipo_documento', 'fecha_nacimiento', 'fecha_cobertura'] },
            {
              model: db.IntegranteServicio,
              include: [{ model: db.ServicioAdicional, attributes: ['servicio_adicional_numero', 'servicio_adicional_nombre'] }],
            },
          ],
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

const deletePermanently = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const { planNumero } = req.params;

    // Find plan first to ensure it exists
    const plan = await db.PlanV1.findByPk(planNumero, { transaction: t });
    if (!plan) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Plan not found',
        code: 'PLAN_NOT_FOUND'
      });
    }

    // Delete in cascading order (respecting FK constraints)
    // 1. Delete IntegranteServicio (services for plan integrantes)
    const integrantes = await db.PlanIntegrante.findAll(
      { where: { plan_numero: planNumero }, transaction: t }
    );
    const integranteIds = integrantes.map(i => i.id);
    if (integranteIds.length > 0) {
      await db.IntegranteServicio.destroy(
        { where: { plan_integrante_id: integranteIds }, transaction: t }
      );
    }

    // 2. Delete PlanIntegrante (integrantes/afiliados of the plan)
    await db.PlanIntegrante.destroy(
      { where: { plan_numero: planNumero }, transaction: t }
    );

    // 3. Delete ReciboIntegrante (receipt lines)
    const recibos = await db.Recibo.findAll(
      { where: { plan_numero: planNumero }, transaction: t }
    );
    const reciboIds = recibos.map(r => r.id);
    if (reciboIds.length > 0) {
      await db.ReciboIntegrante.destroy(
        { where: { recibo_id: reciboIds }, transaction: t }
      );
    }

    // 4. Delete Recibo (receipts)
    await db.Recibo.destroy(
      { where: { plan_numero: planNumero }, transaction: t }
    );

    // 5. Delete HistorialCuota (quota history)
    await db.HistorialCuota.destroy(
      { where: { plan_numero: planNumero }, transaction: t }
    );

    // 6. Delete Plan
    await db.PlanV1.destroy(
      { where: { plan_numero: planNumero }, transaction: t }
    );

    // Commit transaction
    await t.commit();

    return res.json({
      success: true,
      message: 'Plan eliminado correctamente',
      data: { plan_numero: planNumero }
    });
  } catch (error) {
    await t.rollback();
    console.error('Transaction failed, rolled back:', error);
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

// ── POST /api/v1.0/planes/crear-completo (sin admin requerido) ──────────────────
// Crear plan + personas deferred + integrantes en una única transacción atómica

const crearCompleto = async (req, res, next) => {
  const t = await db.sequelize.transaction();
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
      integrantes = [],
    } = req.body;

    // 1. Validar y normalizar numero_afiliado
    const numeroAfiliadoPadded = String(numero_afiliado).trim().padStart(5, '0');
    if (!/^\d{5}$/.test(numeroAfiliadoPadded)) {
      await t.rollback();
      return res.status(422).json({
        success: false,
        message: 'El número de afiliado debe ser numérico de hasta 5 dígitos',
        errors: { numero_afiliado: 'Solo se permiten números (máximo 5 dígitos)' },
      });
    }

    const existente = await db.PlanV1.findOne(
      { where: { numero_afiliado: numeroAfiliadoPadded } },
      { transaction: t }
    );
    if (existente) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: 'Ya existe un plan con ese número de afiliado',
        errors: { numero_afiliado: 'Ya existe un plan con ese número de afiliado' },
      });
    }

    // 2. Crear el plan
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
    }, { transaction: t });

    // 3. Crear personas deferred y plan_integrantes
    if (integrantes.length > 0) {
      const integrantesConPersonaId = await Promise.all(
        integrantes.map(async (integ, index) => {
          let persona_id = integ.persona_id;
          // Si no tiene persona_id y tiene datos de persona, crear la persona
          if (!persona_id && integ.persona) {
            const persona = await db.Persona.create(integ.persona, { transaction: t });
            persona_id = persona.id;
          }
          return {
            plan_numero: plan.plan_numero,
            persona_id,
            rol: index === 0 ? 'titular' : 'integrante',
            orden: index + 1,
            credencial: 'T',
          };
        })
      );

      await db.PlanIntegrante.bulkCreate(integrantesConPersonaId, { transaction: t });
    }

    await t.commit();

    // 4. Retornar plan con integrantes y personas anidadas (para sincronizar el form frontend)
    const result = await db.PlanV1.findOne({
      where: { plan_numero: plan.plan_numero },
      include: [{
        model: db.PlanIntegrante,
        include: [{ model: db.Persona }],
        order: [['orden', 'ASC']],
      }],
    });

    return res.status(201).json({
      success: true,
      message: 'Plan creado exitosamente con integrantes',
      data: result,
      ...result.dataValues,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// ── POST /api/v1.0/planes/actualizar-completo/:planNumero ────────────────────────
// Actualizar plan + sincronizar integrantes + reordenar en una única transacción

const actualizarCompleto = async (req, res, next) => {
  const t = await db.sequelize.transaction();
  try {
    const { planNumero } = req.params;
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
      integrantes = [],
    } = req.body;

    // 1. Validar que el plan existe
    const plan = await db.PlanV1.findByPk(planNumero, { transaction: t });
    if (!plan) {
      await t.rollback();
      return res.status(404).json({ success: false, message: 'Plan no encontrado' });
    }

    // 2. Validar y normalizar numero_afiliado si cambió
    if (numero_afiliado) {
      const padded = String(numero_afiliado).trim().padStart(5, '0');
      if (!/^\d{5}$/.test(padded)) {
        await t.rollback();
        return res.status(422).json({
          success: false,
          message: 'El número de afiliado debe ser numérico de hasta 5 dígitos',
          errors: { numero_afiliado: 'Solo se permiten números (máximo 5 dígitos)' },
        });
      }
      if (padded !== plan.numero_afiliado) {
        const existente = await db.PlanV1.findOne(
          { where: { numero_afiliado: padded } },
          { transaction: t }
        );
        if (existente) {
          await t.rollback();
          return res.status(409).json({
            success: false,
            message: 'Ya existe un plan con ese número de afiliado',
            errors: { numero_afiliado: 'Ya existe un plan con ese número de afiliado' },
          });
        }
      }
    }

    // 3. Actualizar el plan
    await plan.update({
      tipo_plan_numero: tipo_plan_numero || plan.tipo_plan_numero,
      cobrador_numero: cobrador_numero || plan.cobrador_numero,
      tipo_de_grupo_numero: tipo_de_grupo_numero || plan.tipo_de_grupo_numero,
      os_numero: os_numero || plan.os_numero,
      numero_afiliado: numero_afiliado ? String(numero_afiliado).trim().padStart(5, '0') : plan.numero_afiliado,
      telefono_1: telefono_1 !== undefined ? telefono_1 : plan.telefono_1,
      telefono_2: telefono_2 !== undefined ? telefono_2 : plan.telefono_2,
      domicilio: domicilio !== undefined ? domicilio : plan.domicilio,
      localidad: localidad !== undefined ? localidad : plan.localidad,
      valor_cuota: valor_cuota || plan.valor_cuota,
      estado: estado || plan.estado,
      zona: zona !== undefined ? zona : plan.zona,
      zona_id: zona_id !== undefined ? zona_id : plan.zona_id,
      localidad_id: localidad_id !== undefined ? localidad_id : plan.localidad_id,
    }, { transaction: t });

    // 4. Sincronizar integrantes
    const existingIntegrantes = await db.PlanIntegrante.findAll(
      { where: { plan_numero: planNumero } },
      { transaction: t }
    );

    const existingMap = new Map(existingIntegrantes.map((i) => [i.persona_id, i]));
    const incomingMap = new Map(integrantes.map((i) => [i.persona_id, i]));

    // Eliminar integrantes que no están en incoming
    for (const existing of existingIntegrantes) {
      if (!incomingMap.has(existing.persona_id)) {
        await existing.destroy({ transaction: t });
      }
    }

    // Crear integrantes nuevos
    for (const integ of integrantes) {
      if (!existingMap.has(integ.persona_id)) {
        await db.PlanIntegrante.create({
          plan_numero: planNumero,
          persona_id: integ.persona_id,
          rol: integ.rol || 'integrante',
          orden: 0,
          credencial: 'T',
        }, { transaction: t });
      }
    }

    // 5. Reordenar integrantes (asignar orden y rol por posición)
    const integrantesWithMeta = integrantes.map((integ, index) => ({
      persona_id: integ.persona_id,
      orden: index + 1,
      rol: index === 0 ? 'titular' : 'integrante',
    }));

    for (const meta of integrantesWithMeta) {
      await db.PlanIntegrante.update(
        { orden: meta.orden, rol: meta.rol },
        { where: { plan_numero: planNumero, persona_id: meta.persona_id }, transaction: t }
      );
    }

    await t.commit();

    // 6. Retornar plan actualizado con integrantes
    const result = await db.PlanV1.findOne({
      where: { plan_numero: planNumero },
      include: [{
        model: db.PlanIntegrante,
        include: [{ model: db.Persona }],
        order: [['orden', 'ASC']],
      }],
    });

    return res.json({
      success: true,
      message: 'Plan actualizado exitosamente',
      data: result,
      ...result.dataValues,
    });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

module.exports = {
  listar,
  getByPersona,
  obtener,
  crear,
  crearCompleto,
  actualizar,
  actualizarCompleto,
  deletePermanently,
  getMaxAfiliadoNumber,
  getHistorialCuota,
};
