-- Migración 1.0.2: Crear tablas de personas y planes
-- Crea las tablas para el modelo de planes 1.0.x (personas, planes, plan_integrantes, integrante_servicios)

-- Tabla: personas
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

-- Tabla: planes
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

-- Tabla: plan_integrantes
CREATE TABLE IF NOT EXISTS plan_integrantes (
  id INT AUTO_INCREMENT NOT NULL,
  plan_numero INT NOT NULL,
  persona_id INT NOT NULL,
  rol ENUM('titular','integrante') NOT NULL,
  credencial CHAR(1) NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE KEY uq_plan_persona (plan_numero, persona_id),
  FOREIGN KEY (plan_numero) REFERENCES planes(plan_numero) ON DELETE CASCADE,
  FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: integrante_servicios
CREATE TABLE IF NOT EXISTS integrante_servicios (
  plan_integrante_id INT NOT NULL,
  servicio_adicional_numero INT NOT NULL,
  PRIMARY KEY (plan_integrante_id, servicio_adicional_numero),
  FOREIGN KEY (plan_integrante_id) REFERENCES plan_integrantes(id) ON DELETE CASCADE,
  FOREIGN KEY (servicio_adicional_numero) REFERENCES servicios_adicionales(servicio_adicional_numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
