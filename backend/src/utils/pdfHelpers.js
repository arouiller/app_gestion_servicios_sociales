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
 * Retorna el template por defecto actualizado con desglose de cuotas
 */
function getDefaultTemplateString() {
  return `---
pageSize: A4
orientation: portrait
margins: 20
---
<style>
  .recibo-desglose {
    width: 100%;
    margin-top: 15px;
    padding: 12px;
    background: #f9f9f9;
    border-left: 4px solid #2c3e50;
    border-collapse: collapse;
    font-size: 12px;
  }

  .recibo-desglose tr {
    border-bottom: 1px solid #e0e0e0;
  }

  .recibo-desglose td {
    padding: 8px 10px;
  }

  .desglose-label {
    text-align: left;
    font-weight: 500;
    width: 70%;
  }

  .desglose-value {
    text-align: right;
    font-weight: 600;
    font-family: 'Courier New', monospace;
    color: #27ae60;
  }

  .desglose-arancel.negativo {
    background: #fff3cd;
    color: #856404;
  }

  .desglose-arancel.negativo .desglose-value {
    color: #856404;
  }

  .desglose-total {
    border-top: 2px solid #2c3e50;
    background: #f0f7ff;
  }

  .desglose-total .desglose-value {
    color: #2c3e50;
    font-size: 13px;
  }

  .page-break-internal {
    height: 10px;
    border-bottom: 1px dashed #ccc;
    margin: 10px 0;
  }

  .page-break {
    page-break-after: always;
    margin: 20px 0;
  }

  .recibo-item {
    page-break-inside: avoid;
  }
</style>

<div class="recibo-item">
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
  </table>

  <table class="recibo-desglose">
    <tr>
      <td class="desglose-label">Cuota Social</td>
      <td class="desglose-value">{{cuota_social}}</td>
    </tr>
    <tr class="desglose-arancel {{arancel_negativo_class}}">
      <td class="desglose-label">Arancel por Servicio</td>
      <td class="desglose-value">{{arancel_por_servicio}}{{arancel_warning_icon}}</td>
    </tr>
    <tr class="desglose-total">
      <td class="desglose-label"><strong>Valor Total Cuota</strong></td>
      <td class="desglose-value"><strong>{{valor_cuota}}</strong></td>
    </tr>
  </table>
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
    'arancel_bg', 'arancel_color'
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
