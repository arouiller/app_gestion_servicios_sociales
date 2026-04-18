-- Agregar campo abreviacion a tipo_grupo
ALTER TABLE tipo_grupo
ADD COLUMN abreviacion VARCHAR(10) NOT NULL DEFAULT '' AFTER nombre,
ADD UNIQUE INDEX idx_tipo_grupo_abreviacion (abreviacion);

-- Agregar campo abreviacion a tipo_plan
ALTER TABLE tipo_plan
ADD COLUMN abreviacion VARCHAR(10) NOT NULL DEFAULT '' AFTER nombre,
ADD UNIQUE INDEX idx_tipo_plan_abreviacion (abreviacion);
