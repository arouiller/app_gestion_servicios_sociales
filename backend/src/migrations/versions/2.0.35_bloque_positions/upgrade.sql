-- Migración 2.0.35: Agregar campo bloque_positions para drag & drop de bloques
-- Permite posicionamiento absoluto e independiente de cada bloque en el template

ALTER TABLE recibo_templates
ADD COLUMN bloque_positions JSON COMMENT 'Posición y tamaño de cada bloque: {encabezado: {x, y, width, height}, afiliado: {...}, detalles: {...}, pie: {...}}' AFTER bloque_pageconfig;

-- Inicializar con posiciones por defecto para template existente
UPDATE recibo_templates
SET bloque_positions = JSON_OBJECT(
  'encabezado', JSON_OBJECT('x', 10, 'y', 10, 'width', 190, 'height', 50),
  'afiliado', JSON_OBJECT('x', 10, 'y', 65, 'width', 190, 'height', 40),
  'detalles', JSON_OBJECT('x', 10, 'y', 110, 'width', 190, 'height', 60),
  'pie', JSON_OBJECT('x', 10, 'y', 175, 'width', 190, 'height', 30)
)
WHERE bloque_positions IS NULL;
