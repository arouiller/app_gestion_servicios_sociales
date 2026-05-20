const db = require('../models');
const sequelize = require('../config/database');
const { Op, literal } = require('sequelize');
const logger = require('../utils/logger');

/**
 * POST /api/recibos/generar
 * Genera recibos para planes en un período específico
 * Body: { periodo: "2026-04-01", planes: [1, 2, 3], force: false }
 * Si planes está vacío, genera para todos los planes ACTIVO
 * Si force=true, borra recibos antiguos del período y regenera
 *
 * BACKLOG-079: Registra desglose de cuotas (cuota_social, arancel_por_servicio)
 */
exports.generar = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { periodo, planes, force, numeroInicialRecibo } = req.body;
    const userId = req.user.id;

    if (!periodo) {
      return res.status(400).json({
        error: 'El parámetro periodo es requerido',
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(periodo)) {
      return res.status(400).json({
        error: 'El período debe estar en formato YYYY-MM-DD',
      });
    }

    const periodoYYYYMM = periodo.substring(0, 7);
    const periodoNormalizado = `${periodoYYYYMM}-01`;

    const periodoExistente = await db.PeriodosRecibos.findOne({
      where: { periodo: periodoYYYYMM },
      transaction,
    });

    if (periodoExistente && !force) {
      await transaction.rollback();
      return res.status(409).json({
        success: false,
        existe: true,
        cantidad: periodoExistente.cantidad_recibos,
        mensaje: `Ya existen ${periodoExistente.cantidad_recibos} recibos generados para el período ${periodoYYYYMM}`,
      });
    }

    if (periodoExistente && force) {
      const recibosABorrar = await db.Recibo.findAll({
        where: { periodo: periodoNormalizado },
        attributes: ['id'],
        transaction,
      });

      const idsRecibos = recibosABorrar.map((r) => r.id);

      if (idsRecibos.length > 0) {
        await db.ReciboIntegrante.destroy({
          where: { recibo_id: idsRecibos },
          transaction,
        });
      }

      await db.Recibo.destroy({
        where: { periodo: periodoNormalizado },
        transaction,
      });
    }

    let planesAGenerar = [];
    if (!planes || planes.length === 0) {
      const todosPlanes = await db.PlanV1.findAll({
        where: { estado: 'ACTIVO' },
        raw: true,
        transaction,
      });
      planesAGenerar = todosPlanes.map((p) => p.plan_numero);
      logger.info(`[RECIBOS] Planes encontrados para ${periodoYYYYMM}: ${planesAGenerar.length}`);
    } else {
      planesAGenerar = planes;
      logger.info(`[RECIBOS] Planes especificados para ${periodoYYYYMM}: ${planesAGenerar.length}`);
    }

    const recibosGenerados = [];
    let reciboIndex = 0;

    logger.info(`[RECIBOS] Iniciando loop de generación para ${planesAGenerar.length} planes`);

    for (const planNumero of planesAGenerar) {
      try {
        if (!force) {
          const existente = await db.Recibo.findOne({
            where: { plan_numero: planNumero, periodo: periodoNormalizado },
            transaction,
          });

          if (existente) {
            logger.info(`[RECIBOS] Plan ${planNumero} ya tiene recibo para ${periodoYYYYMM}, omitiendo`);
            continue;
          }
        }

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
          logger.info(`[RECIBOS] Plan ${planNumero} no encontrado, omitiendo`);
          continue;
        }

        const integrantes = await db.PlanIntegrante.findAll({
          where: { plan_numero: planNumero },
          include: [{ model: db.Persona, attributes: ['id', 'apellido', 'nombre', 'tipo_documento', 'numero_documento', 'fecha_nacimiento', 'fecha_cobertura'] }],
          transaction,
        });

        const titular = integrantes.find((i) => i.rol === 'titular');
        if (!titular) {
          logger.info(`[RECIBOS] Plan ${planNumero} sin titular, omitiendo`);
          continue;
        }

        // BACKLOG-079: Obtener parámetro sistema valor_cuota_social
        const configApp = await db.ConfiguracionApp.findOne({
          attributes: ['valor_cuota_social'],
          where: {},
          transaction,
        });
        const cuotaSocial = parseFloat(configApp?.valor_cuota_social || 0);

        // BACKLOG-079: Calcular arancel por servicio
        const valorCuota = parseFloat(plan.valor_cuota || 0);
        const arancelPorServicio = valorCuota - cuotaSocial;

        // Crear recibo con 3 valores de desglose
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

        // BACKLOG-079: Log warning si arancel es negativo
        if (arancelPorServicio < 0) {
          logger.warn(
            `BACKLOG-079: arancel_por_servicio negativo en recibo. ` +
            `Plan: ${plan.numero_afiliado}, valor_cuota: ${valorCuota}, ` +
            `cuota_social: ${cuotaSocial}, arancel: ${arancelPorServicio}`
          );
        }

        reciboIndex++;

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

        logger.info(`[RECIBOS] Recibo creado para plan ${planNumero}, período ${periodoYYYYMM}`);
        recibosGenerados.push(recibo);
      } catch (err) {
        logger.error(`[RECIBOS ERROR] Error generando recibo para plan ${planNumero}:`, err.message);
        throw err;
      }
    }

    logger.info(`[RECIBOS] Total recibos generados: ${recibosGenerados.length} para período ${periodoYYYYMM}`);

    try {
      const [periodoRecord, creado] = await db.PeriodosRecibos.upsert(
        {
          periodo: periodoYYYYMM,
          cantidad_recibos: recibosGenerados.length,
          fecha_generacion: new Date(),
        },
        { transaction }
      );
      logger.info(`[RECIBOS] Upsert exitoso: ${creado ? 'creado' : 'actualizado'} registro para ${periodoYYYYMM}`);
    } catch (err) {
      logger.error(`[RECIBOS ERROR] Error en upsert de periodos_recibos:`, err.message);
      throw err;
    }

    logger.info(`[RECIBOS] Commiteando transacción...`);
    await transaction.commit();
    logger.info(`[RECIBOS] Transacción commiteada exitosamente`);

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
      if (periodo.length === 7) {
        const [year, month] = periodo.split('-');
        const firstDay = `${year}-${month}-01`;
        const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
        const lastDay = `${year}-${month}-${String(lastDayOfMonth).padStart(2, '0')}`;

        const firstDayNum = parseInt(firstDay.replace(/-/g, ''));
        const lastDayNum = parseInt(lastDay.replace(/-/g, ''));

        where[Op.and] = [
          literal(`CAST(DATE_FORMAT(\`periodo\`, '%Y%m%d') AS UNSIGNED) BETWEEN ${firstDayNum} AND ${lastDayNum}`)
        ];
      } else if (periodo.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(periodo)) {
        const periodoNum = parseInt(periodo.replace(/-/g, ''));
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
 * Lista todos los períodos con recibos generados
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
 * Obtiene el último aumento masivo realizado
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
 * Obtiene el número máximo de recibo registrado + 1
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
 */
exports.deletePeriodo = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { periodo } = req.params;

    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      return res.status(400).json({
        error: 'El período debe estar en formato YYYY-MM',
      });
    }

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

    await db.ReciboIntegrante.destroy({
      where: {
        recibo_id: {
          [Op.in]: recibosIds,
        },
      },
      transaction,
    });

    await db.Recibo.destroy({
      where: {
        periodo: {
          [Op.startsWith]: periodo,
        },
      },
      transaction,
    });

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
    logger.error('Error deleting recibos for period:', error);
    res.status(500).json({
      error: error.message || 'Error al eliminar recibos',
    });
  }
};

