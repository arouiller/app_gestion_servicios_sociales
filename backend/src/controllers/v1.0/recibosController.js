const db = require('../../models');
const sequelize = require('../../config/database');
const { Op, literal } = require('sequelize');
const {
  formatCurrency,
  replaceAllPlaceholders,
  getArancelCSSClass,
  getArancelWarningIcon,
  groupRecibosInPairs,
  getDefaultTemplateString,
} = require('../../utils/pdfHelpers');

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
    const { periodo, planes, force, numeroInicialRecibo } = req.body;
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
    let reciboIndex = 0;

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
          attributes: ['plan_numero', 'numero_afiliado', 'domicilio', 'valor_cuota', 'zona_id'],
          include: [
            { model: db.TipoDePlan, attributes: ['tipo_plan_nombre'] },
            { model: db.Cobrador, attributes: ['cobrador_apellido', 'cobrador_nombre'] },
            { model: db.TipoDeGrupo, attributes: ['tipo_de_grupo_nombre'] },
            { model: db.ObraSocial, attributes: ['os_nombre'] },
            { model: db.Zona, attributes: ['codigo'] },
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

      // BACKLOG-079: Obtener parámetro sistema valor_cuota_social
      // configuracion_app usa modelo genérico: tipo_notificacion + duracion_ms
      const configApp = await db.ConfiguracionApp.findOne({
        attributes: ['duracion_ms'],
        where: { tipo_notificacion: 'valor_cuota_social' },
        transaction,
      });
      const cuotaSocial = parseFloat(configApp?.duracion_ms || 0);

      // BACKLOG-079: Calcular arancel por servicio
      const valorCuota = parseFloat(plan.valor_cuota || 0);
      const arancelPorServicio = valorCuota - cuotaSocial;

      // BACKLOG-079: Log warning si arancel es negativo
      if (arancelPorServicio < 0) {
        console.warn(
          `[BACKLOG-079] arancel_por_servicio negativo en recibo. ` +
          `Plan: ${plan.numero_afiliado}, valor_cuota: ${valorCuota}, ` +
          `cuota_social: ${cuotaSocial}, arancel: ${arancelPorServicio}`
        );
      }

      // Crear recibo con snapshots y desglose
      const recibo = await db.Recibo.create(
        {
          plan_numero: planNumero,
          periodo: periodoNormalizado,
          numero_afiliado: plan.numero_afiliado,
          numero_recibo: numeroInicialRecibo ? numeroInicialRecibo + reciboIndex : null,
          titular_apellido: titular.Persona.apellido,
          titular_nombre: titular.Persona.nombre,
          obra_social_nombre: plan.ObraSocial?.os_nombre || '',
          tipo_plan_nombre: plan.TipoDePlan?.tipo_plan_nombre || '',
          tipo_de_grupo_nombre: plan.TipoDeGrupo?.tipo_de_grupo_nombre || '',
          cobrador_apellido: plan.Cobrador?.cobrador_apellido || '',
          cobrador_nombre: plan.Cobrador?.cobrador_nombre || '',
          domicilio: plan.domicilio,
          valor_cuota: valorCuota,
          cuota_social: cuotaSocial,
          arancel_por_servicio: arancelPorServicio,
          zona_codigo: plan.Zona?.codigo || null,
          usuario_id: userId,
        },
        { transaction }
      );

      // BACKLOG-079: Validar invariante (suma = total)
      const invariante = Math.abs(
        (recibo.cuota_social + recibo.arancel_por_servicio) - recibo.valor_cuota
      );
      if (invariante > 0.01) {
        throw new Error(
          `Invariante de desglose violada. Recibo: ${recibo.id}. ` +
          `Suma: ${recibo.cuota_social + recibo.arancel_por_servicio}, ` +
          `Total: ${recibo.valor_cuota}`
        );
      }

      reciboIndex++;

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

/**
 * GET /api/recibos/ultimo-aumento-masivo
 * Obtiene el último aumento masivo realizado (BACKLOG-056)
 */
exports.getUltimoAumentoMasivo = async (req, res, next) => {
  try {
    const ultimoAumento = await db.AumentoMasivo.findOne({
      include: [
        {
          model: db.Usuario,
          attributes: ['id', 'nombre', 'apellido'],
        },
      ],
      order: [['fecha', 'DESC']],
    });

    res.json({
      success: true,
      data: ultimoAumento,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/recibos/numero-max
 * Obtiene el número máximo de recibo registrado + 1 como sugerencia
 */
exports.getMaxNumeroRecibo = async (req, res, next) => {
  try {
    const result = await db.Recibo.max('numero_recibo');
    const sugerido = (result || 0) + 1;
    res.json({ sugerido });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/recibos/periodo/:periodo
 * Elimina todos los recibos de un período (YYYY-MM)
 * También elimina sus integrantes (ReciboIntegrante) en cascada
 * Y actualiza PeriodosRecibos
 */
exports.deletePeriodo = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { periodo } = req.params;

    // Validar formato YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      return res.status(400).json({
        error: 'El período debe estar en formato YYYY-MM',
      });
    }

    // Obtener todos los recibos del período
    const recibos = await db.Recibo.findAll({
      where: {
        periodo: {
          [Op.startsWith]: periodo,
        },
      },
      transaction,
    });

    if (recibos.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'No hay recibos para este período',
      });
    }

    const recibosIds = recibos.map(r => r.id);

    // 1. Eliminar ReciboIntegrante asociados
    await db.ReciboIntegrante.destroy({
      where: {
        recibo_id: {
          [Op.in]: recibosIds,
        },
      },
      transaction,
    });

    // 2. Eliminar Recibos
    await db.Recibo.destroy({
      where: {
        periodo: {
          [Op.startsWith]: periodo,
        },
      },
      transaction,
    });

    // 3. Eliminar PeriodosRecibos
    await db.PeriodosRecibos.destroy({
      where: {
        periodo: periodo,
      },
      transaction,
    });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: `Se eliminaron ${recibos.length} recibos del período ${periodo}`,
      cantidad: recibos.length,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting recibos for period:', error);
    res.status(500).json({
      error: error.message || 'Error al eliminar recibos',
    });
  }
};

