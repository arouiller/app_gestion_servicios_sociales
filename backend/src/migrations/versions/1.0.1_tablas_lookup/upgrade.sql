-- Migración 1.0.1: Crear tablas lookup de entidades

-- Tabla de cobradores
CREATE TABLE cobradores (
  cobrador_numero INT PRIMARY KEY,
  cobrador_apellido VARCHAR(100) NOT NULL,
  cobrador_nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME DEFAULT NOW(),
  fecha_actualizacion DATETIME DEFAULT NOW()
);

-- Tabla de tipos de plan
CREATE TABLE tipos_de_plan (
  tipo_plan_numero INT PRIMARY KEY,
  tipo_plan_nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME DEFAULT NOW(),
  fecha_actualizacion DATETIME DEFAULT NOW()
);

-- Tabla de obras sociales
CREATE TABLE obras_sociales (
  os_numero INT PRIMARY KEY,
  os_nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME DEFAULT NOW(),
  fecha_actualizacion DATETIME DEFAULT NOW()
);

-- Tabla de servicios adicionales
CREATE TABLE servicios_adicionales (
  servicio_adicional_numero INT PRIMARY KEY,
  servicio_adicional_nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME DEFAULT NOW(),
  fecha_actualizacion DATETIME DEFAULT NOW()
);

-- Tabla de tipos de grupo
CREATE TABLE tipos_de_grupo (
  tipo_de_grupo_numero INT PRIMARY KEY,
  tipo_de_grupo_nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME DEFAULT NOW(),
  fecha_actualizacion DATETIME DEFAULT NOW()
);

-- Inserts iniciales para tipos_de_grupo
INSERT INTO tipos_de_grupo (tipo_de_grupo_numero, tipo_de_grupo_nombre, fecha_creacion, fecha_actualizacion)
VALUES
  (1, 'Individual', NOW(), NOW()),
  (2, 'Grupo familiar', NOW(), NOW()),
  (3, 'Titular y adherente', NOW(), NOW());
