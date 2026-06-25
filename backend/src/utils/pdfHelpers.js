/**
 * PDF Helper Functions para generación de recibos con desglose (BACKLOG-080)
 */

/**
 * Formatea un número como moneda ($X.XX)
 */
function formatCurrency(value) {
  const num = parseFloat(value || 0);
  return `$${num.toFixed(2)}`;
}

/**
 * Reemplaza un placeholder con su valor del recibo, formateado correctamente
 */
function replacePlaceholder(placeholder, recibo) {
  const key = placeholder.replace(/{{|}}/g, '');
  const value = recibo[key];

  // Placeholders de moneda: formatea como $X.XX
  if (placeholder === '{{cuota_social}}' ||
      placeholder === '{{arancel_por_servicio}}' ||
      placeholder === '{{valor_cuota}}') {
    return formatCurrency(value);
  }

  return String(value || '');
}

/**
 * Detecta si el arancel por servicio es negativo
 */
function detectNegativeArancel(arancel) {
  return parseFloat(arancel || 0) < 0;
}

/**
 * Retorna clase CSS "negativo" si arancel < 0, vacío en otro caso
 */
function getArancelCSSClass(arancel) {
  return parseFloat(arancel || 0) < 0 ? 'negativo' : '';
}

/**
 * Retorna símbolo ⚠️ si arancel < 0, vacío en otro caso
 */
function getArancelWarningIcon(arancel) {
  return parseFloat(arancel || 0) < 0 ? '⚠️' : '';
}

/**
 * Agrupa recibos en pares para layout 2-per-page
 * Retorna array de arrays: [[rec1, rec2], [rec3, rec4], [rec5], ...]
 */
function groupRecibosInPairs(recibos) {
  const pairs = [];
  for (let i = 0; i < recibos.length; i += 2) {
    if (i + 1 < recibos.length) {
      pairs.push([recibos[i], recibos[i + 1]]);
    } else {
      pairs.push([recibos[i]]);
    }
  }
  return pairs;
}

/**
 * Valida que cuota_social + arancel_por_servicio ≈ valor_cuota
 * Tolerancia: 0.01
 */
function validateReciboInvariant(recibo) {
  const cuotaSocial = parseFloat(recibo.cuota_social || 0);
  const arancelPorServicio = parseFloat(recibo.arancel_por_servicio || 0);
  const valorCuota = parseFloat(recibo.valor_cuota || 0);

  const suma = cuotaSocial + arancelPorServicio;
  const diferencia = Math.abs(suma - valorCuota);

  return diferencia <= 0.01;
}

/**
 * Retorna template HTML por defecto si no hay template en BD
 */
function getDefaultTemplateString() {
  return `---
pageSize: A4
orientation: portrait
margins: 10
---

<style>
  body {
    font-family: Arial, sans-serif;
    font-size: 12px;
  }

  .recibo-container {
    border: 1px solid #ccc;
    padding: 15mm;
    height: 190mm;
    box-sizing: border-box;
    position: relative;
  }

  .recibo-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10mm;
    border-bottom: 1px solid #000;
    padding-bottom: 5mm;
  }

  .recibo-info {
    flex: 1;
  }

  .recibo-numero {
    text-align: right;
    font-weight: bold;
    font-size: 14px;
  }

  .titular-info {
    margin-bottom: 5mm;
  }

  .titular-info strong {
    margin-right: 5mm;
  }

  .desglose {
    margin-top: 20mm;
    border-top: 1px solid #000;
    padding-top: 5mm;
  }

  .desglose-row {
    display: flex;
    justify-content: space-between;
    padding: 3mm 0;
  }

  .negativo {
    background-color: #fff3cd;
    color: #856404;
    padding: 3mm;
  }
</style>

<div class="recibo-container">
  <div class="recibo-header">
    <div class="recibo-info">
      <div><strong>Afiliado:</strong> {{numero_afiliado}}</div>
      <div><strong>O.S.:</strong> {{obra_social_nombre}}</div>
    </div>
    <div class="recibo-numero">
      Recibo Nº {{numero_recibo}}
    </div>
  </div>

  <div class="titular-info">
    <div><strong>Titular:</strong> {{titular_apellido}}, {{titular_nombre}}</div>
    <div><strong>Período:</strong> {{periodo}}</div>
  </div>

  <div class="desglose">
    <div class="desglose-row">
      <span>Valor Cuota:</span>
      <span><strong>{{valor_cuota}}</strong></span>
    </div>
    <div class="desglose-row">
      <span>Cuota Social:</span>
      <span>{{cuota_social}}</span>
    </div>
    <div class="desglose-row {{arancel_negativo_class}}">
      <span>Arancel por Servicio: {{arancel_warning_icon}}</span>
      <span>{{arancel_por_servicio}}</span>
    </div>
  </div>
</div>
`;
}

