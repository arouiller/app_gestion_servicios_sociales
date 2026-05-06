-- Remover FK y columna zona_id de plan_integrantes
ALTER TABLE plan_integrantes DROP FOREIGN KEY plan_integrantes_ibfk_3;
ALTER TABLE plan_integrantes DROP INDEX idx_zona_id;
ALTER TABLE plan_integrantes DROP COLUMN zona_id;

-- Remover tabla zonas
DROP TABLE IF EXISTS zonas;

-- Remover tabla provincias
DROP TABLE IF EXISTS provincias;
