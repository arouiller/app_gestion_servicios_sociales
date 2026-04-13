-- Migración 2.0.2: Crear tablas principales (Afiliados, Planes, Historial Grupos Familiares)

-- Tabla: afiliados
CREATE TABLE IF NOT EXISTS afiliados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE,
  tipo_documento ENUM('DNI', 'CI', 'Pasaporte') NOT NULL,
  numero_documento VARCHAR(20) NOT NULL UNIQUE,
  genero ENUM('M', 'F', 'Otro'),
  direccion VARCHAR(255),
  ciudad VARCHAR(100),
  provincia VARCHAR(100),
  codigo_postal VARCHAR(10),
  telefonos JSON,
  email_contacto VARCHAR(255),
  estado ENUM('activo', 'inactivo', 'suspendido') DEFAULT 'activo',
  rol ENUM('titular', 'beneficiario') NOT NULL DEFAULT 'titular',
  grupo_familiar_id INT,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_afiliados_grupo FOREIGN KEY (grupo_familiar_id) REFERENCES grupos_familiares(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: planes
CREATE TABLE IF NOT EXISTS planes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT,
  precio_mensual DECIMAL(10, 2) NOT NULL,
  cobertura JSON,
  beneficios JSON,
  duracion_meses INT NOT NULL DEFAULT 12,
  limite_dependientes INT NOT NULL DEFAULT 5,
  grupo_id INT,
  cobrador_numero INT,
  tipo_plan_numero INT,
  os_numero INT,
  tipo_de_grupo_numero INT,
  estado ENUM('activo', 'inactivo', 'descontinuado') DEFAULT 'activo',
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_planes_grupo FOREIGN KEY (grupo_id) REFERENCES grupos_familiares(id) ON DELETE CASCADE,
  CONSTRAINT fk_planes_cobrador FOREIGN KEY (cobrador_numero) REFERENCES cobradores(cobrador_numero) ON DELETE SET NULL,
  CONSTRAINT fk_planes_tipo_plan FOREIGN KEY (tipo_plan_numero) REFERENCES tipos_de_plan(tipo_plan_numero) ON DELETE SET NULL,
  CONSTRAINT fk_planes_os FOREIGN KEY (os_numero) REFERENCES obras_sociales(os_numero) ON DELETE SET NULL,
  CONSTRAINT fk_planes_tipo_grupo FOREIGN KEY (tipo_de_grupo_numero) REFERENCES tipos_de_grupo(tipo_de_grupo_numero) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: historial_grupo_familiar
CREATE TABLE IF NOT EXISTS historial_grupo_familiar (
  id INT AUTO_INCREMENT PRIMARY KEY,
  grupo_id INT NOT NULL,
  afiliado_id INT NOT NULL,
  accion ENUM('ingreso', 'baja') NOT NULL,
  usuario_id INT NOT NULL,
  notas VARCHAR(255),
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_historial_grupo FOREIGN KEY (grupo_id) REFERENCES grupos_familiares(id) ON DELETE CASCADE,
  CONSTRAINT fk_historial_afiliado FOREIGN KEY (afiliado_id) REFERENCES afiliados(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
