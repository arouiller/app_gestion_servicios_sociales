-- Migración 2.0.33: Eliminar funcionalidad de diseñador de recibos
-- Elimina la tabla recibo_templates (si existe) para remover completamente
-- la funcionalidad del editor visual de templates

DROP TABLE IF EXISTS recibo_templates;
