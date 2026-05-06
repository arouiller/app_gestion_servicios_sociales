-- Remover columna estado de plan_integrantes (el estado es del plan, no del integrante)
ALTER TABLE plan_integrantes DROP COLUMN IF EXISTS estado;
