-- Agregar columnas de versionado a tabla recibo_templates
ALTER TABLE recibo_templates
ADD COLUMN IF NOT EXISTS template_group_id INT,
ADD COLUMN IF NOT EXISTS version_number INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS created_by INT,
ADD COLUMN IF NOT EXISTS updated_by INT;

-- Crear índices para consultas de versiones y template activo
CREATE INDEX IF NOT EXISTS idx_template_group_id ON recibo_templates(template_group_id);
CREATE UNIQUE INDEX IF NOT EXISTS uk_template_group_version ON recibo_templates(template_group_id, version_number);

-- Agregar foreign keys (usar ALTER TABLE con nombre de constraint único)
SET @sql = '';
SELECT COUNT(*) INTO @constraint_exists FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_NAME = 'recibo_templates' AND CONSTRAINT_NAME = 'fk_template_group';

SET @sql = IF(@constraint_exists = 0,
  'ALTER TABLE recibo_templates ADD CONSTRAINT fk_template_group FOREIGN KEY (template_group_id) REFERENCES recibo_templates(id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = '';
SELECT COUNT(*) INTO @constraint_exists FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_NAME = 'recibo_templates' AND CONSTRAINT_NAME = 'fk_template_created_by';

SET @sql = IF(@constraint_exists = 0,
  'ALTER TABLE recibo_templates ADD CONSTRAINT fk_template_created_by FOREIGN KEY (created_by) REFERENCES usuarios(id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = '';
SELECT COUNT(*) INTO @constraint_exists FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE TABLE_NAME = 'recibo_templates' AND CONSTRAINT_NAME = 'fk_template_updated_by';

SET @sql = IF(@constraint_exists = 0,
  'ALTER TABLE recibo_templates ADD CONSTRAINT fk_template_updated_by FOREIGN KEY (updated_by) REFERENCES usuarios(id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
