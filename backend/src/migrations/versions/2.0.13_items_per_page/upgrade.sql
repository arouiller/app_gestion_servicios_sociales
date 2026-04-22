-- Agregar configuración items_per_page para UI
INSERT INTO configuracion_app (tipo_notificacion, duracion_ms, createdAt, updatedAt)
VALUES ('items_per_page', 15, NOW(), NOW())
ON DUPLICATE KEY UPDATE duracion_ms = 15;
