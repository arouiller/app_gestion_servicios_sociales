-- Downgrade 2.0.23: Recrear tablas eliminadas

CREATE TABLE IF NOT EXISTS afiliados (
  id INT PRIMARY KEY AUTO_INCREMENT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS grupos_familiares (
  id INT PRIMARY KEY AUTO_INCREMENT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS historial_grupo_familiar (
  id INT PRIMARY KEY AUTO_INCREMENT,
  grupo_id INT,
  afiliado_id INT,
  usuario_id INT,
  accion VARCHAR(255),
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notas TEXT
);

CREATE TABLE IF NOT EXISTS planes_v2_backup (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(150),
  descripcion TEXT,
  precio_mensual DECIMAL(10, 2),
  cobertura JSON,
  beneficios JSON,
  duracion_meses INT DEFAULT 12,
  limite_dependientes INT DEFAULT 5,
  estado ENUM('activo', 'inactivo', 'descontinuado') DEFAULT 'activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
