-- Agregar parámetro de configuración "centro de emision"
INSERT INTO configuracion_app (tipo_notificacion, duracion_ms)
VALUES ('centro_emision', 0)
ON DUPLICATE KEY UPDATE duracion_ms = 0;
