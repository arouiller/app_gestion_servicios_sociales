-- Renombrar tabla zonas a localidades
RENAME TABLE zonas TO localidades;

-- Actualizar plan_integrantes: renombrar zona_id a localidad_id
ALTER TABLE plan_integrantes
DROP FOREIGN KEY plan_integrantes_ibfk_2;

ALTER TABLE plan_integrantes
DROP INDEX idx_zona_id;

ALTER TABLE plan_integrantes
CHANGE COLUMN zona_id localidad_id INT;

ALTER TABLE plan_integrantes
ADD CONSTRAINT plan_integrantes_ibfk_2
FOREIGN KEY (localidad_id) REFERENCES localidades(id) ON DELETE RESTRICT;

ALTER TABLE plan_integrantes
ADD INDEX idx_localidad_id (localidad_id);
