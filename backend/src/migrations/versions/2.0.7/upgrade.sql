-- Agregar campo abreviacion a tipos_de_grupo (condicional a su existencia)
ALTER TABLE tipos_de_grupo ADD COLUMN IF NOT EXISTS abreviacion VARCHAR(10) NOT NULL DEFAULT '' AFTER tipo_de_grupo_nombre;

-- Agregar campo abreviacion a tipos_de_plan (condicional a su existencia)
ALTER TABLE tipos_de_plan ADD COLUMN IF NOT EXISTS abreviacion VARCHAR(10) NOT NULL DEFAULT '' AFTER tipo_plan_nombre;
