DROP INDEX idx_tipos_de_grupo_abreviacion ON tipos_de_grupo;
ALTER TABLE tipos_de_grupo DROP COLUMN abreviacion;

DROP INDEX idx_tipos_de_plan_abreviacion ON tipos_de_plan;
ALTER TABLE tipos_de_plan DROP COLUMN abreviacion;
