-- Migración 2.0.0: Rollback tabla de grupos familiares
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS grupos_familiares;
SET FOREIGN_KEY_CHECKS = 1;
