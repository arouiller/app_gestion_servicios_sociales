-- Upgrade 2.0.23: Normalizar numero_afiliado a 5 dígitos con padding
-- Primero aplicar padding a datos existentes (antes de MODIFY para evitar truncado)
UPDATE planes
  SET numero_afiliado = LPAD(TRIM(numero_afiliado), 5, '0')
  WHERE CHAR_LENGTH(TRIM(numero_afiliado)) < 5;

-- Reducir tipo de columna a VARCHAR(5)
ALTER TABLE planes
  MODIFY COLUMN numero_afiliado VARCHAR(5) NOT NULL;
