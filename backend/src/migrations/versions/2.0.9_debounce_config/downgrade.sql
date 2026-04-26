-- Migración 2.0.9: Revertir configuración de debounce
-- Elimina la entrada debounce_delay_ms de ConfiguracionApp

DELETE FROM configuracion_app WHERE tipo_notificacion = 'debounce_delay_ms';
