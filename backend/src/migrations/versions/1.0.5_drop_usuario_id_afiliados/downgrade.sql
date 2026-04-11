ALTER TABLE afiliados
  ADD COLUMN usuario_id INT NULL AFTER id,
  ADD CONSTRAINT fk_afiliados_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL;
