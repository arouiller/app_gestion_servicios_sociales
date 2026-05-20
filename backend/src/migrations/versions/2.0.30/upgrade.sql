ALTER TABLE recibos ADD COLUMN cuota_social DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER valor_cuota;
ALTER TABLE recibos ADD COLUMN arancel_por_servicio DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER cuota_social;

-- Backfill existing records: assign full valor_cuota to arancel_por_servicio, cuota_social = 0
UPDATE recibos
SET cuota_social = 0.00, arancel_por_servicio = valor_cuota
WHERE cuota_social = 0 AND arancel_por_servicio = 0;
