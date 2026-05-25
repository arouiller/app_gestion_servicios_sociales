-- Migración 2.0.32: Cambiar columna margins de INT a TEXT para soportar JSON config
ALTER TABLE recibo_templates
MODIFY COLUMN margins TEXT;
