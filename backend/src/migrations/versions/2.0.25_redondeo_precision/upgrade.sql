-- Migración 2.0.25: Agregar configuración redondeo_precision
-- Inserta la configuración de precisión de redondeo para aumento masivo de cuotas
-- Default: 1 (redondeo a unidad completa)

INSERT INTO configuracion_app (tipo_notificacion, duracion_ms, createdAt, updatedAt)
VALUES ('redondeo_precision', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
  duracion_ms = 1,
  updatedAt = NOW();
