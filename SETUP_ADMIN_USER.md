# Setup: Crear Usuario Administrador

## Requisito para Fase 4 (Resetear limpio)

Antes de ejecutar las migraciones 1.0.x, necesitas crear un usuario administrador en la BD.

**Credenciales:**
- Email: `alejandro.rouiller@gmail.com`
- Password: `Irina2018..`
- Role: `admin`

---

## Opción 1: Usar Script Node.js (Recomendado)

```bash
cd backend
npm install  # Si no lo hiciste
node src/scripts/create-admin-user.js
```

**Requisitos:** Node.js y npm instalados

---

## Opción 2: Usar MySQL CLI (Manual)

### Paso 1: Generar hash bcrypt

Ejecuta esto en Node.js o Python:

**Con Node.js:**
```bash
node -e "
const bcrypt = require('bcryptjs');
bcrypt.hash('Irina2018..', 10, (err, hash) => {
  if (err) throw err;
  console.log('Hash bcrypt:', hash);
});
"
```

**Con Python:**
```bash
python3 -c "
import bcrypt
password = 'Irina2018..'
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(10)).decode()
print('Hash bcrypt:', hashed)
"
```

### Paso 2: Copiar el hash generado

El output será algo como:
```
$2b$10$xXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx
```

### Paso 3: Ejecutar INSERT en MySQL

Conéctate a tu BD MySQL:

```bash
mysql -h localhost -u root -p app_gestion_servicios_sociales
```

Ejecuta este comando (reemplaza `[HASH_AQUI]` con el hash del Paso 2):

```sql
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
  '[HASH_AQUI]',
  'admin',
  'Alejandro',
  'Rouiller',
  'activo',
  NOW()
);

SELECT * FROM usuarios WHERE email = 'alejandro.rouiller@gmail.com';
```

---

## Opción 3: Usar archivo SQL directo

**Solo si tienes permisos para ejecutar SQL desde archivo:**

```bash
mysql -u root -p app_gestion_servicios_sociales < backend/src/scripts/create-admin-user.sql
```

---

## Verificación

Una vez creado el usuario, puedes verificar con:

```sql
SELECT id, email, role FROM usuarios WHERE email = 'alejandro.rouiller@gmail.com';
```

Deberías ver:
```
id: <número>
email: alejandro.rouiller@gmail.com
role: admin
```

---

## Siguiente Paso

Una vez el usuario administrador esté creado, ejecuta Fase 4:

```bash
# Ejecutar migraciones 1.0.x en la BD
# Las migraciones crearán las tablas 1.0.1, 1.0.2, 1.0.3 en la BD
```

---

**Fecha:** 2026-04-13  
**Fase:** 4 - Migración de Datos (Opción A: Resetear Limpio)
