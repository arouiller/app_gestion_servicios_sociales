-- 1.0.6: Eliminar tabla periodos_recibos

DROP INDEX idx_periodo ON periodos_recibos;
DROP TABLE IF EXISTS periodos_recibos;
