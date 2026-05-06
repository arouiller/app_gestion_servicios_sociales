-- Agregar columnas a plan_integrantes (si no existen ya)
ALTER TABLE plan_integrantes ADD COLUMN IF NOT EXISTS estado ENUM('Activo', 'Suspendido', 'Eliminado', 'Promocion') DEFAULT 'Activo';
ALTER TABLE plan_integrantes ADD COLUMN IF NOT EXISTS orden INT DEFAULT 0;
