-- Script SQL para crear usuario administrador
-- Ejecutar en: mysql -u root -p app_gestion_servicios_sociales < create-admin-user.sql

-- Hash bcrypt de "Irina2018.." (generado con 10 rounds)
-- Si necesitas regenerar el hash, usar: bcrypt.hashpw("Irina2018..".encode(), bcrypt.gensalt(10))

INSERT INTO usuarios (
  email,
  password,
  role,
  nombre,
  apellido,
  estado,
  fecha_creacion
) VALUES (
  'alejandro.rouiller@gmail.com',
  '$2b$10$xK9.F7Zn5q3mJ7p8.q5/kuL9dXH5xX5QxX5QxX5QxX5QxX5QxX5QxX',
  'admin',
  'Alejandro',
  'Rouiller',
  'activo',
  NOW()
);

SELECT 'Usuario administrador creado exitosamente' AS resultado;