/**
 * Serializa bloques dinámicos de ReciboTemplate a string HTML con placeholders
 * Renderiza UN SOLO recibo con posicionamiento absoluto de bloques
 * Aplica scaleFactor a coordenadas cuando hay múltiples recibos por página
 * Múltiples recibos por página se manejan en recibosController.js
 * Usado cuando se genera PDF de recibos con template personalizado
 *
 * @param {Object} template - ReciboTemplate con bloques dinámicos
 * @param {Number} scaleFactor - Factor de escala (1.0 = sin escala, 0.5 = mitad de tamaño)
 */
function serializeTemplateBlocks(template, scaleFactor = 1.0) {
  if (!template) {
    return getDefaultTemplateString();
  }

  let pageConfig = template.bloque_pageconfig || {};

  // Manejar defensivamente pageConfig corrupto (array de caracteres)
  if (typeof pageConfig === 'object' && pageConfig !== null && !pageConfig.tamaño) {
    try {
      if (Array.isArray(pageConfig)) {
        pageConfig = {};
      } else if (typeof pageConfig === 'string') {
        pageConfig = JSON.parse(pageConfig);
      }
    } catch (e) {
      pageConfig = {};
    }
  }

  const pageSize = pageConfig.tamaño || 'A4';
  const orientation = pageConfig.orientacion || 'portrait';
  const margins = pageConfig.margen_superior_mm || 10;
  const bloques = template.bloques || [];

  // Si no hay bloques dinámicos, retornar template por defecto
  if (!Array.isArray(bloques) || bloques.length === 0) {
    return getDefaultTemplateString();
  }

  // Dimensiones de página en mm
  const pageDimensions = {
    'A4': { width: 210, height: 297 },
    'A5': { width: 148, height: 210 },
    'Letter': { width: 215.9, height: 279.4 }
  };

  const dimensions = pageDimensions[pageSize] || pageDimensions['A4'];

  // Aplicar escala a dimensiones de página
  const scaledHeight = dimensions.height * scaleFactor;

  let html = `---
pageSize: ${pageSize}
orientation: ${orientation}
margins: ${margins}
---

<style>
  body {
    font-family: Arial, sans-serif;
    font-size: 11px;
    margin: 0;
    padding: 0;
  }

  .recibo-page {
    position: relative;
    width: ${dimensions.width}mm;
    height: ${scaledHeight}mm;
    box-sizing: border-box;
    overflow: hidden;
  }

  .bloque-dinamico {
    position: absolute;
    overflow: hidden;
    box-sizing: border-box;
  }

  .bloque-dinamico p {
    margin: 0;
    padding: 1mm;
    font-size: inherit;
  }

  .bloque-dinamico table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9px;
  }

  .bloque-dinamico th,
  .bloque-dinamico td {
    border: 1px solid #ddd;
    padding: 0.5mm;
    text-align: left;
  }

  .negativo {
    background-color: #fff3cd;
    color: #856404;
  }
</style>

<div class="recibo-page">
`;

  // Renderizar cada bloque dinámico con su posicionamiento escalado
  bloques.forEach(bloque => {
    const left = (bloque.x || 0) * scaleFactor;
    const top = (bloque.y || 0) * scaleFactor;
    const width = (bloque.width || 100) * scaleFactor;
    const height = (bloque.height || 50) * scaleFactor;
    const contenido = bloque.contenido || '';

    html += `<div class="bloque-dinamico" style="left: ${left}mm; top: ${top}mm; width: ${width}mm; height: ${height}mm;">
  ${contenido}
</div>
`;
  });

  html += `</div>`;

  return html;
}

/**
 * Reemplaza todos los placeholders en un string HTML con valores del recibo
 * Los valores ya vienen formateados desde renderRecibo(), no reformatear
 */
function replaceAllPlaceholders(html, recibo) {
  let result = html;

  const placeholders = [
    'numero_recibo', 'numero_afiliado', 'zona_codigo', 'zona_nombre',
    'titular_apellido', 'titular_nombre',
    'obra_social_nombre', 'tipo_de_grupo_nombre', 'tipo_plan_nombre',
    'localidad_nombre', 'domicilio',
    'valor_cuota', 'cuota_social', 'arancel_por_servicio',
    'arancel_negativo_class', 'arancel_warning_icon',
    'arancel_bg', 'arancel_color',
    'fecha_nacimiento', 'fecha_cobertura', 'numero_documento', 'periodo'
  ];

  placeholders.forEach((placeholder) => {
    const key = placeholder;
    let value = recibo[key] || '';

    // NO reformatear valores que ya vienen formateados desde renderRecibo()
    // Solo usar el valor tal como viene

    const regex = new RegExp(`{{${placeholder}}}`, 'g');
    result = result.replace(regex, value);
  });

  return result;
}

