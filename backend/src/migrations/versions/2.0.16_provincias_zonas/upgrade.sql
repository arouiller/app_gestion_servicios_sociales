-- Crear tabla provincias
CREATE TABLE IF NOT EXISTS provincias (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  codigo VARCHAR(10) NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla zonas
CREATE TABLE IF NOT EXISTS zonas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  provincia_id INT NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (provincia_id) REFERENCES provincias(id) ON DELETE RESTRICT,
  UNIQUE KEY unique_provincia_codigo (provincia_id, codigo)
);

-- Agregar columna zona_id a plan_integrantes
ALTER TABLE plan_integrantes ADD COLUMN zona_id INT;

-- Agregar FK a zona_id
ALTER TABLE plan_integrantes ADD FOREIGN KEY (zona_id) REFERENCES zonas(id);

-- Insertar provincias por defecto
INSERT INTO provincias (nombre, codigo, activo) VALUES
('Buenos Aires', 'BA', true),
('CABA', 'CABA', true),
('Córdoba', 'CBA', true),
('Mendoza', 'MZA', true),
('Santa Fe', 'SF', true),
('Otras', 'OTRAS', true);

-- Registrar migración
INSERT INTO migraciones_bd (version, nombre, estado, fecha_ejecucion)
VALUES ('2.0.16', 'provincias_zonas', 'completada', NOW());
