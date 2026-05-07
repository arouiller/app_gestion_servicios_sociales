-- Crear tabla provincias
CREATE TABLE IF NOT EXISTS provincias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL UNIQUE COMMENT 'Nombre de la provincia',
  codigo VARCHAR(10) NOT NULL UNIQUE COMMENT 'Código abreviado de la provincia',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla localidades (dependientes de provincia)
CREATE TABLE IF NOT EXISTS localidades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  provincia_id INT NOT NULL COMMENT 'Referencia a la provincia',
  codigo VARCHAR(50) NOT NULL COMMENT 'Código de la localidad',
  nombre VARCHAR(255) NOT NULL COMMENT 'Nombre de la localidad',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (provincia_id) REFERENCES provincias(id) ON DELETE RESTRICT,
  UNIQUE KEY unique_provincia_codigo (provincia_id, codigo),
  INDEX idx_provincia_id (provincia_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar provincias por defecto
INSERT IGNORE INTO provincias (nombre, codigo, activo) VALUES
('Buenos Aires', 'BA', true),
('CABA', 'CABA', true),
('Córdoba', 'CBA', true),
('Mendoza', 'MZA', true),
('Santa Fe', 'SF', true),
('Otras', 'OTRAS', true);

-- Insertar localidades por defecto para Buenos Aires (id=1)
INSERT IGNORE INTO localidades (provincia_id, codigo, nombre, activo) VALUES
(1, 'LA PAZ', 'La Paz', true),
(1, 'LANUS', 'Lanús', true),
(1, 'LOMAS', 'Lomas de Zamora', true),
(1, 'MORON', 'Morón', true),
(1, 'QUILMES', 'Quilmes', true),
(1, 'RIACHUELO', 'Riachuelo', true),
(1, 'SAN JUSTO', 'San Justo', true);

-- Insertar localidades por defecto para CABA (id=2)
INSERT IGNORE INTO localidades (provincia_id, codigo, nombre, activo) VALUES
(2, 'ZONA1', 'Zona Centro', true),
(2, 'ZONA2', 'Zona Norte', true),
(2, 'ZONA3', 'Zona Sur', true);

-- Insertar localidades por defecto para Córdoba (id=3)
INSERT IGNORE INTO localidades (provincia_id, codigo, nombre, activo) VALUES
(3, 'CAPITAL', 'Córdoba Capital', true),
(3, 'INTERIOR', 'Interior de Córdoba', true);

-- Insertar localidades por defecto para Otras (id=6)
INSERT IGNORE INTO localidades (provincia_id, codigo, nombre, activo) VALUES
(6, 'OTRA', 'Otra localidad', true);
