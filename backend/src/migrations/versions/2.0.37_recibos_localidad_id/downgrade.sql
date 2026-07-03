-- Revertir cambios de migración 2.0.37

-- Eliminar índice
DROP INDEX idx_recibos_localidad_id ON recibos;

-- Eliminar constraint de foreign key
ALTER TABLE recibos DROP FOREIGN KEY fk_recibos_localidad;

-- Eliminar columnas
ALTER TABLE recibos DROP COLUMN localidad_id;
ALTER TABLE recibos DROP COLUMN localidad_nombre;
