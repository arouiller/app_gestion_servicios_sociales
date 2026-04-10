-- Migración v001: Schema Inicial
-- Incluye campo password_hash para autenticación email/password

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

CREATE TABLE IF NOT EXISTS afiliados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  tipo_documento ENUM('DNI','CI','Pasaporte') NOT NULL DEFAULT 'DNI',
  numero_documento VARCHAR(20) NOT NULL,
  genero ENUM('M','F','Otro') NOT NULL DEFAULT 'M',
  direccion VARCHAR(255) NOT NULL,
  ciudad VARCHAR(100),
  provincia VARCHAR(100),
  codigo_postal VARCHAR(10),
  telefonos JSON,
  email_contacto VARCHAR(255),
  estado ENUM('activo','inactivo','suspendido') NOT NULL DEFAULT 'activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_numero_documento (numero_documento),
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS planes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL UNIQUE,
  descripcion TEXT,
  precio_mensual DECIMAL(10,2) NOT NULL,
  cobertura JSON,
  beneficios JSON,
  duracion_meses INT,
  limite_dependientes INT DEFAULT 5,
  estado ENUM('activo','inactivo','descontinuado') NOT NULL DEFAULT 'activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS grupos_familiares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titular_id INT NOT NULL,
  nombre VARCHAR(150) NOT NULL,
  plan_id INT NOT NULL,
  estado ENUM('activo','inactivo','suspendido') NOT NULL DEFAULT 'activo',
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (titular_id) REFERENCES afiliados(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES planes(id),
  INDEX idx_titular_id (titular_id),
  INDEX idx_plan_id (plan_id),
  INDEX idx_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS miembros_grupo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grupo_id INT NOT NULL,
  afiliado_id INT NOT NULL,
  relacion VARCHAR(50) NOT NULL,
  es_titular BOOLEAN DEFAULT FALSE,
  fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_salida TIMESTAMP,
  FOREIGN KEY (grupo_id) REFERENCES grupos_familiares(id) ON DELETE CASCADE,
  FOREIGN KEY (afiliado_id) REFERENCES afiliados(id) ON DELETE CASCADE,
  UNIQUE KEY unique_grupo_afiliado (grupo_id, afiliado_id),
  INDEX idx_grupo_id (grupo_id),
  INDEX idx_afiliado_id (afiliado_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cuotas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grupo_id INT NOT NULL,
  plan_id INT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  fecha_generacion DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  estado_pago ENUM('pendiente','pagado','vencido','anulado') NOT NULL DEFAULT 'pendiente',
  numero_cuota INT NOT NULL,
  descripcion VARCHAR(255),
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (grupo_id) REFERENCES grupos_familiares(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES planes(id),
  UNIQUE KEY unique_cuota (grupo_id, numero_cuota, fecha_generacion),
  INDEX idx_grupo_id (grupo_id),
  INDEX idx_fecha_vencimiento (fecha_vencimiento),
  INDEX idx_estado_pago (estado_pago)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS pagos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cuota_id INT NOT NULL,
  grupo_id INT NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metodo_pago ENUM('efectivo','transferencia','tarjeta','cheque') NOT NULL,
  numero_comprobante VARCHAR(100),
  descripcion TEXT,
  confirmado BOOLEAN DEFAULT FALSE,
  fecha_confirmacion TIMESTAMP,
  usuario_admin_id INT,
  FOREIGN KEY (cuota_id) REFERENCES cuotas(id) ON DELETE CASCADE,
  FOREIGN KEY (grupo_id) REFERENCES grupos_familiares(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_admin_id) REFERENCES usuarios(id),
  INDEX idx_cuota_id (cuota_id),
  INDEX idx_fecha_pago (fecha_pago)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  tipo ENUM('cuota_vencida','cuota_por_vencer','cambio_plan','pago_confirmado','info') NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensaje TEXT NOT NULL,
  datos_adicionales JSON,
  leida BOOLEAN DEFAULT FALSE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_lectura TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_leida (leida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS migraciones_bd (
  id INT AUTO_INCREMENT PRIMARY KEY,
  version VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NOT NULL,
  tipo ENUM('upgrade','downgrade') NOT NULL,
  fecha_ejecucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estado ENUM('exitosa','fallida','revertida') NOT NULL DEFAULT 'exitosa'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