/**
 * GET /api/recibos/generar-pdf
 * Genera un PDF con todos los recibos de un período con desglose de cuotas y layout 2-per-page
 * Query params: periodo (YYYY-MM)
 * BACKLOG-080: Mejora con desglose y optimización de layout
 */
exports.generarPDF = async (req, res, next) => {
  try {
    const { periodo } = req.query;

    // Validar formato YYYY-MM
    if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) {
      return res.status(400).json({
        error: 'El período debe estar en formato YYYY-MM',
      });
    }

    // Obtener todos los recibos del período con localidad via raw query
    const recibos = await sequelize.query(`
      SELECT
        r.*,
        l.nombre as localidad_nombre
      FROM recibos r
      LEFT JOIN planes p ON r.plan_numero = p.plan_numero
      LEFT JOIN localidades l ON p.localidad_id = l.id
      WHERE r.periodo LIKE ?
      ORDER BY r.id
    `, {
      replacements: [`${periodo}%`],
      type: sequelize.QueryTypes.SELECT,
    });

    if (recibos.length === 0) {
      return res.status(404).json({
        error: 'No hay recibos para este período',
      });
    }

    // Obtener template activo de la BD o usar template por defecto
    let templateDB = await db.ReciboTemplate.findOne({
      where: { activo: true },
    });

    const fullTemplate = templateDB?.html || getDefaultTemplateString();
    const { config, content } = parseTemplate(fullTemplate);

    // Crear documento con configuración del template
    let doc = createConfiguredPDFDoc(config);

    // Header
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recibos_${periodo}.pdf"`);

    // Pipe al response
    doc.pipe(res);

    // BACKLOG-080: Procesar recibos en pares para layout 2-per-page
    const pares = groupRecibosInPairs(recibos);
    let pageNumber = 0;

    pares.forEach((par) => {
      // Agregar nueva página para cada par (excepto el primero)
      if (pageNumber > 0) {
        doc.addPage();
      }
      pageNumber++;

      // Procesar cada recibo en el par
      par.forEach((recibo, indexInPar) => {
        const reciboHTML = renderRecibo(recibo, content);

        // Renderizar el recibo en el PDF
        let y = config.margins;
        if (reciboHTML.includes('<')) {
          // Contenido HTML
          y = renderHTMLtoPDF(doc, reciboHTML, config, y);
        } else {
          // Contenido texto plano
          const lineHeight = 11;
          doc.fontSize(9).font('Helvetica').fillColor('#000');
          const lines = reciboHTML.split('\n');
          lines.forEach((line) => {
            doc.text(line, config.margins + 5, y);
            y += lineHeight;
          });
        }

        // Agregar separador si hay un segundo recibo en el par
        if (indexInPar === 0 && par.length === 2) {
          y += 10; // Espacio vertical
          doc.strokeColor('#ccc').lineWidth(0.5).moveTo(config.margins, y).lineTo(doc.page.width - config.margins, y).stroke();
          y += 10;
        }
      });
    });

    // Finalizar documento
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      error: error.message || 'Error al generar PDF',
    });
  }
};

