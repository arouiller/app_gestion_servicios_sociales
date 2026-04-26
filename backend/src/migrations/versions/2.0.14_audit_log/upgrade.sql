CREATE TABLE audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metodo VARCHAR(10) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  parametros_json LONGTEXT NULL,
  status_response SMALLINT NULL,
  duracion_ms SMALLINT NULL,
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_fecha_hora (fecha_hora),
  INDEX idx_endpoint (endpoint(100))
);

INSERT INTO configuracion_app (tipo_notificacion, duracion_ms, createdAt, updatedAt)
VALUES
  ('audit_enabled', 1, NOW(), NOW()),
  ('audit_retention_days', 90, NOW(), NOW());
