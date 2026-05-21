-- Remover tabla de auditoría primero
DROP TABLE IF EXISTS recibo_template_versions;

-- Remover foreign keys
ALTER TABLE recibo_templates
DROP CONSTRAINT IF EXISTS fk_template_group,
DROP CONSTRAINT IF EXISTS fk_created_by,
DROP CONSTRAINT IF EXISTS fk_updated_by;

-- Remover índices
DROP INDEX IF EXISTS idx_template_group_id ON recibo_templates;
DROP INDEX IF EXISTS idx_activo ON recibo_templates;
DROP INDEX IF EXISTS uk_template_group_version ON recibo_templates;

-- Remover columnas
ALTER TABLE recibo_templates
DROP COLUMN template_group_id,
DROP COLUMN version_number,
DROP COLUMN created_by,
DROP COLUMN updated_by;