/**
 * BACKLOG-080: Renderiza un recibo individual reemplazando todos los placeholders
 */
function renderRecibo(recibo, template) {
  const numeroRecibo = recibo.numero_recibo ?? recibo.id;
  const numeroAfiliado = String(recibo.numero_afiliado).padStart(5, '0');
  const zonaCodigo = recibo.zona_codigo || '-';
  const localidad = recibo.localidad_nombre || '-';
  const cuotaSocial = formatCurrency(recibo.cuota_social || 0);
  const arancelPorServicio = parseFloat(recibo.arancel_por_servicio || 0);
  const valorCuota = formatCurrency(recibo.valor_cuota || 0);

  // BACKLOG-080: Colores dinámicos para arancel negativo
  const isArancelNegative = arancelPorServicio < 0;
  const arancelBg = isArancelNegative ? '#fff3cd' : '#f9f9f9';
  const arancelColor = isArancelNegative ? '#856404' : '#27ae60';

  // BACKLOG-080: Preparar datos para placeholders de desglose
  const reciboData = {
    numero_recibo: numeroRecibo,
    numero_afiliado: numeroAfiliado,
    zona_codigo: zonaCodigo,
    titular_apellido: recibo.titular_apellido,
    titular_nombre: recibo.titular_nombre,
    obra_social_nombre: recibo.obra_social_nombre,
    tipo_de_grupo_nombre: recibo.tipo_de_grupo_nombre,
    tipo_plan_nombre: recibo.tipo_plan_nombre,
    localidad_nombre: localidad,
    domicilio: recibo.domicilio || '-',
    valor_cuota: valorCuota,
    cuota_social: cuotaSocial,
    arancel_por_servicio: formatCurrency(arancelPorServicio),
    arancel_negativo_class: getArancelCSSClass(arancelPorServicio),
    arancel_warning_icon: getArancelWarningIcon(arancelPorServicio),
    arancel_bg: arancelBg,
    arancel_color: arancelColor,
  };

  // Usar helper para reemplazar todos los placeholders
  return replaceAllPlaceholders(template, reciboData);
}

// Helper: Template por defecto hardcodeado
function getDefaultPDFTemplate() {
  return `<!DOCTYPE html>
<html lang="es-AR">
<head>
  <style>
    body { font-family: Arial; margin: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #34495e; color: white; padding: 10px; }
    td { padding: 8px; border-bottom: 1px solid #ddd; }
  </style>
</head>
<body>
  <h2>Recibos — {{periodo}}</h2>
  <table>
    <tr><th>N° Recibo</th><th>Afiliado</th><th>Titular</th><th>Obra Social</th><th>Valor</th></tr>
    <tr>
      <td>{{numero_recibo}}</td>
      <td>{{numero_afiliado}}</td>
      <td>{{titular_apellido}}, {{titular_nombre}}</td>
      <td>{{obra_social_nombre}}</td>
      <td>\${{valor_cuota}}</td>
    </tr>
  </table>
</body>
</html>`;
}

