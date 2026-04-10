-- Migración 1.0.1: Rollback tabla de afiliados
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS afiliados;
SET FOREIGN_KEY_CHECKS = 1;
