-- Crear tabla recibos para almacenar snapshots de recibos emitidos
CREATE TABLE IF NOT EXISTS recibos (
  id INT PRIMARY KEY AUTO_INCREMENT,
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
  valor_cuota DECIMAL(10, 2) NOT NULL,
  fecha_emision DATETIME DEFAULT CURRENT_TIMESTAMP,
  usuario_id INT NOT NULL,
  KEY idx_plan_periodo (plan_numero, periodo),
  KEY idx_periodo (periodo),
  KEY idx_usuario (usuario_id)
);

-- Crear tabla recibo_integrantes para almacenar integrantes de cada recibo
CREATE TABLE IF NOT EXISTS recibo_integrantes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  recibo_id INT NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  tipo_documento ENUM('DNI','LC','LE','PASAPORTE') NOT NULL,
  numero_documento VARCHAR(20) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  fecha_cobertura DATE NOT NULL,
  rol ENUM('titular','integrante') NOT NULL,
  FOREIGN KEY (recibo_id) REFERENCES recibos(id) ON DELETE CASCADE,
  KEY idx_recibo (recibo_id)
);