// Nota: getDefaultTemplateString() ahora viene de pdfHelpers.js (importado al principio)

// Helper: Parsear template para extraer configuración y contenido
function parseTemplate(template) {
  const configMatch = template.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!configMatch) {
    return {
      config: { pageSize: 'A7', orientation: 'portrait', margins: 10 },
      content: template,
    };
  }

  const configStr = configMatch[1];
  const content = configMatch[2];

  const config = {
    pageSize: 'A7',
    orientation: 'portrait',
    margins: 10,
  };

  // Parsear líneas de configuración
  configStr.split('\n').forEach((line) => {
    const [key, value] = line.split(':').map(s => s.trim());
    if (key === 'pageSize') config.pageSize = value;
    if (key === 'orientation') config.orientation = value;
    if (key === 'margins') config.margins = parseInt(value, 10);
  });

  return { config, content };
}

// Helper: Crear PDFDocument con configuración personalizada
function createConfiguredPDFDoc(config) {
  const PDFDocument = require('pdfkit');

  // Mapa de tamaños estándares en puntos (ancho x alto)
  const standardSizes = {
    'A0': [2384, 3370],
    'A1': [1684, 2384],
    'A2': [1191, 1684],
    'A3': [842, 1191],
    'A4': [595, 842],
    'A5': [420, 595],
    'A6': [298, 420],
    'A7': [210, 298],
    'letter': [612, 792],
    'legal': [612, 1008],
  };

  let docConfig = {
    margin: config.margins,
  };

  if (config.pageSize.includes('x')) {
    // Tamaño personalizado: "100x150" (mm)
    const [w, h] = config.pageSize.split('x').map(v =>
      Math.round(parseInt(v, 10) * 72 / 25.4)
    );
    const [width, height] = config.orientation === 'landscape' ? [h, w] : [w, h];
    docConfig.size = [width, height];
  } else {
    // Tamaño estándar: A7, A6, A5, A4, etc.
    let [w, h] = standardSizes[config.pageSize] || [595, 842]; // Defecto A4
    if (config.orientation === 'landscape') {
      [w, h] = [h, w]; // Invertir dimensiones
    }
    docConfig.size = [w, h];
  }

  return new PDFDocument(docConfig);
}

// Helper: Renderizar HTML a PDF
function renderHTMLtoPDF(doc, html, config, startY) {
  let y = startY;
  const pageMargin = config.margins + 5;
  const pageWidth = doc.page.width - (config.margins * 2) - 10;

  // Parsear HTML simple
  const elements = parseHTMLSimple(html);

  elements.forEach((element) => {
    if (element.type === 'table') {
      y = renderTable(doc, element, config, y, pageWidth);
    } else if (element.type === 'paragraph') {
      y = renderParagraph(doc, element, config, y, pageMargin, pageWidth);
    } else if (element.type === 'text') {
      doc.fontSize(9).font('Helvetica').fillColor('#000');
      doc.text(element.content, pageMargin, y);
      y += 15;
    }
  });

  return y;
}

