-- Agregar campo abreviacion a tipos_de_grupo
ALTER TABLE tipos_de_grupo
ADD COLUMN abreviacion VARCHAR(10) NOT NULL DEFAULT '' AFTER tipo_de_grupo_nombre,
ADD UNIQUE INDEX idx_tipos_de_grupo_abreviacion (abreviacion);

-- Agregar campo abreviacion a tipos_de_plan
ALTER TABLE tipos_de_plan
ADD COLUMN abreviacion VARCHAR(10) NOT NULL DEFAULT '' AFTER tipo_plan_nombre,
ADD UNIQUE INDEX idx_tipos_de_plan_abreviacion (abreviacion);
