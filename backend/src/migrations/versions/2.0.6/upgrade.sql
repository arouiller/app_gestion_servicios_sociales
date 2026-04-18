CREATE TABLE IF NOT EXISTS configuracion_app (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo_notificacion VARCHAR(50) NOT NULL UNIQUE,
  duracion_ms INT NOT NULL DEFAULT 5000,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO configuracion_app (tipo_notificacion, duracion_ms) VALUES
('error', 7000),
('warning', 5000),
('success', 3000),
('info', 4000)
ON DUPLICATE KEY UPDATE duracion_ms=VALUES(duracion_ms);

CREATE INDEX idx_tipo_notificacion ON configuracion_app(tipo_notificacion);
