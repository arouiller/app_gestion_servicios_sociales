-- Remover columnas
ALTER TABLE plan_integrantes DROP COLUMN estado;
ALTER TABLE plan_integrantes DROP COLUMN orden;

-- Remover registro de migración
DELETE FROM migraciones_bd WHERE nombre = 'plan_integrantes_estado_orden' AND version = '2.0.17';
