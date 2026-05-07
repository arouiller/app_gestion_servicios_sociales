-- Downgrade seguro: solo elimina si existen
-- Eliminar constraints de FK si existen
ALTER TABLE planes DROP FOREIGN KEY IF EXISTS fk_planes_zona;
ALTER TABLE planes DROP FOREIGN KEY IF EXISTS fk_planes_localidad;

-- Eliminar índices si existen
DROP INDEX IF EXISTS idx_planes_zona_id ON planes;
DROP INDEX IF EXISTS idx_planes_localidad_id ON planes;

-- Eliminar columnas si existen
ALTER TABLE planes DROP COLUMN IF EXISTS zona_id;
ALTER TABLE planes DROP COLUMN IF EXISTS localidad_id;
