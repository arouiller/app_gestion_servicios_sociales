-- Downgrade para Migración 1.0.1
-- Elimina tablas lookup (orden inverso a dependencias)

DROP TABLE IF EXISTS tipos_de_grupo;
DROP TABLE IF EXISTS servicios_adicionales;
DROP TABLE IF EXISTS obras_sociales;
DROP TABLE IF EXISTS tipos_de_plan;
DROP TABLE IF EXISTS cobradores;
