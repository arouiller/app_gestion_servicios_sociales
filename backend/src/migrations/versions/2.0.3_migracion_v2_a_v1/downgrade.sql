-- Downgrade: Revertir migración 2.0.3 (volver a v2.0.2)
-- Elimina las tablas v1.0.x y restaura planes v2.0.x

-- Eliminar dependencias en orden inverso
DROP TABLE IF EXISTS recibo_integrantes;
DROP TABLE IF EXISTS recibos;
DROP TABLE IF EXISTS historial_cuota;
DROP TABLE IF EXISTS integrante_servicios;
DROP TABLE IF EXISTS plan_integrantes;

-- Eliminar planes v1.0.x
DROP TABLE IF EXISTS planes;

-- Restaurar planes v2.0.x desde backup
RENAME TABLE planes_v2_backup TO planes;

-- Eliminar personas (creada desde afiliados)
DROP TABLE IF EXISTS personas;

-- Nota: Dejamos las tablas lookup (tipos_de_plan, cobradores, etc.) intactas
-- porque podrían ser compartidas o ser necesarias para consistencia
