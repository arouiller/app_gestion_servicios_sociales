-- BACKLOG-080: Migración 2.0.31 - Template de recibos con desglose de cuotas y layout 2-per-page

-- Insertar nuevo template con desglose de cuotas
INSERT INTO recibo_templates (nombre, version, activo, usuario_id, descripcion, html)
VALUES (
  'Recibo Estándar 2026 v2 - Con Desglose',
  2,
  true,
  1,
  'Template 2.0.31: Incluye desglose de cuotas (cuota_social, arancel_por_servicio) y layout 2-per-page',
  '---
pageSize: A4
orientation: portrait
margins: 20
---
<style>
  body { font-family: Arial, sans-serif; }

  .recibo-item {
    page-break-inside: avoid;
    margin-bottom: 20px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 15px 0;
  }

  table tr {
    border-bottom: 1px solid #ddd;
  }

  table td {
    padding: 8px;
  }

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
    font-family: "Courier New", monospace;
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
</div>'
);

-- Desactivar template anterior (v1)
UPDATE recibo_templates
SET activo = false
WHERE nombre = 'Recibo Estándar 2026' AND version = 1;
