-- Downgrade: Revertir migración 2.0.3 (volver a v2.0.2)
-- Elimina las tablas v1.0.x pero preserva los datos v2.0.x

-- Eliminar dependencias de recibo_integrantes
DROP TABLE IF EXISTS recibo_integrantes;

-- Eliminar recibos
DROP TABLE IF EXISTS recibos;

-- Eliminar historial_cuota
DROP TABLE IF EXISTS historial_cuota;

-- Eliminar integrante_servicios
DROP TABLE IF EXISTS integrante_servicios;

-- Eliminar plan_integrantes
DROP TABLE IF EXISTS plan_integrantes;

-- Nota: No eliminamos la tabla 'planes' porque era parte de v2.0.x
-- Si queremos volver completamente a v2.0.2, habría que documentar que esa versión
-- usaba tabla 'planes' diferente y habría conflicto de schema.
-- Para este downgrade, dejamos 'planes' como está (v1.0.x schema)
-- porque el upgrade lo transformó desde v2.0.x

-- Eliminar personas (creada desde afiliados)
DROP TABLE IF EXISTS personas;

-- Las tablas lookup (tipos_de_plan, cobradores, etc.) se dejan
-- porque podrían ser compartidas o necesarias para consistencia
