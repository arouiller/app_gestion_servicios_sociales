-- Create recibo_templates table for storing HTML templates
CREATE TABLE IF NOT EXISTS recibo_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  html LONGTEXT NOT NULL,
  version INT DEFAULT 1,
  activo BOOLEAN DEFAULT false,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  usuario_id INT NOT NULL,
  descripcion TEXT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_activo (activo),
  INDEX idx_usuario_id (usuario_id)
);

-- Insert default template with HTML table layout
DELETE FROM recibo_templates WHERE nombre = 'Recibo Estándar 2026';
INSERT INTO recibo_templates (nombre, version, activo, usuario_id, descripcion, html)
VALUES (
  'Recibo Estándar 2026',
  1,
  true,
  1,
  'Template por defecto para generación de recibos en PDF',
  '---\npageSize: A7\norientation: portrait\nmargins: 10\n---\n<table>\n  <tr>\n    <td width="35%"><b>Recibo nro:</b></td>\n    <td width="65%">{{numero_recibo}}</td>\n  </tr>\n  <tr>\n    <td width="35%"><b>Afiliado:</b></td>\n    <td width="65%">{{zona_codigo}} - {{numero_afiliado}}</td>\n  </tr>\n  <tr>\n    <td width="35%"><b>Titular:</b></td>\n    <td width="65%">{{titular_apellido}}, {{titular_nombre}}</td>\n  </tr>\n  <tr>\n    <td width="35%"><b>Obra social:</b></td>\n    <td width="65%">{{obra_social_nombre}}</td>\n  </tr>\n  <tr>\n    <td width="35%"><b>Tipo de grupo:</b></td>\n    <td width="65%">{{tipo_de_grupo_nombre}}</td>\n  </tr>\n  <tr>\n    <td width="35%"><b>Tipo de plan:</b></td>\n    <td width="65%">{{tipo_plan_nombre}}</td>\n  </tr>\n  <tr>\n    <td width="35%"><b>Localidad:</b></td>\n    <td width="65%">{{localidad_nombre}}</td>\n  </tr>\n  <tr>\n    <td width="35%"><b>Domicilio:</b></td>\n    <td width="65%">{{domicilio}}</td>\n  </tr>\n  <tr>\n    <td width="35%"><b>Monto total:</b></td>\n    <td width="65%">{{valor_cuota}}</td>\n  </tr>\n</table>'
);
