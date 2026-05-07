-- Crear tabla zonas
CREATE TABLE IF NOT EXISTS zonas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(2) NOT NULL UNIQUE COMMENT 'Código de 2 dígitos para la zona',
  nombre VARCHAR(255) NOT NULL COMMENT 'Nombre de la zona',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX idx_zonas_codigo ON zonas(codigo);
CREATE INDEX idx_zonas_nombre ON zonas(nombre);
