-- Migración 2.0.9: Agregar configuración de debounce en búsquedas
-- Agrega entrada en ConfiguracionApp para almacenar el tiempo de debounce configurable (default 2000ms)

INSERT INTO configuracion_app (tipo_notificacion, duracion_ms, createdAt, updatedAt)
VALUES ('debounce_delay_ms', 2000, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  duracion_ms = 2000,
  updatedAt = NOW();
