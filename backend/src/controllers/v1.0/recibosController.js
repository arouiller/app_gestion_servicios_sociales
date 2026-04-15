const db = require('../../models');
const sequelize = require('../../config/database');

/**
 * POST /api/recibos/generar
 * Genera recibos para planes en un período específico
 * Body: { periodo: "2026-04-01", planes: [1, 2, 3] }
 * Si planes está vacío, genera para todos los planes ACTIVO
 */
exports.generar = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { periodo, planes } = req.body;
    const userId = req.user.id; // Asumiendo que auth middleware asigna esto

    if (!periodo) {
      return res.status(400).json({
        error: 'El parámetro periodo es requerido',
      });
    }

    // Convertir período a DATE
    const periodoDate = new Date(periodo);
    if (isNaN(periodoDate)) {
      return res.status(400).json({
        error: 'El período debe ser una fecha válida (YYYY-MM-DD)',
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
    } else {
      planesAGenerar = planes;
    }

    const recibosGenerados = [];

    for (const planNumero of planesAGenerar) {
      // Verificar si ya existe recibo para este plan en este período
      const existente = await db.Recibo.findOne({
        where: { plan_numero: planNumero, periodo: periodoDate },
        transaction,
      });

      if (existente) {
        // Omitir sin error
        continue;
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
        continue; // Sin titular, omitir
      }

      // Crear recibo con snapshots
      const recibo = await db.Recibo.create(
        {
          plan_numero: planNumero,
          periodo: periodoDate,
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

      recibosGenerados.push(recibo);
    }

    await transaction.commit();

    res.status(201).json({
      mensaje: `${recibosGenerados.length} recibos generados`,
      recibos: recibosGenerados,
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * GET /api/recibos?periodo=YYYY-MM-DD
 * Lista recibos de un período con sus integrantes
 */
exports.list = async (req, res, next) => {
  try {
    const { periodo } = req.query;

    if (!periodo) {
      return res.status(400).json({
        error: 'El parámetro periodo es requerido',
      });
    }

    const recibos = await db.Recibo.findAll({
      where: { periodo },
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
      order: [['id', 'DESC']],
    });

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
