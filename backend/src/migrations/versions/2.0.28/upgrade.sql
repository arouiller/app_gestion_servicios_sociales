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

-- Insert default template (empty - will be created from backend on first use)
-- The template is managed by the backend to avoid SQL escaping issues with HTML content
DELETE FROM recibo_templates WHERE nombre = 'Recibo Estándar 2026';
INSERT INTO recibo_templates (nombre, version, activo, usuario_id, descripcion, html)
VALUES (
  'Recibo Estándar 2026',
  1,
  true,
  1,
  'Template por defecto para generación de recibos en PDF',
  '<h2>{{periodo}}</h2><p>Template creado desde backend</p>'
);
