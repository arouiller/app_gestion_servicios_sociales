-- Downgrade 2.0.27: Eliminar columnas numero_recibo y zona_codigo de la tabla recibos

ALTER TABLE recibos
DROP COLUMN numero_recibo,
DROP COLUMN zona_codigo;
