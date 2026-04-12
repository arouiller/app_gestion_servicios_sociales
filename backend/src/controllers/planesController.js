const db = require('../models');
const { Op } = require('sequelize');

/**
 * Obtiene el siguiente número de afiliado disponible
 * GET /api/planes/siguiente-numero-afiliado
 * @note DEBE registrarse ANTES que GET /api/planes/:id en routes
 */
exports.obtenerSiguienteNumeroAfiliado = async (req, res, next) => {
  try {
    // Busca el máximo número de afiliado que sea numérico
    const result = await db.sequelize.query(
      'SELECT MAX(CAST(numero_afiliado AS UNSIGNED)) as max_numero FROM planes',
      { type: db.sequelize.QueryTypes.SELECT },
    );

    const maxNumero = result[0]?.max_numero || 0;
    const siguienteNumero = maxNumero + 1;

    res.json({ siguiente: siguienteNumero.toString() });
  } catch (err) {
    next(err);
  }
};

/**
 * Lista todos los planes con filtros opcionales y paginación
 * GET /api/planes?estado=ACTIVO&cobrador_numero=1&os_numero=2&page=1&limit=20
 */
exports.list = async (req, res, next) => {
  try {
    const { estado, cobrador_numero, os_numero, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Construir where clause dinámicamente
    const where = {};
    if (estado) where.estado = estado;
    if (cobrador_numero) where.cobrador_numero = parseInt(cobrador_numero);
    if (os_numero) where.os_numero = parseInt(os_numero);

    const { count, rows } = await db.Plan.findAndCountAll({
      where,
      include: [
        { model: db.Cobrador, attributes: ['numero', 'nombre'] },
        { model: db.TipoDePlan, attributes: ['numero', 'nombre'] },
        { model: db.ObraSocial, attributes: ['numero', 'nombre'] },
        { model: db.TipoDeGrupo, attributes: ['numero', 'nombre'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['plan_numero', 'DESC']],
    });

    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      data: rows,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Obtiene el detalle completo de un plan
 * GET /api/planes/:id
 * Incluye integrantes con sus datos de persona, credencial, rol y servicios
 */
exports.detail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await db.Plan.findByPk(id, {
      include: [
        { model: db.Cobrador, attributes: ['numero', 'nombre'] },
        { model: db.TipoDePlan, attributes: ['numero', 'nombre'] },
        { model: db.ObraSocial, attributes: ['numero', 'nombre'] },
        { model: db.TipoDeGrupo, attributes: ['numero', 'nombre'] },
        {
          model: db.PlanIntegrante,
          attributes: ['id', 'rol', 'credencial', 'fecha_creacion'],
          include: [
            { model: db.Persona, attributes: ['id', 'apellido', 'nombre', 'tipo_documento', 'numero_documento', 'fecha_nacimiento', 'fecha_cobertura'] },
            {
              model: db.IntegranteServicio,
              attributes: ['servicio_adicional_numero'],
              include: [{ model: db.ServicioAdicional, attributes: ['numero', 'nombre'] }],
            },
          ],
        },
      ],
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan no encontrado' });
    }

    res.json(plan);
  } catch (err) {
    next(err);
  }
};

/**
 * Crea un nuevo plan con integrantes y servicios (TRANSACCIÓN)
 * POST /api/planes
 * Body: {
 *   tipo_plan_numero, cobrador_numero, tipo_de_grupo_numero, os_numero,
 *   numero_afiliado, telefono_1?, telefono_2?, domicilio?, localidad?, valor_cuota?,
 *   integrantes: [
 *     {
 *       persona_id?: number,
 *       rol: 'titular' | 'integrante',
 *       credencial: string,
 *       apellido?, nombre?, tipo_documento?, numero_documento?, fecha_nacimiento?, fecha_cobertura?,
 *       servicios: [numero_servicio, ...]
 *     }
 *   ]
 * }
 */
exports.create = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

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
      integrantes = [],
    } = req.body;

    // Validación: al menos 1 integrante
    if (!integrantes || integrantes.length === 0) {
      await transaction.rollback();
      return res.status(422).json({ success: false, message: 'Se requiere al menos 1 integrante' });
    }

    // Validación: exactamente 1 titular
    const titulares = integrantes.filter(i => i.rol === 'titular');
    if (titulares.length !== 1) {
      await transaction.rollback();
      return res.status(422).json({ success: false, message: 'Debe haber exactamente 1 titular' });
    }

    try {
      // Procesar integrantes: crear personas si es necesario
      const integrantesConPersona = [];
      for (const integrante of integrantes) {
        let personaId = integrante.persona_id;

        if (!personaId) {
          // Crear nueva persona
          if (!integrante.apellido || !integrante.nombre || !integrante.tipo_documento || !integrante.numero_documento || !integrante.fecha_nacimiento || !integrante.fecha_cobertura) {
            throw new Error('Datos de persona incompletos para nuevo integrante');
          }

          const nuevaPersona = await db.Persona.create({
            apellido: integrante.apellido,
            nombre: integrante.nombre,
            tipo_documento: integrante.tipo_documento,
            numero_documento: integrante.numero_documento,
            fecha_nacimiento: integrante.fecha_nacimiento,
            fecha_cobertura: integrante.fecha_cobertura,
          }, { transaction });

          personaId = nuevaPersona.id;
        } else {
          // Verificar que la persona existe
          const persona = await db.Persona.findByPk(personaId, { transaction });
          if (!persona) {
            throw new Error(`Persona con ID ${personaId} no existe`);
          }
        }

        integrantesConPersona.push({
          ...integrante,
          persona_id: personaId,
        });
      }

      // Crear plan
      const plan = await db.Plan.create({
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
        estado: 'ACTIVO',
      }, { transaction });

      // Crear plan_integrantes e integrante_servicios
      for (const integrante of integrantesConPersona) {
        const planIntegrante = await db.PlanIntegrante.create({
          plan_numero: plan.plan_numero,
          persona_id: integrante.persona_id,
          rol: integrante.rol,
          credencial: integrante.credencial,
        }, { transaction });

        // Crear integrante_servicios
        if (integrante.servicios && integrante.servicios.length > 0) {
          for (const servicioNumero of integrante.servicios) {
            await db.IntegranteServicio.create({
              plan_integrante_id: planIntegrante.id,
              servicio_adicional_numero: servicioNumero,
            }, { transaction });
          }
        }
      }

      await transaction.commit();

      // Obtener plan creado con todas sus relaciones
      const planCreado = await db.Plan.findByPk(plan.plan_numero, {
        include: [
          { model: db.Cobrador, attributes: ['numero', 'nombre'] },
          { model: db.TipoDePlan, attributes: ['numero', 'nombre'] },
          { model: db.ObraSocial, attributes: ['numero', 'nombre'] },
          { model: db.TipoDeGrupo, attributes: ['numero', 'nombre'] },
          {
            model: db.PlanIntegrante,
            attributes: ['id', 'rol', 'credencial', 'fecha_creacion'],
            include: [
              { model: db.Persona, attributes: ['id', 'apellido', 'nombre', 'tipo_documento', 'numero_documento', 'fecha_nacimiento', 'fecha_cobertura'] },
              {
                model: db.IntegranteServicio,
                attributes: ['servicio_adicional_numero'],
                include: [{ model: db.ServicioAdicional, attributes: ['numero', 'nombre'] }],
              },
            ],
          },
        ],
      });

      res.status(201).json(planCreado);
    } catch (innerErr) {
      await transaction.rollback();
      throw innerErr;
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Actualiza un plan existente con integrantes (TRANSACCIÓN)
 * PUT /api/planes/:id
 * Body: igual a POST /api/planes
 */
exports.update = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
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
      integrantes = [],
    } = req.body;

    // Validación: al menos 1 integrante
    if (!integrantes || integrantes.length === 0) {
      await transaction.rollback();
      return res.status(422).json({ success: false, message: 'Se requiere al menos 1 integrante' });
    }

    // Validación: exactamente 1 titular
    const titulares = integrantes.filter(i => i.rol === 'titular');
    if (titulares.length !== 1) {
      await transaction.rollback();
      return res.status(422).json({ success: false, message: 'Debe haber exactamente 1 titular' });
    }

    try {
      // Obtener plan actual
      const planActual = await db.Plan.findByPk(id, { transaction });
      if (!planActual) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: 'Plan no encontrado' });
      }

      // Actualizar datos del plan
      await planActual.update({
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
        estado: estado || planActual.estado,
        fecha_actualizacion: new Date(),
      }, { transaction });

      // Obtener integrantes actuales
      const integrantesActuales = await db.PlanIntegrante.findAll({
        where: { plan_numero: id },
        transaction,
      });

      // IDs de integrantes nuevos (que tienen id asignado son existentes)
      const nuevosIds = integrantes.filter(i => i.id).map(i => i.id);

      // Eliminar integrantes que NO están en la nueva lista
      for (const integranteActual of integrantesActuales) {
        if (!nuevosIds.includes(integranteActual.id)) {
          // CASCADE eliminará integrante_servicios automáticamente
          await integranteActual.destroy({ transaction });
        }
      }

      // Procesar integrantes: actualizar existentes o crear nuevos
      for (const integrante of integrantes) {
        let personaId = integrante.persona_id;

        // Si no hay persona_id, crear nueva
        if (!personaId) {
          if (!integrante.apellido || !integrante.nombre || !integrante.tipo_documento || !integrante.numero_documento || !integrante.fecha_nacimiento || !integrante.fecha_cobertura) {
            throw new Error('Datos de persona incompletos para nuevo integrante');
          }

          const nuevaPersona = await db.Persona.create({
            apellido: integrante.apellido,
            nombre: integrante.nombre,
            tipo_documento: integrante.tipo_documento,
            numero_documento: integrante.numero_documento,
            fecha_nacimiento: integrante.fecha_nacimiento,
            fecha_cobertura: integrante.fecha_cobertura,
          }, { transaction });

          personaId = nuevaPersona.id;
        } else {
          // Verificar que la persona existe
          const persona = await db.Persona.findByPk(personaId, { transaction });
          if (!persona) {
            throw new Error(`Persona con ID ${personaId} no existe`);
          }
        }

        if (integrante.id) {
          // Actualizar integrante existente
          const integrantePlanActual = await db.PlanIntegrante.findByPk(integrante.id, { transaction });
          if (integrantePlanActual) {
            await integrantePlanActual.update({
              persona_id: personaId,
              rol: integrante.rol,
              credencial: integrante.credencial,
            }, { transaction });

            // Sincronizar servicios: eliminar todos y crear nuevos
            await db.IntegranteServicio.destroy({
              where: { plan_integrante_id: integrante.id },
              transaction,
            });

            if (integrante.servicios && integrante.servicios.length > 0) {
              for (const servicioNumero of integrante.servicios) {
                await db.IntegranteServicio.create({
                  plan_integrante_id: integrante.id,
                  servicio_adicional_numero: servicioNumero,
                }, { transaction });
              }
            }
          }
        } else {
          // Crear nuevo integrante
          const nuevoIntegrante = await db.PlanIntegrante.create({
            plan_numero: id,
            persona_id: personaId,
            rol: integrante.rol,
            credencial: integrante.credencial,
          }, { transaction });

          if (integrante.servicios && integrante.servicios.length > 0) {
            for (const servicioNumero of integrante.servicios) {
              await db.IntegranteServicio.create({
                plan_integrante_id: nuevoIntegrante.id,
                servicio_adicional_numero: servicioNumero,
              }, { transaction });
            }
          }
        }
      }

      await transaction.commit();

      // Obtener plan actualizado con todas sus relaciones
      const planActualizado = await db.Plan.findByPk(id, {
        include: [
          { model: db.Cobrador, attributes: ['numero', 'nombre'] },
          { model: db.TipoDePlan, attributes: ['numero', 'nombre'] },
          { model: db.ObraSocial, attributes: ['numero', 'nombre'] },
          { model: db.TipoDeGrupo, attributes: ['numero', 'nombre'] },
          {
            model: db.PlanIntegrante,
            attributes: ['id', 'rol', 'credencial', 'fecha_creacion'],
            include: [
              { model: db.Persona, attributes: ['id', 'apellido', 'nombre', 'tipo_documento', 'numero_documento', 'fecha_nacimiento', 'fecha_cobertura'] },
              {
                model: db.IntegranteServicio,
                attributes: ['servicio_adicional_numero'],
                include: [{ model: db.ServicioAdicional, attributes: ['numero', 'nombre'] }],
              },
            ],
          },
        ],
      });

      res.json(planActualizado);
    } catch (innerErr) {
      await transaction.rollback();
      throw innerErr;
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Elimina un plan
 * DELETE /api/planes/:id
 * Las cascadas eliminarán plan_integrantes e integrante_servicios automáticamente
 * Las personas se mantienen (pueden pertenecer a otros planes)
 */
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await db.Plan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan no encontrado' });
    }

    await plan.destroy();

    res.json({ success: true, message: 'Plan eliminado correctamente' });
  } catch (err) {
    next(err);
  }
};
