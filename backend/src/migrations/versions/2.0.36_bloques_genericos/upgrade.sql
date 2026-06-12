-- Migración 2.0.36: Cambiar a sistema genérico de bloques
-- Reemplaza bloques predefinidos (1-4) con lista genérica configurable

ALTER TABLE recibo_templates
ADD COLUMN bloques JSON COMMENT 'Lista de bloques genéricos: [{id, tipo, x, y, width, height, contenido}]';

-- Inicializar con estructura vacía para templates nuevos
UPDATE recibo_templates
SET bloques = JSON_ARRAY()
WHERE bloques IS NULL;
