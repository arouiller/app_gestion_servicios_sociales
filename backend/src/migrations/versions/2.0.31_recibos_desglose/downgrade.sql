-- BACKLOG-080: Downgrade de migración 2.0.31

-- Reactivar template anterior (v1)
UPDATE recibo_templates
SET activo = true
WHERE nombre = 'Recibo Estándar 2026' AND version = 1;

-- Eliminar nuevo template (v2 con desglose)
DELETE FROM recibo_templates
WHERE nombre = 'Recibo Estándar 2026 v2 - Con Desglose' AND version = 2;
