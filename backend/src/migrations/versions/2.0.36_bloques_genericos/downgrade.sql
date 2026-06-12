-- Downgrade: Remover columna bloques genéricos
ALTER TABLE recibo_templates
DROP COLUMN bloques;
