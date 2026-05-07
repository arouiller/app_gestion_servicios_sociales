const db = require('../models');
const { Op, literal } = require('sequelize');

/**
 * GET /api/planes/filter/:filtro
 * Obtiene planes filtrados por: todos, tipo_plan, cobrador, os, estado
 * Retorna: { success, data: [planes], count }
 */
exports.filter = async (req, res, next) => {
  try {
    const { filtro } = req.params;
    const { tipo_plan_numero, cobrador_numero, os_numero, estado } = req.query;

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

    const planes = await db.PlanV1.findAll({
      where,
      order: [['plan_numero', 'ASC']],
    });

    res.json({
      success: true,
      data: planes,
      count: planes.length,
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

    if (!valor || parseFloat(valor) <= 0) {
      return res.status(400).json({ success: false, message: 'valor debe ser positivo' });
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
