-- Seed data para tablas lookup v1.0.x
-- Ejecutar en cPanel → phpMyAdmin o MySQL CLI

-- ──────────────────────────────────────────────────────────────────────────────
-- COBRADORES (vendedores/colectores)
-- ──────────────────────────────────────────────────────────────────────────────

INSERT IGNORE INTO cobradores (cobrador_numero, cobrador_apellido, cobrador_nombre) VALUES
  (1, 'Pérez', 'Juan'),
  (2, 'García', 'María'),
  (3, 'López', 'Carlos'),
  (4, 'Martínez', 'Ana'),
  (5, 'Rodriguez', 'Miguel');

-- ──────────────────────────────────────────────────────────────────────────────
-- OBRAS SOCIALES (sistemas de salud)
-- ──────────────────────────────────────────────────────────────────────────────

INSERT IGNORE INTO obras_sociales (os_numero, os_nombre) VALUES
  (1, 'OSDE'),
  (2, 'Medifé'),
  (3, 'SWISS MEDICAL'),
  (4, 'SANATORIOS'),
  (5, 'GALENO'),
  (6, 'PLAN NACIONAL'),
  (7, 'OTRA OS');

-- ──────────────────────────────────────────────────────────────────────────────
-- TIPOS DE PLAN (categorías de planes)
-- ──────────────────────────────────────────────────────────────────────────────

INSERT IGNORE INTO tipos_de_plan (tipo_plan_numero, tipo_plan_nombre) VALUES
  (1, 'Plan Básico'),
  (2, 'Plan Estándar'),
  (3, 'Plan Premium'),
  (4, 'Plan Familiar'),
  (5, 'Plan Senior');

-- ──────────────────────────────────────────────────────────────────────────────
-- SERVICIOS ADICIONALES (coberturas extra)
-- ──────────────────────────────────────────────────────────────────────────────

INSERT IGNORE INTO servicios_adicionales (servicio_adicional_numero, servicio_adicional_nombre) VALUES
  (1, 'Cobertura Dental'),
  (2, 'Cobertura Oftalmología'),
  (3, 'Cobertura Psicología'),
  (4, 'Cobertura Fisioterapia'),
  (5, 'Cobertura Internación'),
  (6, 'Cobertura Maternidad');

-- ──────────────────────────────────────────────────────────────────────────────
-- PERSONAS (datos de prueba - afiliados)
-- ──────────────────────────────────────────────────────────────────────────────

INSERT IGNORE INTO personas (apellido, nombre, tipo_documento, numero_documento, fecha_nacimiento, fecha_cobertura) VALUES
  ('García', 'Juan', 'DNI', '12345678', '1985-05-15', CURDATE()),
  ('López', 'María', 'DNI', '23456789', '1990-08-22', CURDATE()),
  ('Pérez', 'Carlos', 'DNI', '34567890', '1978-12-10', CURDATE()),
  ('Rodríguez', 'Ana', 'DNI', '45678901', '1988-03-18', CURDATE()),
  ('Martínez', 'Pedro', 'DNI', '56789012', '1982-07-25', CURDATE()),
  ('Fernández', 'Sofia', 'DNI', '67890123', '1995-09-30', CURDATE()),
  ('Sánchez', 'Miguel', 'DNI', '78901234', '1980-11-14', CURDATE()),
  ('Gómez', 'Laura', 'DNI', '89012345', '1992-06-08', CURDATE());

-- ──────────────────────────────────────────────────────────────────────────────
-- PLANES (instancias de planes para grupos/familias)
-- ──────────────────────────────────────────────────────────────────────────────

INSERT IGNORE INTO planes (tipo_plan_numero, cobrador_numero, tipo_de_grupo_numero, os_numero, numero_afiliado, telefono_1, domicilio, localidad, valor_cuota, estado) VALUES
  (1, 1, 2, 1, 'AFF-001', '1123456789', 'Calle 1 123', 'CABA', 2500.00, 'ACTIVO'),
  (2, 1, 2, 2, 'AFF-002', '1134567890', 'Calle 2 456', 'CABA', 3200.00, 'ACTIVO'),
  (1, 2, 1, 3, 'AFF-003', '1145678901', 'Av. San Martín 789', 'La Plata', 2800.00, 'ACTIVO'),
  (3, 2, 2, 1, 'AFF-004', '1156789012', 'Calle 5 321', 'Quilmes', 4100.00, 'ACTIVO'),
  (2, 3, 2, 5, 'AFF-005', '1167890123', 'Diagonal 80 654', 'Belgrano', 3000.00, 'ACTIVO'),
  (1, 3, 1, 4, 'AFF-006', '1178901234', 'Calle Mayor 987', 'San Isidro', 2600.00, 'SUSPENDIDO'),
  (4, 4, 2, 2, 'AFF-007', '1189012345', 'Av. Libertador 111', 'Vicente López', 3500.00, 'ACTIVO'),
  (3, 4, 2, 1, 'AFF-008', '1190123456', 'Calle 20 222', 'Flores', 4200.00, 'ACTIVO');

-- ──────────────────────────────────────────────────────────────────────────────
-- PLAN_INTEGRANTES (vínculos entre personas y planes)
-- ──────────────────────────────────────────────────────────────────────────────

INSERT IGNORE INTO plan_integrantes (plan_numero, persona_id, rol, credencial) VALUES
  (1, 1, 'titular', 'A'),
  (1, 2, 'integrante', 'B'),
  (2, 3, 'titular', 'A'),
  (3, 4, 'titular', 'A'),
  (3, 5, 'integrante', 'B'),
  (4, 6, 'titular', 'A'),
  (5, 7, 'titular', 'A'),
  (5, 8, 'integrante', 'B'),
  (6, 1, 'titular', 'A'),
  (7, 2, 'titular', 'A'),
  (8, 3, 'titular', 'A');

-- ──────────────────────────────────────────────────────────────────────────────
-- Verificación: Contar registros
-- ──────────────────────────────────────────────────────────────────────────────

SELECT
  (SELECT COUNT(*) FROM personas) AS total_personas,
  (SELECT COUNT(*) FROM planes) AS total_planes,
  (SELECT COUNT(*) FROM plan_integrantes) AS total_integrantes,
  (SELECT COUNT(*) FROM cobradores) AS total_cobradores,
  (SELECT COUNT(*) FROM obras_sociales) AS total_obras_sociales,
  (SELECT COUNT(*) FROM tipos_de_plan) AS total_tipos_plan,
  (SELECT COUNT(*) FROM servicios_adicionales) AS total_servicios;
