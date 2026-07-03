-- Agregar campos de localidad a tabla recibos
ALTER TABLE recibos ADD COLUMN localidad_id INT;
ALTER TABLE recibos ADD COLUMN localidad_nombre VARCHAR(100);

-- Agregar constraint de foreign key opcional
ALTER TABLE recibos ADD CONSTRAINT fk_recibos_localidad
  FOREIGN KEY (localidad_id) REFERENCES localidades(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Agregar índices para queries frecuentes
CREATE INDEX idx_recibos_localidad_id ON recibos(localidad_id);
