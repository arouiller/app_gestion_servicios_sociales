-- Downgrade: Remover campo bloque_positions
ALTER TABLE recibo_templates
DROP COLUMN bloque_positions;
