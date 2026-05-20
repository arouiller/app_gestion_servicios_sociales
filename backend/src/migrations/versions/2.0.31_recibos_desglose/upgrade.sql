-- BACKLOG-080: Migración 2.0.31 - Template de recibos con desglose de cuotas y layout 2-per-page

-- Insertar nuevo template con desglose de cuotas
INSERT INTO recibo_templates (nombre, version, activo, usuario_id, descripcion, html)
VALUES (
  'Recibo Estándar 2026 v2 - Con Desglose',
  2,
  true,
  1,
  'Template 2.0.31: Incluye desglose de cuotas (cuota_social, arancel_por_servicio) y layout 2-per-page',
  CONCAT(
    '---\n',
    'pageSize: A4\n',
    'orientation: portrait\n',
    'margins: 20\n',
    '---\n',
    '<style>\n',
    '  body { font-family: Arial, sans-serif; }\n',
    '  .recibo-item { page-break-inside: avoid; margin-bottom: 20px; }\n',
    '  table { width: 100%; border-collapse: collapse; margin: 0 0 15px 0; }\n',
    '  table tr { border-bottom: 1px solid #ddd; }\n',
    '  table td { padding: 8px; }\n',
    '  .recibo-desglose { width: 100%; margin-top: 15px; padding: 12px; background: #f9f9f9; border-left: 4px solid #2c3e50; border-collapse: collapse; font-size: 12px; }\n',
    '  .recibo-desglose tr { border-bottom: 1px solid #e0e0e0; }\n',
    '  .recibo-desglose td { padding: 8px 10px; }\n',
    '  .desglose-label { text-align: left; font-weight: 500; width: 70%; }\n',
    '  .desglose-value { text-align: right; font-weight: 600; font-family: monospace; color: #27ae60; }\n',
    '  .desglose-arancel.negativo { background: #fff3cd; color: #856404; }\n',
    '  .desglose-arancel.negativo .desglose-value { color: #856404; }\n',
    '  .desglose-total { border-top: 2px solid #2c3e50; background: #f0f7ff; }\n',
    '  .desglose-total .desglose-value { color: #2c3e50; font-size: 13px; }\n',
    '</style>\n',
    '<div class="recibo-item">\n',
    '  <table>\n',
    '    <tr><td width="35%"><b>Recibo nro:</b></td><td width="65%">{{numero_recibo}}</td></tr>\n',
    '    <tr><td width="35%"><b>Afiliado:</b></td><td width="65%">{{zona_codigo}} - {{numero_afiliado}}</td></tr>\n',
    '    <tr><td width="35%"><b>Titular:</b></td><td width="65%">{{titular_apellido}}, {{titular_nombre}}</td></tr>\n',
    '    <tr><td width="35%"><b>Obra social:</b></td><td width="65%">{{obra_social_nombre}}</td></tr>\n',
    '    <tr><td width="35%"><b>Tipo de grupo:</b></td><td width="65%">{{tipo_de_grupo_nombre}}</td></tr>\n',
    '    <tr><td width="35%"><b>Tipo de plan:</b></td><td width="65%">{{tipo_plan_nombre}}</td></tr>\n',
    '    <tr><td width="35%"><b>Localidad:</b></td><td width="65%">{{localidad_nombre}}</td></tr>\n',
    '    <tr><td width="35%"><b>Domicilio:</b></td><td width="65%">{{domicilio}}</td></tr>\n',
    '  </table>\n',
    '  <table class="recibo-desglose">\n',
    '    <tr>\n',
    '      <td class="desglose-label">Cuota Social</td>\n',
    '      <td class="desglose-value">{{cuota_social}}</td>\n',
    '    </tr>\n',
    '    <tr class="desglose-arancel {{arancel_negativo_class}}">\n',
    '      <td class="desglose-label">Arancel por Servicio</td>\n',
    '      <td class="desglose-value">{{arancel_por_servicio}}{{arancel_warning_icon}}</td>\n',
    '    </tr>\n',
    '    <tr class="desglose-total">\n',
    '      <td class="desglose-label"><strong>Valor Total Cuota</strong></td>\n',
    '      <td class="desglose-value"><strong>{{valor_cuota}}</strong></td>\n',
    '    </tr>\n',
    '  </table>\n',
    '</div>'
  )
);

-- Desactivar template anterior (v1)
UPDATE recibo_templates
SET activo = false
WHERE nombre = 'Recibo Estándar 2026' AND version = 1;
