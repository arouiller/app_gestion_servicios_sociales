-- Migración 2.0.1: Rollback - Eliminar tablas de lookup

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS cobradores;
DROP TABLE IF EXISTS obras_sociales;
DROP TABLE IF EXISTS servicios_adicionales;
DROP TABLE IF EXISTS tipos_de_grupo;
DROP TABLE IF EXISTS tipos_de_plan;
SET FOREIGN_KEY_CHECKS = 1;
