const db = require('../models');
const { buildOrderByClause } = require('../utils/sortUtil');

/**
 * Mapeo de entidades lookup con su configuración (modelo, PK, campos, referencias)
 */
const ENTIDADES = {
  cobradores: {
    model: db.Cobrador,
    pkField: 'cobrador_numero',
    campos: ['cobrador_apellido', 'cobrador_nombre'],
    refsCheck: [{ model: db.PlanV1, fk: 'cobrador_numero' }],
  },
  'tipos-de-plan': {
    model: db.TipoDePlan,
    pkField: 'tipo_plan_numero',
    campos: ['tipo_plan_nombre', 'abreviacion'],
    refsCheck: [{ model: db.PlanV1, fk: 'tipo_plan_numero' }],
  },
  'obras-sociales': {
    model: db.ObraSocial,
    pkField: 'os_numero',
    campos: ['os_nombre'],
    refsCheck: [{ model: db.PlanV1, fk: 'os_numero' }],
  },
  'servicios-adicionales': {
    model: db.ServicioAdicional,
    pkField: 'servicio_adicional_numero',
    campos: ['servicio_adicional_nombre'],
    refsCheck: [{ model: db.IntegranteServicio, fk: 'servicio_adicional_numero' }],
  },
  'tipos-de-grupo': {
    model: db.TipoDeGrupo,
    pkField: 'tipo_de_grupo_numero',
    campos: ['tipo_de_grupo_nombre', 'abreviacion'],
    refsCheck: [{ model: db.PlanV1, fk: 'tipo_de_grupo_numero' }],
  },
  'zonas': {
    model: db.Zona,
    pkField: 'id',
    campos: ['codigo', 'nombre'],
    refsCheck: [],
  },
};

/**
 * GET /api/lookup/:entidad
 * Devuelve todos los registros de la entidad
 * Query params: sortBy, order (ASC|DESC)
 */
exports.list = async (req, res, next) => {
  try {
    const { entidad } = req.params;
    const { sortBy, order } = req.query;
    const config = ENTIDADES[entidad];

    if (!config) {
      return res.status(404).json({
        error: 'Entidad no encontrada',
        entidad,
      });
    }

    // Build ORDER BY clause: allow sorting by PK and all campos
    const allowedColumns = [config.pkField, ...config.campos];
    let orderBy = [[config.pkField, 'ASC']]; // default
    if (sortBy) {
      orderBy = buildOrderByClause(sortBy, order, allowedColumns);
    }

    const registros = await config.model.findAll({
      order: orderBy,
    });

    res.status(200).json(registros);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/lookup/:entidad
 * Crea un nuevo registro
 * - Valida que TODOS los campos estén presentes
 * - Si se provee PK: verifica unicidad
 * - Si NO se provee: calcula siguiente PK con MAX(pkField) + 1
 */
exports.create = async (req, res, next) => {
  try {
    const { entidad } = req.params;
    const config = ENTIDADES[entidad];

    if (!config) {
      return res.status(404).json({
        error: 'Entidad no encontrada',
        entidad,
      });
    }

    const datos = req.body;

    // Validar que TODOS los campos NO-PK estén presentes
    // El pkField es opcional y será auto-calculado si no se provee
    const camposRequeridos = config.campos;
    const camposFaltantes = camposRequeridos.filter(
      (campo) => datos[campo] === undefined || datos[campo] === null || datos[campo] === ''
    );

    if (camposFaltantes.length > 0) {
      return res.status(422).json({
        error: 'Campos requeridos faltantes',
        campos: camposFaltantes,
      });
    }

    // Si se provee PK: verificar unicidad
    if (datos[config.pkField] !== undefined && datos[config.pkField] !== null) {
      const existe = await config.model.findByPk(datos[config.pkField]);
      if (existe) {
        return res.status(409).json({
          error: `${config.pkField} ya existe`,
          [config.pkField]: datos[config.pkField],
        });
      }
    } else {
      // Calcular siguiente PK con MAX(pkField) + 1
      const maxRecord = await config.model.findOne({
        attributes: [
          [db.sequelize.fn('MAX', db.sequelize.col(config.pkField)), 'maxValue'],
        ],
        raw: true,
      });

      datos[config.pkField] = (maxRecord?.maxValue || 0) + 1;
    }

    // Procesar abreviacion si existe (trim y uppercase)
    if (datos.abreviacion) {
      datos.abreviacion = datos.abreviacion.trim().toUpperCase();
    }

    // Asegurar timestamps
    datos.fecha_creacion = new Date();
    datos.fecha_actualizacion = new Date();

    const nuevoRegistro = await config.model.create(datos);

    res.status(201).json(nuevoRegistro);
  } catch (error) {
    // Manejar error de unique constraint para abreviacion
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        error: 'Abreviación duplicada',
        message: 'Esta abreviación ya existe',
      });
    }
    next(error);
  }
};

