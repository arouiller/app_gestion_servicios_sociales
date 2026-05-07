-- Downgrade 2.0.25: Remover configuración redondeo_precision

DELETE FROM configuracion_app WHERE tipo_notificacion = 'redondeo_precision';