// Helper: Parsear HTML simple
function parseHTMLSimple(html) {
  const elements = [];

  // Detectar tablas
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let lastIndex = 0;
  let tableMatch;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    // Agregar texto antes de la tabla
    const textBefore = html.substring(lastIndex, tableMatch.index).trim();
    if (textBefore) {
      elements.push({ type: 'text', content: textBefore });
    }

    // Parsear tabla
    const tableContent = tableMatch[1];
    const rows = [];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;

    while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
      const cells = [];
      const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let cellMatch;

      while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
        const cellContent = cellMatch[1].trim();
        const widthMatch = cellMatch[0].match(/width="([^"]+)"/i);
        cells.push({
          content: stripHTML(cellContent),
          width: widthMatch ? widthMatch[1] : 'auto',
          isBold: cellContent.includes('<b>') || cellContent.includes('<strong>'),
        });
      }

      if (cells.length > 0) {
        rows.push(cells);
      }
    }

    if (rows.length > 0) {
      elements.push({ type: 'table', rows });
    }

    lastIndex = tableRegex.lastIndex;
  }

  // Agregar texto restante
  const textAfter = html.substring(lastIndex).trim();
  if (textAfter) {
    elements.push({ type: 'text', content: textAfter });
  }

  return elements;
}

// Helper: Renderizar tabla
function renderTable(doc, tableElement, config, startY, pageWidth) {
  let y = startY;
  const margin = config.margins + 5;
  const cellPadding = 5;

  // Calcular ancho de columnas
  const numCols = tableElement.rows[0]?.length || 1;
  const colWidths = calculateColumnWidths(tableElement.rows, pageWidth, numCols);

  // Renderizar filas
  tableElement.rows.forEach((row) => {
    let rowHeight = 20;
    const cellTexts = [];

    // Preparar contenido de celdas
    row.forEach((cell, colIdx) => {
      const cellWidth = colWidths[colIdx];
      doc.fontSize(cell.isBold ? 10 : 9);
      doc.font(cell.isBold ? 'Helvetica-Bold' : 'Helvetica');

      // Estimar altura de celda basado en ancho y contenido
      const lines = doc.heightOfString(cell.content, { width: cellWidth - cellPadding * 2 });
      rowHeight = Math.max(rowHeight, lines + cellPadding * 2);
      cellTexts.push({ text: cell.content, bold: cell.isBold });
    });

    // Renderizar celdas
    let x = margin;
    row.forEach((cell, colIdx) => {
      const cellWidth = colWidths[colIdx];

      // Borde de celda
      doc.strokeColor('#000').lineWidth(0.5);
      doc.rect(x, y, cellWidth, rowHeight).stroke();

      // Texto de celda
      doc.fontSize(cell.isBold ? 10 : 9);
      doc.font(cell.isBold ? 'Helvetica-Bold' : 'Helvetica');
      doc.fillColor('#000');
      doc.text(cell.content, x + cellPadding, y + cellPadding, {
        width: cellWidth - cellPadding * 2,
        height: rowHeight - cellPadding * 2,
        valign: 'top',
      });

      x += cellWidth;
    });

    y += rowHeight;
  });

  return y + 10;
}

// Helper: Calcular ancho de columnas
function calculateColumnWidths(rows, availableWidth, numCols) {
  const widths = new Array(numCols).fill(0);

  // Analizar widths especificados
  if (rows.length > 0) {
    rows[0].forEach((cell, idx) => {
      if (cell.width && cell.width !== 'auto') {
        if (cell.width.includes('%')) {
          widths[idx] = (parseInt(cell.width) / 100) * availableWidth;
        } else {
          widths[idx] = parseInt(cell.width);
        }
      }
    });
  }

  // Distribuir ancho restante
  const totalSpecified = widths.reduce((a, b) => a + b, 0);
  const autoColumns = widths.filter(w => w === 0).length;

  if (autoColumns > 0) {
    const remainingWidth = availableWidth - totalSpecified;
    const autoWidth = remainingWidth / autoColumns;
    widths.forEach((_, idx) => {
      if (widths[idx] === 0) widths[idx] = autoWidth;
    });
  }

  return widths;
}

// Helper: Renderizar párrafo
function renderParagraph(doc, element, config, y, margin, pageWidth) {
  doc.fontSize(9).font('Helvetica').fillColor('#000');
  doc.text(element.content, margin, y, { width: pageWidth });
  return y + 20;
}

// Helper: Remover tags HTML
function stripHTML(html) {
  return html.replace(/<[^>]*>/g, '').trim();
}