/**
 * PUT /api/lookup/:entidad/:id
 * Actualiza un registro existente
 * - Verifica existencia → 404
 * - Valida campos → 422
 * - Actualiza fecha_actualizacion + campos
 */
exports.update = async (req, res, next) => {
  try {
    const { entidad, id } = req.params;
    const config = ENTIDADES[entidad];

    if (!config) {
      return res.status(404).json({
        error: 'Entidad no encontrada',
        entidad,
      });
    }

    // Verificar existencia
    const registro = await config.model.findByPk(id);
    if (!registro) {
      return res.status(404).json({
        error: 'Registro no encontrado',
        [config.pkField]: id,
      });
    }

    const datos = req.body;

    // Remove PK field from update payload to prevent primary key constraint violation
    delete datos[config.pkField];

    // Validar que TODOS los campos estén presentes
    const camposRequeridos = config.campos;
    const camposFaltantes = camposRequeridos.filter(
      (campo) => datos[campo] === undefined || datos[campo] === null || datos[campo] === ''
    );

    if (camposFaltantes.length > 0) {
      return res.status(422).json({
        error: 'Campos requeridos faltantes',
        campos: camposFaltantes,
      });
    }

    // Procesar abreviacion si existe (trim y uppercase)
    if (datos.abreviacion) {
      datos.abreviacion = datos.abreviacion.trim().toUpperCase();
    }

    // Actualizar fecha_actualizacion y campos
    datos.fecha_actualizacion = new Date();

    await registro.update(datos);

    res.status(200).json(registro);
  } catch (error) {
    // Manejar error de unique constraint para abreviacion
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        error: 'Abreviación duplicada',
        message: 'Esta abreviación ya existe',
      });
    }
    next(error);
  }
};

/**
 * DELETE /api/lookup/:entidad/:id
 * Elimina un registro con soporte para eliminación en cascada
 * - Verifica existencia → 404
 * - Verifica referencias (FK) → 409 si está en uso (sin force)
 * - Si force=true: ejecuta eliminación en cascada y elimina la entidad
 *
 * Query params:
 * - force=true: fuerza eliminación en cascada (default: false)
 */
