const db = require('../../models');
const sequelize = require('../../config/database');
const { Op, literal } = require('sequelize');

/**
 * POST /api/recibos/generar
 * Genera recibos para planes en un período específico
 * Body: { periodo: "2026-04-01", planes: [1, 2, 3], force: false }
 * Si planes está vacío, genera para todos los planes ACTIVO
 * Si force=true, borra recibos antiguos del período y regenera
 */
exports.generar = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { periodo, planes, force } = req.body;
    const userId = req.user.id; // Asumiendo que auth middleware asigna esto

    if (!periodo) {
      return res.status(400).json({
        error: 'El parámetro periodo es requerido',
      });
    }

    // Validar formato YYYY-MM-DD sin convertir a Date
    // (evita problemas de timezone al convertir con new Date())
    if (!/^\d{4}-\d{2}-\d{2}$/.test(periodo)) {
      return res.status(400).json({
        error: 'El período debe estar en formato YYYY-MM-DD',
      });
    }

    // Extraer YYYY-MM del período
    const periodoYYYYMM = periodo.substring(0, 7);

    // Asegurar que el período siempre sea el primer día del mes
    // (para consistencia en la BD)
    const periodoNormalizado = `${periodoYYYYMM}-01`;

    // Verificar si el período ya tiene recibos generados
    const periodoExistente = await db.PeriodosRecibos.findOne({
      where: { periodo: periodoYYYYMM },
      transaction,
    });

    if (periodoExistente && !force) {
      // Período ya existe y no es regeneración forzada
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        existe: true,
        cantidad: periodoExistente.cantidad_recibos,
        mensaje: `Ya existen ${periodoExistente.cantidad_recibos} recibos generados para el período ${periodoYYYYMM}`,
      });
    }

    // Si force=true, borrar recibos antiguos del período
    if (periodoExistente && force) {
      // Obtener IDs de recibos a borrar
      const recibosABorrar = await db.Recibo.findAll({
        where: { periodo: periodoNormalizado },
        attributes: ['id'],
        transaction,
      });

      const idsRecibos = recibosABorrar.map((r) => r.id);

      // Borrar integrantes de recibos
      if (idsRecibos.length > 0) {
        await db.ReciboIntegrante.destroy({
          where: { recibo_id: idsRecibos },
          transaction,
        });
      }

      // Borrar recibos
      await db.Recibo.destroy({
        where: { periodo: periodoNormalizado },
        transaction,
      });
    }

    // Determinar qué planes generar
    let planesAGenerar = [];
    if (!planes || planes.length === 0) {
      // Generar para todos los planes ACTIVO
      const todosPlanes = await db.PlanV1.findAll({
        where: { estado: 'ACTIVO' },
        raw: true,
        transaction,
      });
      planesAGenerar = todosPlanes.map((p) => p.plan_numero);
      console.log(`[RECIBOS] Planes encontrados para ${periodoYYYYMM}: ${planesAGenerar.length}`, planesAGenerar);
    } else {
      planesAGenerar = planes;
      console.log(`[RECIBOS] Planes especificados para ${periodoYYYYMM}: ${planesAGenerar.length}`, planesAGenerar);
    }

    const recibosGenerados = [];

    console.log(`[RECIBOS] Iniciando loop de generación para ${planesAGenerar.length} planes`);

    for (const planNumero of planesAGenerar) {
      try {
        // Verificar si ya existe recibo para este plan en este período (cuando NO es force)
        if (!force) {
          const existente = await db.Recibo.findOne({
            where: { plan_numero: planNumero, periodo: periodoNormalizado },
            transaction,
          });

          if (existente) {
            // Omitir sin error
            console.log(`[RECIBOS] Plan ${planNumero} ya tiene recibo para ${periodoYYYYMM}, omitiendo`);
            continue;
          }
        }

        // Obtener datos del plan con sus relaciones
        const plan = await db.PlanV1.findByPk(planNumero, {
          attributes: ['plan_numero', 'numero_afiliado', 'domicilio', 'valor_cuota'],
          include: [
            { model: db.TipoDePlan, attributes: ['tipo_plan_nombre'] },
            { model: db.Cobrador, attributes: ['cobrador_apellido', 'cobrador_nombre'] },
            { model: db.TipoDeGrupo, attributes: ['tipo_de_grupo_nombre'] },
            { model: db.ObraSocial, attributes: ['os_nombre'] },
          ],
          transaction,
        });

        if (!plan) {
          console.log(`[RECIBOS] Plan ${planNumero} no encontrado, omitiendo`);
          continue;
        }

        // Obtener integrantes del plan
        const integrantes = await db.PlanIntegrante.findAll({
          where: { plan_numero: planNumero },
          include: [{ model: db.Persona, attributes: ['id', 'apellido', 'nombre', 'tipo_documento', 'numero_documento', 'fecha_nacimiento', 'fecha_cobertura'] }],
          transaction,
        });

        // Encontrar titular
        const titular = integrantes.find((i) => i.rol === 'titular');
        if (!titular) {
          console.log(`[RECIBOS] Plan ${planNumero} sin titular, omitiendo`);
          continue; // Sin titular, omitir
        }

      // Crear recibo con snapshots
      const recibo = await db.Recibo.create(
        {
          plan_numero: planNumero,
          periodo: periodoNormalizado,
          numero_afiliado: plan.numero_afiliado,
          titular_apellido: titular.Persona.apellido,
          titular_nombre: titular.Persona.nombre,
          obra_social_nombre: plan.ObraSocial?.os_nombre || '',
          tipo_plan_nombre: plan.TipoDePlan?.tipo_plan_nombre || '',
          tipo_de_grupo_nombre: plan.TipoDeGrupo?.tipo_de_grupo_nombre || '',
          cobrador_apellido: plan.Cobrador?.cobrador_apellido || '',
          cobrador_nombre: plan.Cobrador?.cobrador_nombre || '',
          domicilio: plan.domicilio,
          valor_cuota: plan.valor_cuota,
          usuario_id: userId,
        },
        { transaction }
      );

      // Crear integrantes del recibo (snapshots)
      for (const integrante of integrantes) {
        await db.ReciboIntegrante.create(
          {
            recibo_id: recibo.id,
            apellido: integrante.Persona.apellido,
            nombre: integrante.Persona.nombre,
            tipo_documento: integrante.Persona.tipo_documento,
            numero_documento: integrante.Persona.numero_documento,
            fecha_nacimiento: integrante.Persona.fecha_nacimiento,
            fecha_cobertura: integrante.Persona.fecha_cobertura,
            rol: integrante.rol,
          },
          { transaction }
        );
      }

        console.log(`[RECIBOS] Recibo creado para plan ${planNumero}, período ${periodoYYYYMM}`);
        recibosGenerados.push(recibo);
      } catch (err) {
        console.error(`[RECIBOS ERROR] Error generando recibo para plan ${planNumero}:`, err.message);
        throw err; // Relanzar para que la transacción se haga rollback
      }
    }

    console.log(`[RECIBOS] Total recibos generados: ${recibosGenerados.length} para período ${periodoYYYYMM}`);

    // Crear o actualizar registro en periodos_recibos
    console.log(`[RECIBOS] Intentando upsert en periodos_recibos: período=${periodoYYYYMM}, cantidad=${recibosGenerados.length}`);

    try {
      const [periodoRecord, creado] = await db.PeriodosRecibos.upsert(
        {
          periodo: periodoYYYYMM,
          cantidad_recibos: recibosGenerados.length,
          fecha_generacion: new Date(),
        },
        { transaction }
      );
      console.log(`[RECIBOS] Upsert exitoso: ${creado ? 'creado' : 'actualizado'} registro para ${periodoYYYYMM}`);
    } catch (err) {
      console.error(`[RECIBOS ERROR] Error en upsert de periodos_recibos:`, err.message);
      throw err;
    }

    console.log(`[RECIBOS] Commiteando transacción...`);
    await transaction.commit();
    console.log(`[RECIBOS] Transacción commiteada exitosamente`);

    res.status(201).json({
      success: true,
      mensaje: `${recibosGenerados.length} recibos generados`,
      recibos: recibosGenerados,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * GET /api/recibos?periodo=YYYY-MM-DD|plan_numero=X
 * Lista recibos de un período o de un plan específico con sus integrantes
 */
exports.list = async (req, res, next) => {
  try {
    const { periodo, plan_numero } = req.query;

    const where = {};

    if (periodo) {
      // Soportar búsqueda por YYYY-MM (mes completo) o YYYY-MM-DD (día específico)
      if (periodo.length === 7) {
        // YYYY-MM: buscar rango del mes completo (01 a último día)
        const [year, month] = periodo.split('-');
        const firstDay = `${year}-${month}-01`;

        // Calcular último día del mes
        const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
        const lastDay = `${year}-${month}-${String(lastDayOfMonth).padStart(2, '0')}`;

        // Convertir a formato numérico YYYYMMDD para comparación SQL directa
        const firstDayNum = parseInt(firstDay.replace(/-/g, ''));  // 20260401
        const lastDayNum = parseInt(lastDay.replace(/-/g, ''));   // 20260430

        console.log(`[BUG-019 DEBUG] Búsqueda por rango: ${firstDay} a ${lastDay} (${firstDayNum} a ${lastDayNum})`);

        // Usar SQL directo con DATE_FORMAT + CAST para evitar problemas de timezone
        where[Op.and] = [
          literal(`CAST(DATE_FORMAT(\`periodo\`, '%Y%m%d') AS UNSIGNED) BETWEEN ${firstDayNum} AND ${lastDayNum}`)
        ];
      } else if (periodo.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(periodo)) {
        // YYYY-MM-DD: buscar ese día específico
        const periodoNum = parseInt(periodo.replace(/-/g, ''));
        console.log(`[BUG-019 DEBUG] Búsqueda exacta: ${periodo} (${periodoNum})`);
        where[Op.and] = [
          literal(`CAST(DATE_FORMAT(\`periodo\`, '%Y%m%d') AS UNSIGNED) = ${periodoNum}`)
        ];
      }
    }

    if (plan_numero) {
      where.plan_numero = plan_numero;
    }

    if (!periodo && !plan_numero) {
      return res.status(400).json({
        error: 'Se requiere al menos uno de estos parámetros: periodo o plan_numero',
      });
    }

    console.log(`[BUG-019 DEBUG] Where clause:`, JSON.stringify(where, null, 2));

    const recibos = await db.Recibo.findAll({
      where,
      include: [
        {
          model: db.ReciboIntegrante,
          attributes: [
            'id',
            'apellido',
            'nombre',
            'tipo_documento',
            'numero_documento',
            'rol',
          ],
        },
      ],
      order: [['periodo', 'DESC'], ['id', 'DESC']],
    });

    console.log(`[BUG-019 DEBUG] Resultado: ${recibos.length} recibos encontrados`);
    if (recibos.length > 0) {
      console.log(`[BUG-019 DEBUG] Primer recibo periodo:`, recibos[0].periodo, `(tipo: ${typeof recibos[0].periodo})`);
    }

    res.status(200).json(recibos);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/recibos/:id
 * Detalle de un recibo con sus integrantes
 */
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const recibo = await db.Recibo.findByPk(id, {
      include: [
        {
          model: db.ReciboIntegrante,
          attributes: [
            'id',
            'apellido',
            'nombre',
            'tipo_documento',
            'numero_documento',
            'fecha_nacimiento',
            'fecha_cobertura',
            'rol',
          ],
        },
      ],
    });

    if (!recibo) {
      return res.status(404).json({
        error: 'Recibo no encontrado',
        id,
      });
    }

    res.status(200).json(recibo);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/recibos/periodos
 * Lista todos los períodos con recibos generados, ordenados descendentemente
 */
exports.listPeriodos = async (req, res, next) => {
  try {
    const periodos = await db.PeriodosRecibos.findAll({
      order: [['periodo', 'DESC']],
    });
    res.status(200).json(periodos);
  } catch (error) {
    next(error);
  }
};
