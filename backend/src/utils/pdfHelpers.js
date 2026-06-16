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
 * Cada bloque está posicionado de forma absoluta usando coordenadas x, y, width, height
 * Usado cuando se genera PDF de recibos con template personalizado
 */
function serializeTemplateBlocks(template) {
  if (!template) {
    return getDefaultTemplateString();
  }

  const pageConfig = template.bloque_pageconfig || {};
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

  let html = `---
pageSize: ${pageSize}
orientation: ${orientation}
margins: ${margins}
---

<style>
  body {
    font-family: Arial, sans-serif;
    font-size: 12px;
    margin: 0;
    padding: 0;
  }

  .recibo-page {
    position: relative;
    width: ${dimensions.width}mm;
    height: ${dimensions.height}mm;
    box-sizing: border-box;
    overflow: hidden;
    page-break-after: always;
  }

  .bloque-dinamico {
    position: absolute;
    overflow: hidden;
    box-sizing: border-box;
  }

  .bloque-dinamico p {
    margin: 0;
    padding: 2mm;
  }

  .bloque-dinamico table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10px;
  }

  .bloque-dinamico th,
  .bloque-dinamico td {
    border: 1px solid #ddd;
    padding: 1mm;
    text-align: left;
  }

  .negativo {
    background-color: #fff3cd;
    color: #856404;
  }
</style>

<div class="recibo-page">
`;

  // Renderizar cada bloque dinámico con su posicionamiento
  bloques.forEach(bloque => {
    const left = bloque.x || 0;
    const top = bloque.y || 0;
    const width = bloque.width || 100;
    const height = bloque.height || 50;
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
    'numero_recibo', 'numero_afiliado', 'zona_codigo',
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
};
