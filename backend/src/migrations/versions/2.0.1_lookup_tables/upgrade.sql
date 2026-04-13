-- Migración 2.0.1: Crear tablas de lookup (Cobradores, Obras Sociales, Servicios Adicionales, Tipos de Grupo, Tipos de Plan)

-- Tabla: cobradores
CREATE TABLE IF NOT EXISTS cobradores (
  cobrador_numero INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  cobrador_apellido VARCHAR(100) NOT NULL,
  cobrador_nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: obras_sociales
CREATE TABLE IF NOT EXISTS obras_sociales (
  os_numero INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  os_nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: servicios_adicionales
CREATE TABLE IF NOT EXISTS servicios_adicionales (
  servicio_adicional_numero INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  servicio_adicional_nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: tipos_de_grupo
CREATE TABLE IF NOT EXISTS tipos_de_grupo (
  tipo_de_grupo_numero INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  tipo_de_grupo_nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: tipos_de_plan
CREATE TABLE IF NOT EXISTS tipos_de_plan (
  tipo_plan_numero INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
  tipo_plan_nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
