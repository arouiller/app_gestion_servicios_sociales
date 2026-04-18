DROP INDEX idx_tipo_grupo_abreviacion ON tipo_grupo;
ALTER TABLE tipo_grupo DROP COLUMN abreviacion;

DROP INDEX idx_tipo_plan_abreviacion ON tipo_plan;
ALTER TABLE tipo_plan DROP COLUMN abreviacion;
