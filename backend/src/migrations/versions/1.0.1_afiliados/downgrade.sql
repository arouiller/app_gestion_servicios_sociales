-- Migración 1.0.1: Rollback tabla de afiliados y grupos familiares
SET FOREIGN_KEY_CHECKS = 0;
ALTER TABLE afiliados DROP FOREIGN KEY fk_afiliados_grupo;
ALTER TABLE afiliados DROP INDEX idx_grupo_familiar_id;
ALTER TABLE afiliados DROP COLUMN rol;
ALTER TABLE afiliados DROP COLUMN grupo_familiar_id;
DROP TABLE IF EXISTS grupos_familiares;
DROP TABLE IF EXISTS afiliados;
SET FOREIGN_KEY_CHECKS = 1;
