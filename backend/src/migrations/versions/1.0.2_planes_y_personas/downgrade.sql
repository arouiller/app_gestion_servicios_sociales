-- Rollback de Migración 1.0.2: Eliminar tablas Personas y Planes

DROP TABLE IF EXISTS integrante_servicios;
DROP TABLE IF EXISTS plan_integrantes;
DROP TABLE IF EXISTS planes;
DROP TABLE IF EXISTS personas;
