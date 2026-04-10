-- Migración 1.0.1: Tabla de afiliados
CREATE TABLE IF NOT EXISTS afiliados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE,
  tipo_documento ENUM('DNI','CI','Pasaporte') NOT NULL,
  numero_documento VARCHAR(20) NOT NULL,
  genero ENUM('M','F','Otro'),
  direccion VARCHAR(255),
  ciudad VARCHAR(100),
  provincia VARCHAR(100),
  codigo_postal VARCHAR(10),
  telefonos JSON,
  email_contacto VARCHAR(255),
  estado ENUM('activo','inactivo','suspendido') NOT NULL DEFAULT 'activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_afiliados_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  UNIQUE KEY uk_numero_documento (numero_documento),
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
