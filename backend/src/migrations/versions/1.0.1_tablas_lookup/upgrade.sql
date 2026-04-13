-- Migración 1.0.1: Crear tablas lookup
-- Crea las 5 entidades de lookup (cobradores, tipos de plan, obras sociales, servicios adicionales, tipos de grupo)

-- Tabla: cobradores
CREATE TABLE IF NOT EXISTS cobradores (
  cobrador_numero INT NOT NULL,
  cobrador_apellido VARCHAR(100) NOT NULL,
  cobrador_nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT NOW(),
  fecha_actualizacion DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  PRIMARY KEY (cobrador_numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: tipos_de_plan
CREATE TABLE IF NOT EXISTS tipos_de_plan (
  tipo_plan_numero INT NOT NULL,
  tipo_plan_nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT NOW(),
  fecha_actualizacion DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  PRIMARY KEY (tipo_plan_numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: obras_sociales
CREATE TABLE IF NOT EXISTS obras_sociales (
  os_numero INT NOT NULL,
  os_nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT NOW(),
  fecha_actualizacion DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  PRIMARY KEY (os_numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: servicios_adicionales
CREATE TABLE IF NOT EXISTS servicios_adicionales (
  servicio_adicional_numero INT NOT NULL,
  servicio_adicional_nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT NOW(),
  fecha_actualizacion DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  PRIMARY KEY (servicio_adicional_numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: tipos_de_grupo
CREATE TABLE IF NOT EXISTS tipos_de_grupo (
  tipo_de_grupo_numero INT NOT NULL,
  tipo_de_grupo_nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT NOW(),
  fecha_actualizacion DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  PRIMARY KEY (tipo_de_grupo_numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed: Tipos de grupo (3 tipos iniciales)
INSERT INTO tipos_de_grupo (tipo_de_grupo_numero, tipo_de_grupo_nombre) VALUES
  (1, 'Individual'),
  (2, 'Grupo familiar'),
  (3, 'Titular y adherente');
