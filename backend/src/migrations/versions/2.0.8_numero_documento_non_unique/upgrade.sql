-- Migración 2.0.8: Hacer numero_documento no único en tabla personas
-- Permite que múltiples personas puedan tener el mismo número de documento
-- (útil para casos de documentos duplicados o cambios en la identificación)

-- Remover el constraint UNIQUE de numero_documento
ALTER TABLE personas DROP INDEX numero_documento;

-- Mantener el índice simple para búsquedas rápidas (sin UNIQUE)
CREATE INDEX idx_numero_documento ON personas(numero_documento);
