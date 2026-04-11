-- Rollback 1.0.4
-- Nota: requiere que todos los afiliados tengan usuario_id válido antes de revertir.

ALTER TABLE afiliados
  DROP FOREIGN KEY fk_afiliados_usuario,
  MODIFY COLUMN usuario_id INT NOT NULL,
  ADD CONSTRAINT fk_afiliados_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE;