/**
 * GET /api/recibos/generar-pdf
 * Genera un PDF con todos los recibos de un período
 */
exports.generarPDF = async (req, res, next) => {
  try {
    const { periodo } = req.query;

    if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) {
      return res.status(400).json({
        error: 'El período debe estar en formato YYYY-MM',
      });
    }

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

    let templateDB = await db.ReciboTemplate.findOne({
      where: { activo: true },
    });

    const fullTemplate = templateDB?.html || getDefaultTemplateString();
    const { config, content } = parseTemplate(fullTemplate);

    const PDFDocument = require('pdfkit');
    let doc = createConfiguredPDFDoc(config);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recibos_${periodo}.pdf"`);

    doc.pipe(res);

    recibos.forEach((recibo, index) => {
      if (index > 0) {
        doc.addPage();
      }

      const numeroRecibo = recibo.numero_recibo ?? recibo.id;
      const numeroAfiliado = String(recibo.numero_afiliado).padStart(5, '0');
      const zonaCodigo = recibo.zona_codigo || '-';
      const localidad = recibo.localidad_nombre || '-';
      const valor = Number(recibo.valor_cuota).toFixed(2);

      let contentRendered = content
        .replace(/{{numero_recibo}}/g, numeroRecibo)
        .replace(/{{zona_codigo}}/g, zonaCodigo)
        .replace(/{{numero_afiliado}}/g, numeroAfiliado)
        .replace(/{{titular_apellido}}/g, recibo.titular_apellido)
        .replace(/{{titular_nombre}}/g, recibo.titular_nombre)
        .replace(/{{obra_social_nombre}}/g, recibo.obra_social_nombre)
        .replace(/{{tipo_de_grupo_nombre}}/g, recibo.tipo_de_grupo_nombre)
        .replace(/{{tipo_plan_nombre}}/g, recibo.tipo_plan_nombre)
        .replace(/{{localidad_nombre}}/g, localidad)
        .replace(/{{domicilio}}/g, recibo.domicilio || '-')
        .replace(/{{valor_cuota}}/g, `$${valor}`);

      let y = config.margins;
      if (contentRendered.includes('<')) {
        y = renderHTMLtoPDF(doc, contentRendered, config, y);
      } else {
        const lineHeight = 11;
        doc.fontSize(9).font('Helvetica').fillColor('#000');
        const lines = contentRendered.split('\n');
        lines.forEach((line) => {
          doc.text(line, config.margins + 5, y);
          y += lineHeight;
        });
      }
    });

    doc.end();
  } catch (error) {
    logger.error('Error generating PDF:', error);
    res.status(500).json({
      error: error.message || 'Error al generar PDF',
    });
  }
};

