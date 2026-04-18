-- Downgrade de 2.0.8: Revertir numero_documento a UNIQUE

-- Remover el índice simple
ALTER TABLE personas DROP INDEX idx_numero_documento;

-- Agregar constraint UNIQUE nuevamente
ALTER TABLE personas ADD UNIQUE INDEX numero_documento (numero_documento);
