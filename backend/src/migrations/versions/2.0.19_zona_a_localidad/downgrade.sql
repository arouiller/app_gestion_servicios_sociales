-- Revertir cambios: renombrar localidades a zonas y restaurar nombre de columna

ALTER TABLE plan_integrantes
DROP FOREIGN KEY plan_integrantes_ibfk_2;

ALTER TABLE plan_integrantes
DROP INDEX idx_localidad_id;

ALTER TABLE plan_integrantes
CHANGE COLUMN localidad_id zona_id INT;

ALTER TABLE plan_integrantes
ADD CONSTRAINT plan_integrantes_ibfk_2
FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE RESTRICT;

ALTER TABLE plan_integrantes
ADD INDEX idx_zona_id (zona_id);

RENAME TABLE localidades TO zonas;
