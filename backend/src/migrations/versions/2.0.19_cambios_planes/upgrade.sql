-- Eliminar campo zona de planes (integer suelto, sin FK formal)
ALTER TABLE planes DROP COLUMN zona;

-- Agregar nuevos estados al ENUM
ALTER TABLE planes MODIFY COLUMN estado ENUM('ACTIVO', 'SUSPENDIDO', 'ELIMINADO', 'PROMOCION') NOT NULL DEFAULT 'ACTIVO';

-- Eliminar zona_id de plan_integrantes (FK a localidades)
-- Primero drop la FK constraint explícitamente
ALTER TABLE plan_integrantes DROP FOREIGN KEY plan_integrantes_ibfk_3;

-- Luego drop la columna
ALTER TABLE plan_integrantes DROP COLUMN zona_id;
