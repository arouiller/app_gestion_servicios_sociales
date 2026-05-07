-- Upgrade 2.0.22: Agregar zona_id y localidad_id a planes
ALTER TABLE planes
  ADD COLUMN IF NOT EXISTS zona_id INT NULL AFTER estado,
  ADD COLUMN IF NOT EXISTS localidad_id INT NULL AFTER zona_id;

ALTER TABLE planes
  ADD CONSTRAINT fk_planes_zona
    FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE RESTRICT;

ALTER TABLE planes
  ADD CONSTRAINT fk_planes_localidad
    FOREIGN KEY (localidad_id) REFERENCES localidades(id) ON DELETE RESTRICT;

CREATE INDEX idx_planes_zona_id ON planes(zona_id);
CREATE INDEX idx_planes_localidad_id ON planes(localidad_id);
