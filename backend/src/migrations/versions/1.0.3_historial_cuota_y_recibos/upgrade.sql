-- Migración 1.0.3: Crear tablas de historial, cuota y recibos
-- Crea tablas para auditoría de cambios en cuotas y emisión de recibos

-- Tabla: historial_cuota
CREATE TABLE IF NOT EXISTS historial_cuota (
  id INT AUTO_INCREMENT NOT NULL,
  plan_numero INT NOT NULL,
  valor_anterior DECIMAL(10,2) NOT NULL,
  valor_nuevo DECIMAL(10,2) NOT NULL,
  fecha_cambio DATETIME NOT NULL DEFAULT NOW(),
  usuario_id INT NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (plan_numero) REFERENCES planes(plan_numero) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
  INDEX idx_plan_numero (plan_numero),
  INDEX idx_fecha_cambio (fecha_cambio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: recibos
CREATE TABLE IF NOT EXISTS recibos (
  id INT AUTO_INCREMENT NOT NULL,
  plan_numero INT NOT NULL,
  periodo DATE NOT NULL,
  numero_afiliado VARCHAR(50) NOT NULL,
  titular_apellido VARCHAR(100) NOT NULL,
  titular_nombre VARCHAR(100) NOT NULL,
  obra_social_nombre VARCHAR(100) NOT NULL,
  tipo_plan_nombre VARCHAR(100) NOT NULL,
  tipo_de_grupo_nombre VARCHAR(100) NOT NULL,
  cobrador_apellido VARCHAR(100) NOT NULL,
  cobrador_nombre VARCHAR(100) NOT NULL,
  domicilio VARCHAR(255),
  valor_cuota DECIMAL(10,2) NOT NULL,
  fecha_emision DATETIME NOT NULL DEFAULT NOW(),
  usuario_id INT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_recibo_plan_periodo (plan_numero, periodo),
  FOREIGN KEY (plan_numero) REFERENCES planes(plan_numero) ON DELETE RESTRICT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
  INDEX idx_periodo (periodo),
  INDEX idx_plan_numero (plan_numero)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: recibo_integrantes
CREATE TABLE IF NOT EXISTS recibo_integrantes (
  id INT AUTO_INCREMENT NOT NULL,
  recibo_id INT NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  tipo_documento ENUM('DNI','LC','LE','PASAPORTE') NOT NULL,
  numero_documento VARCHAR(20) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  fecha_cobertura DATE NOT NULL,
  rol ENUM('titular','integrante') NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (recibo_id) REFERENCES recibos(id) ON DELETE CASCADE,
  INDEX idx_recibo_id (recibo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
