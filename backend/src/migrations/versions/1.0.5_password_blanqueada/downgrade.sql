-- Downgrade: Remover columna password_blanqueada

DROP INDEX idx_usuarios_password_blanqueada;
ALTER TABLE usuarios DROP COLUMN password_blanqueada;
