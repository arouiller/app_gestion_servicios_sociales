-- Restaurar campo zona en planes
ALTER TABLE planes ADD COLUMN zona TINYINT UNSIGNED NOT NULL DEFAULT 0;

-- Restaurar ENUM original
ALTER TABLE planes MODIFY COLUMN estado ENUM('ACTIVO', 'SUSPENDIDO') NOT NULL DEFAULT 'ACTIVO';

-- Restaurar zona_id en plan_integrantes
ALTER TABLE plan_integrantes ADD COLUMN zona_id INT NULL;
ALTER TABLE plan_integrantes ADD CONSTRAINT fk_plan_integrantes_localidad
  FOREIGN KEY (zona_id) REFERENCES localidades(id) ON DELETE RESTRICT;
