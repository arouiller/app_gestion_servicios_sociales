const db = require('../models');
const { Op, literal } = require('sequelize');
const { buildOrderByClause } = require('../utils/sortUtil');

/**
 * GET /api/planes?estado=ACTIVO&limit=10
 * Obtiene listado de planes (pre-cargado o sin búsqueda)
 * Query params: estado (ACTIVO|SUSPENDIDO), limit (default 10)
 * Retorna: { success, data: [planes] }
 */
exports.list = async (req, res, next) => {
  try {
    const { estado = 'ACTIVO', limit = 10 } = req.query;
    let where = { estado: estado.toUpperCase() };

    const planes = await db.PlanV1.findAll({
      where,
      include: [
        {
          model: db.PlanIntegrante,
          include: [
            {
              model: db.Persona,
              attributes: ['id', 'nombre', 'apellido', 'numero_documento', 'tipo_documento', 'fecha_nacimiento'],
              required: false
            }
          ],
          order: [['orden', 'ASC']],
          limit: 1
        },
        {
          model: db.ObraSocial,
          attributes: ['os_numero', 'os_nombre'],
          required: false
        },
        {
          model: db.TipoDePlan,
          attributes: ['tipo_plan_numero', 'tipo_plan_nombre'],
          required: false
        },
        {
          model: db.TipoDeGrupo,
          attributes: ['tipo_de_grupo_numero', 'tipo_de_grupo_nombre'],
          required: false
        },
        {
          model: db.Zona,
          attributes: ['id', 'codigo', 'nombre'],
          required: false
        }
      ],
      limit: Math.min(parseInt(limit) || 10, 100),
      order: [['plan_numero', 'ASC']],
      raw: false
    });

    // Filtrado ya hecho en la query WHERE
    const filtered = planes;

    // Formatear respuesta para que sea más clara
    const formattedPlanes = filtered.map(plan => ({
      id: plan.plan_numero,
      numero_afiliado: plan.numero_afiliado,
      valor_cuota: plan.valor_cuota,
      cuota_social: plan.cuota_social || 0,
      arancel_por_servicio: plan.arancel_por_servicio || 0,
      estado: plan.estado,
      domicilio: plan.domicilio,
      zona_codigo: plan.Zona?.codigo,
      fecha_cobertura: plan.fecha_actualizacion,
      persona: plan.plan_integrantes?.[0]?.Persona ? {
        id: plan.plan_integrantes[0].Persona.id,
        nombre: plan.plan_integrantes[0].Persona.nombre,
        apellido: plan.plan_integrantes[0].Persona.apellido,
        numero_documento: plan.plan_integrantes[0].Persona.numero_documento,
        tipo_documento: plan.plan_integrantes[0].Persona.tipo_documento,
        fecha_nacimiento: plan.plan_integrantes[0].Persona.fecha_nacimiento
      } : null,
      obra_social_nombre: plan.ObraSocial?.os_nombre,
      tipo_plan_nombre: plan.TipoDePlan?.tipo_plan_nombre,
      tipo_de_grupo_nombre: plan.TipoDeGrupo?.tipo_de_grupo_nombre
    }));

    res.json({
      success: true,
      data: formattedPlanes.slice(0, Math.min(parseInt(limit) || 10, 100))
    });
  } catch (error) {
    console.error('Error searching planes:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/planes/:id
 * Obtiene detalle completo de un plan por ID (plan_numero)
 * Retorna: { success, data: plan }
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const planId = parseInt(id);

    const plan = await db.PlanV1.findByPk(planId, {
      include: [
        {
          model: db.PlanIntegrante,
          include: [
            {
              model: db.Persona,
              attributes: ['id', 'nombre', 'apellido', 'numero_documento', 'tipo_documento', 'fecha_nacimiento'],
              required: false
            }
          ],
          order: [['orden', 'ASC']],
          limit: 1
        },
        {
          model: db.ObraSocial,
          attributes: ['os_numero', 'os_nombre'],
          required: false
        },
        {
          model: db.TipoDePlan,
          attributes: ['tipo_plan_numero', 'tipo_plan_nombre'],
          required: false
        },
        {
          model: db.TipoDeGrupo,
          attributes: ['tipo_de_grupo_numero', 'tipo_de_grupo_nombre'],
          required: false
        },
        {
          model: db.Zona,
          attributes: ['id', 'codigo', 'nombre'],
          required: false
        }
      ]
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }

    // Formatear respuesta
    const formattedPlan = {
      id: plan.plan_numero,
      numero_afiliado: plan.numero_afiliado,
      valor_cuota: plan.valor_cuota,
      cuota_social: plan.cuota_social || 0,
      arancel_por_servicio: plan.arancel_por_servicio || 0,
      estado: plan.estado,
      domicilio: plan.domicilio,
      zona_codigo: plan.Zona?.codigo,
      fecha_cobertura: plan.fecha_actualizacion,
      persona: plan.plan_integrantes?.[0]?.Persona ? {
        id: plan.plan_integrantes[0].Persona.id,
        nombre: plan.plan_integrantes[0].Persona.nombre,
        apellido: plan.plan_integrantes[0].Persona.apellido,
        numero_documento: plan.plan_integrantes[0].Persona.numero_documento,
        tipo_documento: plan.plan_integrantes[0].Persona.tipo_documento,
        fecha_nacimiento: plan.plan_integrantes[0].Persona.fecha_nacimiento
      } : null,
      obra_social_nombre: plan.ObraSocial?.os_nombre,
      tipo_plan_nombre: plan.TipoDePlan?.tipo_plan_nombre,
      tipo_de_grupo_nombre: plan.TipoDeGrupo?.tipo_de_grupo_nombre
    };

    res.json({
      success: true,
      data: formattedPlan
    });
  } catch (error) {
    console.error('Error fetching plan detail:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * GET /api/planes/filter/:filtro
 * Obtiene planes filtrados por: todos, tipo_plan, cobrador, os, estado
 * Query params: sortBy, order (ASC|DESC), page, limit
 * Retorna: { success, data: [planes], count, page, limit, totalPages, offset }
 */
exports.filter = async (req, res, next) => {
  try {
    const { filtro } = req.params;
    const { tipo_plan_numero, cobrador_numero, os_numero, estado, sortBy, order, page = 1, limit = 15 } = req.query;

    let where = {};

    if (filtro === 'tipo_plan' && tipo_plan_numero) {
      where.tipo_plan_numero = parseInt(tipo_plan_numero);
    } else if (filtro === 'cobrador' && cobrador_numero) {
      where.cobrador_numero = parseInt(cobrador_numero);
    } else if (filtro === 'os' && os_numero) {
      where.os_numero = parseInt(os_numero);
    } else if (filtro === 'estado' && estado) {
      where.estado = estado.toUpperCase();
    }

    // Build ORDER BY clause
    const columnMap = {
      'plan_numero': 'plan_numero',
      'numero_afiliado': 'numero_afiliado',
      'estado': 'estado',
      'zona_codigo': 'zona_codigo',
      'valor_cuota': 'valor_cuota',
      'fecha_creacion': 'fecha_creacion',
      'cobrador_numero': 'cobrador_numero',
      'tipo_plan_numero': 'tipo_plan_numero',
      'os_numero': 'os_numero',
      'Cobrador.cobrador_apellido': { model: db.Cobrador, field: 'cobrador_apellido' },
      'TipoDePlan.tipo_plan_nombre': { model: db.TipoDePlan, field: 'tipo_plan_nombre' },
      'ObraSocial.os_nombre': { model: db.ObraSocial, field: 'os_nombre' },
      'PlanIntegrante.Persona.apellido': { models: [db.PlanIntegrante, db.Persona], field: 'apellido' }
    };
    let orderBy = [['plan_numero', 'ASC']]; // default
    if (sortBy) {
      orderBy = buildOrderByClause(sortBy, order, columnMap);
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const parsedLimit = parseInt(limit);
    const sinPaginado = parsedLimit === 0;
    const limitNum = sinPaginado ? null : Math.max(1, parsedLimit || 15);
    const offset = sinPaginado ? 0 : (pageNum - 1) * limitNum;

    const findOptions = {
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
      order: orderBy,
    };

    // Agregar limit y offset solo si se está paginando
    if (!sinPaginado) {
      findOptions.limit = limitNum;
      findOptions.offset = offset;
    }

    const { count, rows } = await db.PlanV1.findAndCountAll(findOptions);

    const totalPages = sinPaginado ? 1 : Math.ceil(count / limitNum);

    res.json({
      success: true,
      data: rows,
      count,
      page: pageNum,
      limit: limitNum,
      totalPages,
      offset,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/planes/bulk-update-cuota
 * Actualiza masivamente el valor_cuota de planes (solo aumento porcentual)
 * Body: {
 *   valor: 5 (número: porcentaje),
 *   tipoAumento: 'porcentual',
 *   filtro?: 'tipo_plan' | 'cobrador' | 'os' | 'todos',
 *   tipo_plan_numero?: number,
 *   cobrador_numero?: number,
 *   os_numero?: number
 * }
 * Retorna: { success, updated: N, affectedPlanes: [], historialIds: [] }
 * Nota: El redondeo se aplica según la precisión configurada en configuracion_app (redondeo_precision)
 */
exports.bulkUpdateCuota = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { valor, tipoAumento, filtro } = req.body;
    const userId = req.user.id;

    if (!valor) {
      return res.status(400).json({ success: false, message: 'valor es requerido' });
    }

    if (tipoAumento && tipoAumento !== 'porcentual') {
      return res.status(400).json({ success: false, message: 'tipoAumento debe ser "porcentual"' });
    }

    let planesToUpdate = [];

    // Determinar planes a actualizar
    if (filtro && filtro !== 'todos') {
      const where = buildFilterWhere(filtro, req.body);
      planesToUpdate = await db.PlanV1.findAll({ where, transaction });
    } else {
      // Todos los planes activos
      planesToUpdate = await db.PlanV1.findAll({
        where: { estado: 'ACTIVO' },
        transaction,
      });
    }

    if (planesToUpdate.length === 0) {
      return res.status(400).json({ success: false, message: 'No se encontraron planes para actualizar' });
    }

    // Cargar precisión de redondeo desde configuración
    const precisionConfig = await db.ConfiguracionApp.findOne({
      where: { tipo_notificacion: 'redondeo_precision' },
      transaction,
    });
    const precision = parseFloat(precisionConfig?.duracion_ms) || 1;

    const historialIds = [];
    const affectedPlanes = [];
    const timestamp = new Date();
    const valorNumerico = parseFloat(valor);

    for (const plan of planesToUpdate) {
      const valorAnterior = parseFloat(plan.valor_cuota);
      let valorNuevo;

      // Calcular nuevo valor (solo porcentual)
      valorNuevo = valorAnterior * (1 + valorNumerico / 100);

      // Redondear hacia arriba según precisión configurada
      valorNuevo = Math.ceil(valorNuevo / precision) * precision;
      // Corrección de punto flotante para evitar errores numéricos
      valorNuevo = Math.round(valorNuevo * 10000) / 10000;

      // Registrar en historial
      const historial = await db.HistorialCuota.create({
        plan_numero: plan.plan_numero,
        valor_anterior: valorAnterior,
        valor_nuevo: valorNuevo,
        fecha_cambio: timestamp,
        usuario_id: userId,
      }, { transaction });

      historialIds.push(historial.id);

      // Actualizar plan
      plan.valor_cuota = valorNuevo;
      plan.fecha_actualizacion = timestamp;
      await plan.save({ transaction });

      affectedPlanes.push({
        plan_numero: plan.plan_numero,
        numero_afiliado: plan.numero_afiliado,
        valor_anterior: valorAnterior,
        valor_nuevo: valorNuevo,
      });
    }

    // Registrar el aumento masivo en tabla aumentos_masivos
    await db.AumentoMasivo.create({
      fecha: timestamp,
      porcentaje: valorNumerico,
      usuario_id: userId,
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      updated: planesToUpdate.length,
      affectedPlanes,
      historialIds,
    });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

/**
 * Helper: Construye WHERE clause basado en filtro y query params
 */
function buildFilterWhere(filtro, body) {
  const where = {};

  if (filtro === 'tipo_plan' && body.tipo_plan_numero) {
    where.tipo_plan_numero = parseInt(body.tipo_plan_numero);
  } else if (filtro === 'cobrador' && body.cobrador_numero) {
    where.cobrador_numero = parseInt(body.cobrador_numero);
  } else if (filtro === 'os' && body.os_numero) {
    where.os_numero = parseInt(body.os_numero);
  } else if (filtro === 'estado' && body.estado) {
    where.estado = body.estado.toUpperCase();
  }

  return where;
}

/**
 * GET /api/planes/count/:filtro
 * Cuenta de planes que serían afectados por un filtro
 * Útil para preview antes de actualizar
 */
exports.countByFilter = async (req, res, next) => {
  try {
    const { filtro } = req.params;
    // Combine query and body params for flexibility
    const params = { ...req.query, ...req.body };
    const where = buildFilterWhere(filtro, params);

    const count = await db.PlanV1.count({ where });

    res.json({
      success: true,
      count,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/planes/historial-cuota
 * Historial de aumentos masivos ejecutados
 */
exports.getHistorialCuota = async (req, res, next) => {
  try {
    const aumentos = await db.AumentoMasivo.findAll({
      include: [
        {
          model: db.Usuario,
          attributes: ['id', 'nombre', 'apellido'],
        },
      ],
      order: [['fecha', 'DESC']],
    });

    res.json({ success: true, data: aumentos });
  } catch (err) {
    next(err);
  }
};
