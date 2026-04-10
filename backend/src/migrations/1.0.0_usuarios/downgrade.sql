-- Migración 1.0.0: Rollback tabla de usuarios
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS usuarios;
SET FOREIGN_KEY_CHECKS = 1;
