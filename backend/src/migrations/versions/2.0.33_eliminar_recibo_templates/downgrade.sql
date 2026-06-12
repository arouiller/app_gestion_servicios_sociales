-- Migración 2.0.33: Downgrade - Eliminar diseñador de recibos
-- Esta migración es irreversible: elimina la tabla recibo_templates
-- Si necesita downgrade, debe restaurar desde un backup anterior

-- No se puede recrear la tabla automáticamente porque los datos están perdidos
-- Esta es una migración destructiva que no debe revertirse en producción
