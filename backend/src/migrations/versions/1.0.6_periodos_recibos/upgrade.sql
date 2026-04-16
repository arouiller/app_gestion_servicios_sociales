-- 1.0.6: Crear tabla para registrar períodos de recibos generados

CREATE TABLE periodos_recibos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  periodo VARCHAR(7) NOT NULL UNIQUE COMMENT 'Formato YYYY-MM',
  cantidad_recibos INT DEFAULT 0 COMMENT 'Cantidad de recibos generados en este período',
  fecha_generacion DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Cuándo se generaron los recibos',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índice en periodo para búsquedas rápidas
CREATE UNIQUE INDEX idx_periodo ON periodos_recibos(periodo);