function getDefaultTemplateString() {
  return `---
pageSize: A7
orientation: portrait
margins: 10
---
<table>
  <tr>
    <td width="35%"><b>Recibo nro:</b></td>
    <td width="65%">{{numero_recibo}}</td>
  </tr>
  <tr>
    <td width="35%"><b>Afiliado:</b></td>
    <td width="65%">{{zona_codigo}} - {{numero_afiliado}}</td>
  </tr>
  <tr>
    <td width="35%"><b>Titular:</b></td>
    <td width="65%">{{titular_apellido}}, {{titular_nombre}}</td>
  </tr>
  <tr>
    <td width="35%"><b>Obra social:</b></td>
    <td width="65%">{{obra_social_nombre}}</td>
  </tr>
  <tr>
    <td width="35%"><b>Tipo de grupo:</b></td>
    <td width="65%">{{tipo_de_grupo_nombre}}</td>
  </tr>
  <tr>
    <td width="35%"><b>Tipo de plan:</b></td>
    <td width="65%">{{tipo_plan_nombre}}</td>
  </tr>
  <tr>
    <td width="35%"><b>Localidad:</b></td>
    <td width="65%">{{localidad_nombre}}</td>
  </tr>
  <tr>
    <td width="35%"><b>Domicilio:</b></td>
    <td width="65%">{{domicilio}}</td>
  </tr>
  <tr>
    <td width="35%"><b>Monto total:</b></td>
    <td width="65%">{{valor_cuota}}</td>
  </tr>
</table>`;
}

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

  configStr.split('\n').forEach((line) => {
    const [key, value] = line.split(':').map(s => s.trim());
    if (key === 'pageSize') config.pageSize = value;
    if (key === 'orientation') config.orientation = value;
    if (key === 'margins') config.margins = parseInt(value, 10);
  });

  return { config, content };
}

function createConfiguredPDFDoc(config) {
  const PDFDocument = require('pdfkit');

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
    const [w, h] = config.pageSize.split('x').map(v =>
      Math.round(parseInt(v, 10) * 72 / 25.4)
    );
    const [width, height] = config.orientation === 'landscape' ? [h, w] : [w, h];
    docConfig.size = [width, height];
  } else {
    let [w, h] = standardSizes[config.pageSize] || [595, 842];
    if (config.orientation === 'landscape') {
      [w, h] = [h, w];
    }
    docConfig.size = [w, h];
  }

  return new PDFDocument(docConfig);
}

function renderHTMLtoPDF(doc, html, config, startY) {
  let y = startY;
  const pageMargin = config.margins + 5;
  const pageWidth = doc.page.width - (config.margins * 2) - 10;

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

function parseHTMLSimple(html) {
  const elements = [];

  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let lastIndex = 0;
  let tableMatch;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const textBefore = html.substring(lastIndex, tableMatch.index).trim();
    if (textBefore) {
      elements.push({ type: 'text', content: textBefore });
    }

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

  const textAfter = html.substring(lastIndex).trim();
  if (textAfter) {
    elements.push({ type: 'text', content: textAfter });
  }

  return elements;
}

function renderTable(doc, tableElement, config, startY, pageWidth) {
  let y = startY;
  const margin = config.margins + 5;
  const cellPadding = 5;

  const numCols = tableElement.rows[0]?.length || 1;
  const colWidths = calculateColumnWidths(tableElement.rows, pageWidth, numCols);

  tableElement.rows.forEach((row) => {
    let rowHeight = 20;
    const cellTexts = [];

    row.forEach((cell, colIdx) => {
      const cellWidth = colWidths[colIdx];
      doc.fontSize(cell.isBold ? 10 : 9);
      doc.font(cell.isBold ? 'Helvetica-Bold' : 'Helvetica');

      const lines = doc.heightOfString(cell.content, { width: cellWidth - cellPadding * 2 });
      rowHeight = Math.max(rowHeight, lines + cellPadding * 2);
      cellTexts.push({ text: cell.content, bold: cell.isBold });
    });

    let x = margin;
    row.forEach((cell, colIdx) => {
      const cellWidth = colWidths[colIdx];

      doc.strokeColor('#000').lineWidth(0.5);
      doc.rect(x, y, cellWidth, rowHeight).stroke();

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

function calculateColumnWidths(rows, availableWidth, numCols) {
  const widths = new Array(numCols).fill(0);

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

function renderParagraph(doc, element, config, y, margin, pageWidth) {
  doc.fontSize(9).font('Helvetica').fillColor('#000');
  doc.text(element.content, margin, y, { width: pageWidth });
  return y + 20;
}

function stripHTML(html) {
  return html.replace(/<[^>]*>/g, '').trim();
}
