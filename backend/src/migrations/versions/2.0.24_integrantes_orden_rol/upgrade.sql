-- Migración 2.0.24: Validar y asignar rol/orden a plan_integrantes

-- 1. Agregar campos si no existen
ALTER TABLE plan_integrantes
ADD COLUMN IF NOT EXISTS orden INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT NULL;

-- 2. Ordenar integrantes por plan y asignar orden secuencial
-- Usando variable de sesión para emular ROW_NUMBER (compatible MariaDB 10.2)
SET @plan_numero = 0;
SET @orden = 0;

UPDATE plan_integrantes pi
SET pi.orden = (
  SELECT COUNT(*) + 1
  FROM plan_integrantes pi2
  WHERE pi2.plan_numero = pi.plan_numero
    AND pi2.id < pi.id
)
WHERE pi.orden IS NULL;

-- 3. Asignar rol basado en orden: orden = 1 → "titular", orden > 1 → "integrante"
UPDATE plan_integrantes
SET rol = CASE
  WHEN orden = 1 THEN 'titular'
  ELSE 'integrante'
END
WHERE rol IS NULL;

-- 4. Verificación: Asegurarse que cada plan tiene exactamente 1 titular
-- Si este query retorna > 0 filas, la migración tiene problemas
SELECT plan_numero, COUNT(*) as titulares
FROM plan_integrantes
WHERE rol = 'titular'
GROUP BY plan_numero
HAVING titulares != 1;
