-- Crear tabla provincias
CREATE TABLE provincias (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  codigo VARCHAR(10) NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_codigo (codigo),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla zonas
CREATE TABLE zonas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  provincia_id INT NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (provincia_id) REFERENCES provincias(id) ON DELETE RESTRICT,
  UNIQUE KEY uk_provincia_codigo (provincia_id, codigo),
  INDEX idx_provincia_id (provincia_id),
  INDEX idx_codigo (codigo),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agregar columna zona_id a plan_integrantes
ALTER TABLE plan_integrantes
ADD COLUMN zona_id INT NULL AFTER id,
ADD FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE RESTRICT;

-- Crear índice para zona_id
ALTER TABLE plan_integrantes
ADD INDEX idx_zona_id (zona_id);

-- Insertar provincias por defecto (pueden editarse después)
INSERT INTO provincias (nombre, codigo) VALUES
('Buenos Aires', 'BA'),
('CABA', 'CABA'),
('Córdoba', 'CB'),
('Mendoza', 'MZ'),
('Santa Fe', 'SF'),
('Otras', 'OTRAS');