/**
 * Genera un PDF con múltiples páginas (cada página con N recibos)
 * @param {String} fullHTML - HTML completo con todas las páginas
 * @param {String} pageSize - Tamaño de página (A4, A5, Letter)
 * @param {String} orientation - Orientación (portrait, landscape)
 * @param {Number} margins - Márgenes en mm
 * @returns {Promise<Buffer>} - Buffer del PDF completo
 */
async function generateMultiPagePDF(fullHTML, pageSize, orientation, margins) {
  const pdf = require('html-pdf');

  const htmlCompleto = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
    }
    .page {
      page-break-after: always;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    .page:last-child {
      page-break-after: avoid;
    }
  </style>
</head>
<body>
  ${fullHTML}
</body>
</html>`;

  return new Promise((resolve, reject) => {
    // Mapear dimensiones de página en mm (A4: 210×297, A5: 148×210, Letter: 215.9×279.4)
    const pageDimensions = {
      'A4': { width: 210, height: 297 },
      'A5': { width: 148, height: 210 },
      'LETTER': { width: 215.9, height: 279.4 }
    };

    const dims = pageDimensions[pageSize.toUpperCase()] || pageDimensions['A4'];

    const options = {
      // Especificar dimensiones exactas en mm en lugar de usar 'format'
      // Esto evita que html-pdf auto-escale la página
      width: `${dims.width}mm`,
      height: `${dims.height}mm`,
      orientation: orientation || 'portrait',
      margin: `${margins || 0}mm`,
      type: 'pdf'
    };

    pdf.create(htmlCompleto, options).toBuffer((err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer);
      }
    });
  });
}

/**
 * Genera HTML de tabla con placeholders (sin estructura de página)
 * Respeta las alturas configuradas en el template
 * Envuelve la tabla en un borde externo con dimensiones explícitas
 * @param {Object} tablaData - Objeto tabla con filas y celdas
 * @param {Number} tablaAncho - Ancho de tabla en mm (opcional)
 * @param {Number} tablaAlto - Alto de tabla en mm (opcional)
 */
function generateTableHTML(tablaData, tablaAncho = null, tablaAlto = null) {
  if (!tablaData) return '';

  const SCALE_FACTOR = 0.762; // Compensar scaling de html-pdf
  const borderStyle = tablaData.bordeTabla ? '1px solid #000' : 'none';
  const anchoTotalMM = tablaData.anchoTotal_mm || 170; // Ancho total en mm
  const fontSize = Math.round((tablaData.tamanoFuente || 11) * SCALE_FACTOR);
  const paddingPx = Math.round(4 * SCALE_FACTOR);

  // Tabla raíz: una fila por "fila lógica", cada fila tiene 1 celda que contiene una tabla interna
  const filasHTML = tablaData.filas
    .map(fila => {
      const alturaOriginal = fila.altura || 15;
      const alturaEscalada = (alturaOriginal * SCALE_FACTOR).toFixed(2);

      // Tabla interna: 1 fila, M columnas con anchos independientes
      const celdasHTML = fila.celdas
        .map(celda => {
          const anchoMM = celda.ancho_mm || celda.ancho;
          const anchoPorcentaje = (anchoMM / anchoTotalMM) * 100;
          return `<td style="width: ${anchoPorcentaje}%; border: ${borderStyle}; padding: ${paddingPx}px; vertical-align: top; overflow: hidden; white-space: pre-wrap; word-break: break-word; box-sizing: border-box;">${celda.contenido || ''}</td>`;
        })
        .join('');

      const tablaInternaHTML = `<table style="width: 100%; height: 100%; border-collapse: collapse; table-layout: fixed; border: ${borderStyle};">
<tbody>
<tr style="height: 100%;">
${celdasHTML}
</tr>
</tbody>
</table>`;

      // Celda de la tabla raíz contiene la tabla interna
      return `<tr>
<td style="padding: 0; border: ${borderStyle}; width: 100%; height: ${alturaEscalada}mm; vertical-align: top; box-sizing: border-box;">
${tablaInternaHTML}
</td>
</tr>`;
    })
    .join('');

  const tableHTML = `<table style="width: 100%; border-collapse: collapse; font-size: ${fontSize}px; font-family: Arial, sans-serif; height: 100%; border: ${borderStyle};">
<tbody>
${filasHTML}
</tbody>
</table>`;

  // Envolver la tabla en un div con dimensiones explícitas
  // Reducir ancho 2mm para dejar espacio al borde y evitar corte
  const marginMM = 1 * SCALE_FACTOR;
  const finalAncho = tablaAncho ? ((tablaAncho - 2) * SCALE_FACTOR) : null;
  const finalAlto = tablaAlto ? tablaAlto : null; // No escalar alto - mantener altura original del recibo
  const wrapperWidth = finalAncho ? `${finalAncho.toFixed(2)}mm` : '100%';
  const wrapperHeight = finalAlto ? `${finalAlto}mm` : 'auto';
  const wrapperBorder = tablaData.bordeTabla ? '1px solid #000' : 'none';

  const alignStyles = `
    <style>
      .ql-align-center { text-align: center !important; }
      .ql-align-right { text-align: right !important; }
      .ql-align-justify { text-align: justify !important; }
      .ql-align-left { text-align: left !important; }
    </style>
  `;

  return `${alignStyles}
<div style="border: ${wrapperBorder}; box-sizing: border-box; width: ${wrapperWidth}; height: ${wrapperHeight}; margin-left: ${marginMM.toFixed(2)}mm; margin-right: ${marginMM.toFixed(2)}mm; overflow: hidden;">
${tableHTML}
</div>`;
}

/**
 * Serializa un template de tabla (type: 'tabla') a HTML con header de config
 * Devuelve UN SOLO template de tabla que se replica para cada recibo
 * @param {Object} template - ReciboTemplate con bloques[0].type === 'tabla'
 */
function serializeTemplateTable(template) {
  if (!template) {
    return getDefaultTemplateString();
  }

  const bloques = template.bloques || [];
  const tablaData = bloques[0]?.type === 'tabla' ? bloques[0] : null;

  if (!tablaData) {
    return serializeTemplateBlocks(template, 1);
  }

  let pageConfig = template.bloque_pageconfig || {};

  // Manejar defensivamente pageConfig corrupto
  if (typeof pageConfig === 'object' && pageConfig !== null && !pageConfig.tamaño) {
    try {
      if (Array.isArray(pageConfig)) {
        pageConfig = {};
      } else if (typeof pageConfig === 'string') {
        pageConfig = JSON.parse(pageConfig);
      }
    } catch (e) {
      pageConfig = {};
    }
  }

  const pageSize = pageConfig.tamaño || 'A4';
  const orientation = pageConfig.orientacion || 'portrait';
  const tableHTML = generateTableHTML(tablaData, tablaData.anchoTotal_mm, tablaData.altoTotal_mm);

  const html = `---
pageSize: ${pageSize}
orientation: ${orientation}
margins: 0
---

<style>
  * {
    margin: 0;
    padding: 0;
  }
  body {
    font-family: Arial, sans-serif;
    font-size: 11px;
  }
  .page {
    page-break-after: always;
    margin: 0;
    padding: 0;
  }
  .page:last-child {
    page-break-after: avoid;
  }
</style>

${tableHTML}`;

  return html;
}

/**
 * Postprocesamiento: Remover páginas pares de un PDF
 * Útil para eliminar páginas en blanco que html-pdf genera entre contenido
 * Ej: PDF con páginas 1(contenido), 2(blanco), 3(contenido), 4(blanco)
 *     Retorna PDF con solo páginas 1, 3, 5, etc.
 * @param {Buffer} pdfBuffer - Buffer del PDF generado
 * @returns {Promise<Buffer>} - Buffer del PDF con páginas pares removidas
 */
async function removirPaginasPares(pdfBuffer) {
  const { PDFDocument } = require('pdf-lib');

  try {
    // Cargar el PDF desde el buffer
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const totalPages = pdfDoc.getPageCount();

    console.log(`[PDF] Postprocesamiento: PDF original tiene ${totalPages} páginas`);

    // Recolectar índices de páginas a remover (pares: 1, 3, 5, ...)
    const indicesToRemove = [];
    for (let i = 1; i < totalPages; i += 2) {
      indicesToRemove.push(i);
    }

    // Remover páginas en orden inverso (para no afectar índices)
    for (let i = indicesToRemove.length - 1; i >= 0; i--) {
      pdfDoc.removePage(indicesToRemove[i]);
      console.log(`[PDF] Removida página ${indicesToRemove[i] + 1}`);
    }

    const finalPageCount = pdfDoc.getPageCount();
    console.log(`[PDF] Postprocesamiento completado: ${totalPages} → ${finalPageCount} páginas`);

    // Guardar el PDF modificado a buffer
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (err) {
    console.error('[PDF] Error en postprocesamiento:', err);
    // Si falla, retornar el PDF original
    return pdfBuffer;
  }
}

module.exports = {
  formatCurrency,
  replacePlaceholder,
  replaceAllPlaceholders,
  detectNegativeArancel,
  getArancelCSSClass,
  getArancelWarningIcon,
  groupRecibosInPairs,
  validateReciboInvariant,
  getDefaultTemplateString,
  serializeTemplateBlocks,
  serializeTemplateTable,
  generateTableHTML,
  generateMultiPagePDF,
  removirPaginasPares,
};
