-- Upgrade 2.0.27: Agregar numero_recibo y zona_codigo a la tabla recibos

ALTER TABLE recibos
ADD COLUMN numero_recibo INT UNSIGNED NULL AFTER id,
ADD COLUMN zona_codigo VARCHAR(10) NULL AFTER numero_recibo;

UPDATE recibos SET numero_recibo = id;

UPDATE recibos r
  JOIN planes p ON p.plan_numero = r.plan_numero
  JOIN zonas z ON z.id = p.zona_id
  SET r.zona_codigo = z.codigo;
