-- Revertir Migración 1.0.4: Remover campo de tema preferido

DROP INDEX idx_tema_preferido ON usuarios;
ALTER TABLE usuarios DROP COLUMN tema_preferido;
