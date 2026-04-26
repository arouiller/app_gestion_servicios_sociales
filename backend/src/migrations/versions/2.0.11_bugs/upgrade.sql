CREATE TABLE bugs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero VARCHAR(20) NOT NULL UNIQUE,
  usuario_id INT NOT NULL,
  titulo VARCHAR(255) NULL,
  descripcion LONGTEXT NOT NULL,
  estado ENUM('REGISTRADO','DESARROLLADO','DESESTIMADO','CERRADO') NOT NULL DEFAULT 'REGISTRADO',
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_estado (estado),
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_fecha_creacion (fecha_creacion),
  CONSTRAINT fk_bugs_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
