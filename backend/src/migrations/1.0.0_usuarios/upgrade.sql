-- Migración 1.0.0: Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255),
  foto_perfil VARCHAR(500),
  rol ENUM('admin','usuario') NOT NULL DEFAULT 'usuario',
  google_id VARCHAR(255) UNIQUE,
  estado ENUM('activo','inactivo','suspendido') NOT NULL DEFAULT 'activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ultimo_login TIMESTAMP,
  INDEX idx_rol (rol),
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
