-- Agregar campo abreviacion a tipo_grupo
ALTER TABLE tipo_grupo
ADD COLUMN abreviacion VARCHAR(10) NOT NULL DEFAULT '' AFTER nombre;

ALTER TABLE tipo_grupo
MODIFY COLUMN abreviacion VARCHAR(10) NOT NULL;

CREATE UNIQUE INDEX idx_tipo_grupo_abreviacion ON tipo_grupo(abreviacion);

-- Agregar campo abreviacion a tipo_plan
ALTER TABLE tipo_plan
ADD COLUMN abreviacion VARCHAR(10) NOT NULL DEFAULT '' AFTER nombre;

ALTER TABLE tipo_plan
MODIFY COLUMN abreviacion VARCHAR(10) NOT NULL;

CREATE UNIQUE INDEX idx_tipo_plan_abreviacion ON tipo_plan(abreviacion);
