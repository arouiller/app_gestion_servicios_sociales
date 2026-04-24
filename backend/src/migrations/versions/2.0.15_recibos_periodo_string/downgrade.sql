-- Revertir migración 2.0.15: Cambiar tipo de campo 'periodo' de VARCHAR(10) a DATE
-- ADVERTENCIA: Esta operación puede perder precisión en las fechas

ALTER TABLE recibos
MODIFY COLUMN periodo DATE NOT NULL;
