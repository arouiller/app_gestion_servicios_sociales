-- Migración 2.0.3: Transformar schema v2.0.x → v1.0.x
-- Crea las tablas v1.0.x y migra datos de v2.0.x preservando integridad referencial

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 1: Crear tablas lookup (ya deberían existir de 1.0.1)
-- ─────────────────────────────────────────────────────────────────────────────

-- Tabla: cobradores (si no existe)
CREATE TABLE IF NOT EXISTS cobradores (
  cobrador_numero INT NOT NULL,
  cobrador_apellido VARCHAR(100) NOT NULL,
  cobrador_nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT NOW(),
  fecha_actualizacion DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  PRIMARY KEY (cobrador_numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: tipos_de_plan (si no existe)
CREATE TABLE IF NOT EXISTS tipos_de_plan (
  tipo_plan_numero INT NOT NULL,
  tipo_plan_nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT NOW(),
  fecha_actualizacion DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  PRIMARY KEY (tipo_plan_numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: obras_sociales (si no existe)
CREATE TABLE IF NOT EXISTS obras_sociales (
  os_numero INT NOT NULL,
  os_nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT NOW(),
  fecha_actualizacion DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  PRIMARY KEY (os_numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: tipos_de_grupo (si no existe, con seed data)
CREATE TABLE IF NOT EXISTS tipos_de_grupo (
  tipo_de_grupo_numero INT NOT NULL,
  tipo_de_grupo_nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT NOW(),
  fecha_actualizacion DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  PRIMARY KEY (tipo_de_grupo_numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO tipos_de_grupo (tipo_de_grupo_numero, tipo_de_grupo_nombre) VALUES
  (1, 'Individual'),
  (2, 'Grupo familiar'),
  (3, 'Titular y adherente');

-- Tabla: servicios_adicionales (si no existe)
CREATE TABLE IF NOT EXISTS servicios_adicionales (
  servicio_adicional_numero INT NOT NULL,
  servicio_adicional_nombre VARCHAR(100) NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT NOW(),
  fecha_actualizacion DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  PRIMARY KEY (servicio_adicional_numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed: Cobrador default (si no existe)
INSERT IGNORE INTO cobradores (cobrador_numero, cobrador_apellido, cobrador_nombre) VALUES
  (1, 'Default', 'Cobrador');

-- Seed: Obra Social default (si no existe)
INSERT IGNORE INTO obras_sociales (os_numero, os_nombre) VALUES
  (1, 'Obra Social Default');

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 2: Crear tabla personas desde afiliados
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS personas (
  id INT AUTO_INCREMENT NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  tipo_documento ENUM('DNI','LC','LE','PASAPORTE') NOT NULL,
  numero_documento VARCHAR(20) NOT NULL UNIQUE,
  fecha_nacimiento DATE NOT NULL,
  fecha_cobertura DATE NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT NOW(),
  fecha_actualizacion DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  PRIMARY KEY (id),
  INDEX idx_numero_documento (numero_documento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrar datos de afiliados a personas
INSERT INTO personas (apellido, nombre, tipo_documento, numero_documento, fecha_nacimiento, fecha_cobertura, fecha_creacion, fecha_actualizacion)
SELECT
  a.apellido,
  a.nombre,
  CASE
    WHEN a.tipo_documento = 'CI' THEN 'LC'
    WHEN a.tipo_documento = 'Pasaporte' THEN 'PASAPORTE'
    ELSE a.tipo_documento
  END AS tipo_documento,
  a.numero_documento,
  COALESCE(a.fecha_nacimiento, CURDATE()) AS fecha_nacimiento,
  COALESCE(a.fecha_creacion, CURDATE()) AS fecha_cobertura,
  a.fecha_creacion,
  a.fecha_actualizacion
FROM afiliados a
ON DUPLICATE KEY UPDATE
  apellido = VALUES(apellido),
  nombre = VALUES(nombre),
  tipo_documento = VALUES(tipo_documento),
  fecha_nacimiento = VALUES(fecha_nacimiento),
  fecha_cobertura = VALUES(fecha_cobertura),
  fecha_actualizacion = VALUES(fecha_actualizacion);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 3: Migrar planes v2.0.x → tipos_de_plan
-- ─────────────────────────────────────────────────────────────────────────────

-- Crear tipos_de_plan basados en planes v2.0.x
INSERT IGNORE INTO tipos_de_plan (tipo_plan_numero, tipo_plan_nombre)
SELECT
  id AS tipo_plan_numero,
  CONCAT(nombre, COALESCE(CONCAT(' - ', descripcion), '')) AS tipo_plan_nombre
FROM planes
WHERE id IS NOT NULL
LIMIT 999;

-- Si no hay datos en planes v2.0.x, crear un tipo_de_plan default
INSERT IGNORE INTO tipos_de_plan (tipo_plan_numero, tipo_plan_nombre) VALUES
  (999, 'Plan Default');

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 4: Crear tabla planes v1.0.x desde grupos_familiares
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS planes (
  plan_numero INT AUTO_INCREMENT NOT NULL,
  tipo_plan_numero INT NOT NULL,
  cobrador_numero INT NOT NULL,
  tipo_de_grupo_numero INT NOT NULL,
  os_numero INT NOT NULL,
  numero_afiliado VARCHAR(50) NOT NULL UNIQUE,
  telefono_1 VARCHAR(30),
  telefono_2 VARCHAR(30),
  domicilio VARCHAR(255),
  localidad VARCHAR(100),
  valor_cuota DECIMAL(10,2),
  estado ENUM('ACTIVO','SUSPENDIDO') NOT NULL DEFAULT 'ACTIVO',
  fecha_creacion DATETIME NOT NULL DEFAULT NOW(),
  fecha_actualizacion DATETIME NOT NULL DEFAULT NOW() ON UPDATE NOW(),
  PRIMARY KEY (plan_numero),
  UNIQUE KEY uq_numero_afiliado (numero_afiliado),
  FOREIGN KEY (tipo_plan_numero) REFERENCES tipos_de_plan(tipo_plan_numero),
  FOREIGN KEY (cobrador_numero) REFERENCES cobradores(cobrador_numero),
  FOREIGN KEY (tipo_de_grupo_numero) REFERENCES tipos_de_grupo(tipo_de_grupo_numero),
  FOREIGN KEY (os_numero) REFERENCES obras_sociales(os_numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrar cada grupo_familiar a un plan
INSERT INTO planes (tipo_plan_numero, cobrador_numero, tipo_de_grupo_numero, os_numero, numero_afiliado, estado, fecha_creacion, fecha_actualizacion)
SELECT
  COALESCE((SELECT id FROM planes LIMIT 1), 999) AS tipo_plan_numero,
  1 AS cobrador_numero,
  2 AS tipo_de_grupo_numero,
  1 AS os_numero,
  CONCAT('GRP-', gf.id) AS numero_afiliado,
  CASE WHEN gf.estado = 'activo' THEN 'ACTIVO' ELSE 'SUSPENDIDO' END AS estado,
  gf.fecha_creacion,
  gf.fecha_actualizacion
FROM grupos_familiares gf;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 5: Crear tabla plan_integrantes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS plan_integrantes (
  id INT AUTO_INCREMENT NOT NULL,
  plan_numero INT NOT NULL,
  persona_id INT NOT NULL,
  rol ENUM('titular','integrante') NOT NULL,
  credencial CHAR(1) NOT NULL DEFAULT 'A',
  fecha_creacion DATETIME NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE KEY uq_plan_persona (plan_numero, persona_id),
  FOREIGN KEY (plan_numero) REFERENCES planes(plan_numero) ON DELETE CASCADE,
  FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrar afiliados → plan_integrantes
INSERT INTO plan_integrantes (plan_numero, persona_id, rol, credencial, fecha_creacion)
SELECT
  p.plan_numero,
  pe.id AS persona_id,
  CASE WHEN a.rol = 'titular' THEN 'titular' ELSE 'integrante' END AS rol,
  'A' AS credencial,
  a.fecha_creacion
FROM afiliados a
INNER JOIN personas pe ON pe.numero_documento = a.numero_documento
INNER JOIN planes p ON p.numero_afiliado = CONCAT('GRP-', a.grupo_familiar_id)
WHERE a.grupo_familiar_id IS NOT NULL
ON DUPLICATE KEY UPDATE
  rol = VALUES(rol),
  fecha_creacion = VALUES(fecha_creacion);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 6: Crear tabla integrante_servicios (vacía, lista para datos)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS integrante_servicios (
  plan_integrante_id INT NOT NULL,
  servicio_adicional_numero INT NOT NULL,
  PRIMARY KEY (plan_integrante_id, servicio_adicional_numero),
  FOREIGN KEY (plan_integrante_id) REFERENCES plan_integrantes(id) ON DELETE CASCADE,
  FOREIGN KEY (servicio_adicional_numero) REFERENCES servicios_adicionales(servicio_adicional_numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASO 7: Crear tablas de historial v1.0.x
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS historial_cuota (
  id INT AUTO_INCREMENT NOT NULL,
  plan_numero INT NOT NULL,
  valor_anterior DECIMAL(10,2),
  valor_nuevo DECIMAL(10,2),
  usuario_id INT,
  fecha_cambio DATETIME DEFAULT NOW(),
  PRIMARY KEY (id),
  FOREIGN KEY (plan_numero) REFERENCES planes(plan_numero) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recibos (
  id INT AUTO_INCREMENT NOT NULL,
  plan_numero INT NOT NULL,
  numero_recibo VARCHAR(50) NOT NULL UNIQUE,
  fecha_emision DATETIME DEFAULT NOW(),
  periodo_desde DATE,
  periodo_hasta DATE,
  monto_total DECIMAL(10,2),
  estado ENUM('generado','pagado','cancelado') DEFAULT 'generado',
  usuario_id INT,
  fecha_creacion DATETIME DEFAULT NOW(),
  fecha_actualizacion DATETIME DEFAULT NOW() ON UPDATE NOW(),
  PRIMARY KEY (id),
  FOREIGN KEY (plan_numero) REFERENCES planes(plan_numero) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recibo_integrantes (
  id INT AUTO_INCREMENT NOT NULL,
  recibo_id INT NOT NULL,
  plan_integrante_id INT NOT NULL,
  monto_correspondiente DECIMAL(10,2),
  PRIMARY KEY (id),
  FOREIGN KEY (recibo_id) REFERENCES recibos(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_integrante_id) REFERENCES plan_integrantes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
