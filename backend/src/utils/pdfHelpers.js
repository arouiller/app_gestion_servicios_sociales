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
 * Retorna un template por defecto minimalista
 * Usado cuando no hay template personalizado en la BD
 */
function getDefaultTemplateString() {
  return `---
pageSize: A4
orientation: portrait
margins: 20
---
<style>
  body {
    font-family: Arial, sans-serif;
    font-size: 12px;
    line-height: 1.6;
  }
  .container {
    border: 1px solid #333;
    padding: 20px;
    margin-bottom: 10px;
  }
  .title {
    font-size: 18px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 20px;
  }
  .info {
    margin-bottom: 15px;
  }
  .row {
    display: flex;
    margin-bottom: 10px;
  }
  .label {
    font-weight: bold;
    width: 200px;
  }
  .value {
    flex: 1;
  }
</style>

<div class="container">
  <div class="title">TEMPLATE POR DEFECTO</div>
  <div class="info">
    <div class="row">
      <div class="label">Número de Afiliado:</div>
      <div class="value">{{numero_afiliado}}</div>
    </div>
    <div class="row">
      <div class="label">Nombre:</div>
      <div class="value">{{titular_apellido}}, {{titular_nombre}}</div>
    </div>
    <div class="row">
      <div class="label">Valor Cuota:</div>
      <div class="value">{{valor_cuota}}</div>
    </div>
  </div>
</div>`;
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
};