exports.delete = async (req, res, next) => {
  try {
    const { entidad, id } = req.params;
    const { force } = req.query;
    const forceDelete = force === 'true' || force === '1';
    const config = ENTIDADES[entidad];

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Entidad no encontrada',
        entidad,
      });
    }

    // Verificar existencia
    const registro = await config.model.findByPk(id);
    if (!registro) {
      return res.status(404).json({
        success: false,
        error: 'Registro no encontrado',
        [config.pkField]: id,
      });
    }

    // Verificar referencias en cada modelo de refsCheck
    let referenciaEncontrada = null;
    let cantidadReferencias = 0;

    for (const ref of config.refsCheck) {
      const count = await ref.model.count({
        where: { [ref.fk]: id },
      });

      if (count > 0) {
        referenciaEncontrada = ref;
        cantidadReferencias = count;
        break;
      }
    }

    // Si hay referencias y no es force delete, retornar 409 con detalles
    if (referenciaEncontrada && !forceDelete) {
      return res.status(409).json({
        success: false,
        error: 'No se puede eliminar, está en uso',
        message: `Hay ${cantidadReferencias} ${referenciaEncontrada.model.tableName} usando esta entidad. ¿Deseas proceder eliminando las referencias?`,
        referencias: cantidadReferencias,
        referenciaEn: referenciaEncontrada.model.tableName,
        entidad,
        [config.pkField]: id,
      });
    }

    // Ejecutar eliminación (con o sin cascada)
    if (forceDelete && referenciaEncontrada) {
      // Eliminación en cascada: usar transacción para atomicidad
      const transaction = await db.sequelize.transaction();

      try {
        // Ejecutar eliminación en cascada según la entidad
        await deleteCascade(entidad, id, referenciaEncontrada, transaction);

        // Eliminar la entidad
        await registro.destroy({ transaction });

        // Confirmar transacción
        await transaction.commit();

        return res.status(200).json({
          success: true,
          mensaje: `${entidad.slice(0, -1)} eliminado correctamente con ${cantidadReferencias} referencias actualizadas`,
          [config.pkField]: id,
          referencesAffected: cantidadReferencias,
        });
      } catch (cascadeError) {
        // Revertir transacción si algo falla
        await transaction.rollback();
        throw cascadeError;
      }
    } else {
      // Eliminación simple (sin referencias o ya fue cascada)
      await registro.destroy();

      res.status(200).json({
        success: true,
        mensaje: 'Registro eliminado correctamente',
        [config.pkField]: id,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/lookup/:entidad/:id/referencias
 * Obtiene cantidad de referencias a un registro sin intentar eliminarlo
 * Retorna: { referencias: number, referenciaEn: string }
 */
exports.getReferencias = async (req, res, next) => {
  try {
    const { entidad, id } = req.params;
    const config = ENTIDADES[entidad];

    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Entidad no encontrada',
        entidad,
      });
    }

    // Verificar existencia del registro
    const registro = await config.model.findByPk(id);
    if (!registro) {
      return res.status(404).json({
        success: false,
        error: 'Registro no encontrado',
        [config.pkField]: id,
      });
    }

    // Contar referencias en cada modelo de refsCheck
    let referenciaEncontrada = null;
    let cantidadReferencias = 0;

    for (const ref of config.refsCheck) {
      const count = await ref.model.count({
        where: { [ref.fk]: id },
      });

      if (count > 0) {
        referenciaEncontrada = ref;
        cantidadReferencias = count;
        break;
      }
    }

    res.status(200).json({
      success: true,
      referencias: cantidadReferencias,
      referenciaEn: referenciaEncontrada?.model.tableName || '',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Función auxiliar para eliminación en cascada
 * Actualiza FKs a NULL en lugar de eliminar registros dependientes
 * Manejo diferenciado por entidad
 */
async function deleteCascade(entidad, id, ref, transaction) {
  const db = require('../models');

  switch (entidad) {
    case 'cobradores':
      // Establecer cobrador_numero = NULL en planes que lo referencian
      await db.PlanV1.update(
        { cobrador_numero: null },
        { where: { cobrador_numero: id }, transaction }
      );
      break;

    case 'tipos-de-plan':
      // Establecer tipo_plan_numero = NULL en planes que lo referencian
      await db.PlanV1.update(
        { tipo_plan_numero: null },
        { where: { tipo_plan_numero: id }, transaction }
      );
      break;

    case 'obras-sociales':
      // Establecer os_numero = NULL en planes que lo referencian
      await db.PlanV1.update(
        { os_numero: null },
        { where: { os_numero: id }, transaction }
      );
      break;

    case 'servicios-adicionales':
      // Eliminar registros IntegranteServicio que referencian este servicio
      await db.IntegranteServicio.destroy(
        { where: { servicio_adicional_numero: id }, transaction }
      );
      break;

    case 'tipos-de-grupo':
      // Establecer tipo_de_grupo_numero = NULL en planes que lo referencian
      await db.PlanV1.update(
        { tipo_de_grupo_numero: null },
        { where: { tipo_de_grupo_numero: id }, transaction }
      );
      break;

    case 'zonas':
      // Zonas no tienen referencias, sin cascada necesaria
      break;

    default:
      throw new Error(`Cascada no soportada para entidad: ${entidad}`);
  }
}
