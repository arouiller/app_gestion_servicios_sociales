-- Agregar columnas a plan_integrantes
ALTER TABLE plan_integrantes ADD COLUMN estado ENUM('Activo', 'Suspendido', 'Eliminado', 'Promocion') DEFAULT 'Activo';
ALTER TABLE plan_integrantes ADD COLUMN orden INT DEFAULT 0;
