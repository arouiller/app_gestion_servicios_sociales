-- Eliminar constraints de FK
ALTER TABLE planes DROP FOREIGN KEY fk_planes_zona;
ALTER TABLE planes DROP FOREIGN KEY fk_planes_localidad;

-- Eliminar índices
DROP INDEX idx_planes_zona_id ON planes;
DROP INDEX idx_planes_localidad_id ON planes;

-- Eliminar columnas
ALTER TABLE planes DROP COLUMN zona_id;
ALTER TABLE planes DROP COLUMN localidad_id;
