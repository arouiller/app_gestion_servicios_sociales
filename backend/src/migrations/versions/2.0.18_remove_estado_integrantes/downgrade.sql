-- Agregar columna estado de vuelta a plan_integrantes
ALTER TABLE plan_integrantes ADD COLUMN estado ENUM('Activo', 'Suspendido', 'Eliminado', 'Promocion') DEFAULT 'Activo' AFTER orden;
