-- Remover FK de plan_integrantes
ALTER TABLE plan_integrantes DROP FOREIGN KEY plan_integrantes_ibfk_3;

-- Remover columna zona_id de plan_integrantes
ALTER TABLE plan_integrantes DROP COLUMN zona_id;

-- Eliminar tabla zonas
DROP TABLE IF EXISTS zonas;

-- Eliminar tabla provincias
DROP TABLE IF EXISTS provincias;

-- Remover registro de migración
DELETE FROM migraciones_bd WHERE nombre = 'provincias_zonas' AND version = '2.0.16';
