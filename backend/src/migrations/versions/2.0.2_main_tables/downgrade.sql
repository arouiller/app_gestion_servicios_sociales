-- Migración 2.0.2: Rollback - Eliminar tablas principales

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS historial_grupo_familiar;
DROP TABLE IF EXISTS planes;
DROP TABLE IF EXISTS afiliados;
SET FOREIGN_KEY_CHECKS = 1;
