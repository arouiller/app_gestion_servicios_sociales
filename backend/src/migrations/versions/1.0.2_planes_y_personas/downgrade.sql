-- Downgrade para Migración 1.0.2
-- Elimina tablas de planes y personas (orden inverso a dependencias)

DROP TABLE IF EXISTS integrante_servicios;
DROP TABLE IF EXISTS plan_integrantes;
DROP TABLE IF EXISTS planes;
DROP TABLE IF EXISTS personas;
