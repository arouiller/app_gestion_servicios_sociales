-- Revertir migración 2.0.32: Cambiar margins de TEXT a INT
ALTER TABLE recibo_templates
MODIFY COLUMN margins INT DEFAULT 8;
