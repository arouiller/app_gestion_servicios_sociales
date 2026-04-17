-- Migración 2.0.5: Hacer claves foráneas en tabla planes nullable
-- Propósito: Permitir eliminación en cascada de entidades lookup (cobradores, OS, tipos)
--           sin necesidad de eliminar planes asociados
-- Cambios: cobrador_numero, tipo_plan_numero, tipo_de_grupo_numero, os_numero
--          de NOT NULL a NULL (con default NULL)

-- Cambiar cobrador_numero a nullable
ALTER TABLE planes MODIFY COLUMN cobrador_numero INT NULL DEFAULT NULL;

-- Cambiar tipo_plan_numero a nullable
ALTER TABLE planes MODIFY COLUMN tipo_plan_numero INT NULL DEFAULT NULL;

-- Cambiar tipo_de_grupo_numero a nullable
ALTER TABLE planes MODIFY COLUMN tipo_de_grupo_numero INT NULL DEFAULT NULL;

-- Cambiar os_numero a nullable
ALTER TABLE planes MODIFY COLUMN os_numero INT NULL DEFAULT NULL;
