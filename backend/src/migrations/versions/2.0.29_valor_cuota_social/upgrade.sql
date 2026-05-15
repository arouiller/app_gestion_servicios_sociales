-- Agregar nuevo parámetro valor_cuota_social a system_config
INSERT INTO system_config (param_name, param_value, param_type, description, created_at, updated_at)
VALUES (
  'valor_cuota_social',
  '0.00',
  'decimal',
  'Valor base de la cuota social (configurable)',
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE updated_at = NOW();
