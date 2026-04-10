CREATE TABLE IF NOT EXISTS planes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  precio_mensual DECIMAL(10,2) NOT NULL,
  cobertura JSON,
  beneficios JSON,
  duracion_meses INT NOT NULL DEFAULT 12,
  limite_dependientes INT NOT NULL DEFAULT 5,
  estado ENUM('activo','inactivo','descontinuado') NOT NULL DEFAULT 'activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
