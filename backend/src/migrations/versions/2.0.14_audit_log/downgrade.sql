DELETE FROM configuracion_app WHERE tipo_notificacion IN ('audit_enabled', 'audit_retention_days');
DROP TABLE IF EXISTS audit_log;
