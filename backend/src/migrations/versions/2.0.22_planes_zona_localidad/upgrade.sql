-- Upgrade seguro: agrega solo si no existen
-- Agregar columnas si no existen
ALTER TABLE planes
  ADD COLUMN IF NOT EXISTS zona_id INT NULL AFTER estado,
  ADD COLUMN IF NOT EXISTS localidad_id INT NULL AFTER zona_id;

-- Agregar constraints de FK si no existen
ALTER TABLE planes
  ADD CONSTRAINT IF NOT EXISTS fk_planes_zona
    FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE RESTRICT;

ALTER TABLE planes
  ADD CONSTRAINT IF NOT EXISTS fk_planes_localidad
    FOREIGN KEY (localidad_id) REFERENCES localidades(id) ON DELETE RESTRICT;

-- Crear índices para búsquedas si no existen
CREATE INDEX IF NOT EXISTS idx_planes_zona_id ON planes(zona_id);
CREATE INDEX IF NOT EXISTS idx_planes_localidad_id ON planes(localidad_id);
