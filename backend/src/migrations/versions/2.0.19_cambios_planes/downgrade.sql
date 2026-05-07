-- Restaurar campo zona en planes
ALTER TABLE planes ADD COLUMN IF NOT EXISTS zona TINYINT UNSIGNED NOT NULL DEFAULT 0;

-- Restaurar ENUM original
ALTER TABLE planes MODIFY COLUMN estado ENUM('ACTIVO', 'SUSPENDIDO') NOT NULL DEFAULT 'ACTIVO';

-- Restaurar zona_id en plan_integrantes
ALTER TABLE plan_integrantes ADD COLUMN zona_id INT NULL;
ALTER TABLE plan_integrantes ADD CONSTRAINT plan_integrantes_ibfk_3
  FOREIGN KEY (zona_id) REFERENCES localidades(id) ON DELETE RESTRICT;
