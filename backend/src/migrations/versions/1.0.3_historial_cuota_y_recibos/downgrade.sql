-- Downgrade para Migración 1.0.3
-- Elimina tablas de historial, recibos (orden inverso a dependencias)

DROP TABLE IF EXISTS recibo_integrantes;
DROP TABLE IF EXISTS recibos;
DROP TABLE IF EXISTS historial_cuota;
