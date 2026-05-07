-- Downgrade 2.0.23: Restaurar VARCHAR(50)
ALTER TABLE planes
  MODIFY COLUMN numero_afiliado VARCHAR(50) NOT NULL;
