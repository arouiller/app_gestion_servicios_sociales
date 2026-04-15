-- Migración 1.0.4: Agregar campo de tema preferido a usuarios
-- Permite que cada usuario tenga su tema de interfaz preferido (claro, oscuro, azul, verde)

ALTER TABLE usuarios ADD COLUMN tema_preferido VARCHAR(50) DEFAULT 'claro' NOT NULL;

-- Crear índice para futuras búsquedas por tema
CREATE INDEX idx_tema_preferido ON usuarios(tema_preferido);
