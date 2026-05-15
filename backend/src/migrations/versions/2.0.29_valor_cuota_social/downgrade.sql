-- Downgrade 2.0.29: Remover parámetro valor_cuota_social y revertir tipo de columna

-- Remover parámetro valor_cuota_social
DELETE FROM configuracion_app WHERE tipo_notificacion = 'valor_cuota_social';

-- Revertir columna duracion_ms a INT
ALTER TABLE configuracion_app
  MODIFY COLUMN duracion_ms INT NOT NULL DEFAULT 5000;
