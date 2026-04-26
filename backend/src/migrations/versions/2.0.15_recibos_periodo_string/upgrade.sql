-- Migración 2.0.15: Cambiar tipo de campo 'periodo' en tabla recibos de DATE a VARCHAR(10)
-- Causa: Timezone issues - el campo DATE causaba que '2026-04-01' se persistiera como '2026-03-31'
-- Solución: Guardar como STRING para evitar conversiones de timezone

ALTER TABLE recibos
MODIFY COLUMN periodo VARCHAR(10) NOT NULL;

-- Actualizar registros mal guardados que tienen formato DATE en lugar de YYYY-MM-DD
UPDATE recibos
SET periodo = DATE_FORMAT(periodo, '%Y-%m-%d')
WHERE periodo IS NOT NULL AND periodo NOT REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$';
