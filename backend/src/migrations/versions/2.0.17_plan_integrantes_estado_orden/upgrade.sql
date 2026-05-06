-- Agregar columnas a plan_integrantes
ALTER TABLE plan_integrantes ADD COLUMN estado ENUM('Activo', 'Suspendido', 'Eliminado', 'Promocion') DEFAULT 'Activo';
ALTER TABLE plan_integrantes ADD COLUMN orden INT DEFAULT 0;

-- Registrar migración
INSERT INTO migraciones_bd (version, nombre, estado, fecha_ejecucion)
VALUES ('2.0.17', 'plan_integrantes_estado_orden', 'completada', NOW());
