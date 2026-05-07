-- Agregar zona_id a planes (FK a zonas.id)
ALTER TABLE planes
  ADD COLUMN zona_id INT NULL AFTER estado,
  ADD COLUMN localidad_id INT NULL AFTER zona_id;

-- Agregar constraints de FK
ALTER TABLE planes
  ADD CONSTRAINT fk_planes_zona
    FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_planes_localidad
    FOREIGN KEY (localidad_id) REFERENCES localidades(id) ON DELETE RESTRICT;

-- Crear índices para búsquedas
CREATE INDEX idx_planes_zona_id ON planes(zona_id);
CREATE INDEX idx_planes_localidad_id ON planes(localidad_id);
