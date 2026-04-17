-- Downgrade 2.0.5: Revertir nullable foreign keys a NOT NULL
-- Propósito: Restaurar restricción NOT NULL en claves foráneas
-- Precaución: Esta operación puede fallar si existen NULLs en las columnas

-- Cambiar cobrador_numero a NOT NULL
ALTER TABLE planes MODIFY COLUMN cobrador_numero INT NOT NULL;

-- Cambiar tipo_plan_numero a NOT NULL
ALTER TABLE planes MODIFY COLUMN tipo_plan_numero INT NOT NULL;

-- Cambiar tipo_de_grupo_numero a NOT NULL
ALTER TABLE planes MODIFY COLUMN tipo_de_grupo_numero INT NOT NULL;

-- Cambiar os_numero a NOT NULL
ALTER TABLE planes MODIFY COLUMN os_numero INT NOT NULL;
