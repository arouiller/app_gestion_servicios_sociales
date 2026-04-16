-- Migración 1.0.5: Agregar columna password_blanqueada a tabla usuarios
-- Permite tracking de usuarios que necesitan cambiar contraseña en primer acceso

ALTER TABLE usuarios ADD COLUMN password_blanqueada BOOLEAN DEFAULT FALSE;

-- Índice para queries rápidas de usuarios con password blanqueada
CREATE INDEX idx_usuarios_password_blanqueada ON usuarios(password_blanqueada);
