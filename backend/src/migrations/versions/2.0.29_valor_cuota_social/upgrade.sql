-- Migración 2.0.29: Alterar columna duracion_ms para soportar decimales y agregar parámetro valor_cuota_social
-- Cambia duracion_ms de INT a DECIMAL(10,2) para soportar valores como redondeo_precision y valor_cuota_social

-- Alterar columna para soportar decimales
ALTER TABLE configuracion_app
  MODIFY COLUMN duracion_ms DECIMAL(10, 2) NOT NULL DEFAULT 5000;

-- Agregar nuevo parámetro valor_cuota_social
INSERT INTO configuracion_app (tipo_notificacion, duracion_ms, createdAt, updatedAt)
VALUES ('valor_cuota_social', 0.00, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  duracion_ms = VALUES(duracion_ms),
  updatedAt = NOW();
