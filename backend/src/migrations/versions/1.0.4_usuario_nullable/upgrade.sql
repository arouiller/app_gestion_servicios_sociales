-- Migración 1.0.4: Permitir usuario_id NULL en afiliados
-- Los beneficiarios registrados por el admin no requieren cuenta de sistema.

ALTER TABLE afiliados
  MODIFY COLUMN usuario_id INT NULL,
  DROP FOREIGN KEY fk_afiliados_usuario,
  ADD CONSTRAINT fk_afiliados_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL;
