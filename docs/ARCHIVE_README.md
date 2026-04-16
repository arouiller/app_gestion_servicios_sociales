# 🔄 Rama Archive: v2.0-grupos-familiares

**Rama:** `archive/v2.0-grupos-familiares`  
**Fecha de Creación:** 2026-04-13  
**Propósito:** Preservar código funcional anterior (v2.0.x) como punto de referencia seguro

---

## ✅ Estado del Código en Esta Rama

Este código **funciona correctamente en producción/desarrollo:**
- ✅ Panel de Migraciones — implementado y funcional
- ✅ CRUD de Lookup (Cobradores, Tipos, Obras, Servicios, Tipos de Grupo) — implementado y funcional
- ✅ Gestión de Afiliados — implementado y funcional
- ✅ Gestión de Grupos Familiares — implementado y funcional
- ✅ Gestión de Planes — implementado y funcional
- ✅ No hay errores en deploy
- ✅ Las páginas se ven correctamente
- ✅ Sistema de temas funcionando
- ✅ Layout responsive (desktop + móvil)

**Migraciones BD:** 1.0.0_usuarios, 2.0.0_grupos_familiares, 2.0.1_lookup_tables, 2.0.2_main_tables

---

## 📝 Documentación de Referencia

El código en esta rama implementa el modelo:
- Tabla `grupos_familiares` — entidad familiar con usuario_id
- Tabla `afiliados` — personas con rol (titular/beneficiario) vinculadas a grupo familiar
- Tabla `planes` — planes con campos JSON (cobertura, beneficios) vinculados a grupo familiar

Ver: `docs/analisis-implementacion-2026-04-13.md` (en rama principal) para comparación con spec 1.0.x

---

## 🔙 Cómo Volver a Esta Rama (Rollback)

Si el refactor a 1.0.x genera problemas y necesitas volver:

### Opción 1: Checkout completo
```bash
git checkout archive/v2.0-grupos-familiares
# Asegúrate de estar en un punto limpio en tu rama actual
# Esto trae TODA la rama anterior
```

### Opción 2: Copiar archivos específicos
```bash
# Copiar archivo específico desde la rama archive
git show archive/v2.0-grupos-familiares:backend/src/controllers/afiliadosController.js > backend/src/controllers/afiliadosController.js

# O revisar diff
git diff main..archive/v2.0-grupos-familiares -- backend/src/models/Plan.js
```

### Opción 3: Revert de commits
Si comenzaste el refactor y quieres revertir:
```bash
# Ver qué commits se hicieron desde archive
git log archive/v2.0-grupos-familiares..HEAD --oneline

# Revertir commit específico
git revert <commit-id>

# O reset hard (CUIDADO: pierde cambios)
git reset --hard archive/v2.0-grupos-familiares
```

---

## 📊 Diferencias vs Rama Principal (1.0.x)

| Componente | v2.0.x (Archive) | v1.0.x (Main) |
|---|---|---|
| Modelo de datos | grupos_familiares + afiliados | personas + plan_integrantes |
| Tabla principal de personas | `afiliados` | `personas` |
| Roles | En tabla `afiliados` | En tabla `plan_integrantes` |
| Planes | Vinculados a grupo familiar | Vinculados a personas vía plan_integrantes |
| Migraciones | 1.0.0, 2.0.0, 2.0.1, 2.0.2 | 1.0.0, 1.0.1, 1.0.2, 1.0.3 |
| Controllers | 6 (incluye grupos, afiliados) | 5 (personas, planes, recibos, lookup, migrations) |

---

## 🎯 Cuándo Usar Esta Rama

✅ **Usar como referencia:**
- Entender estructura de datos anterior
- Copiar componentes UI que funcionaban
- Revisar lógica de controllers que funcionaba
- Debugging de comportamiento específico

❌ **NO usar para:**
- Desarrollo directo (usa rama principal)
- Merging a main (es un archivo, no rama activa)
- Nuevas funcionalidades (implementar en main)

---

## 📌 Importante

Esta rama es de **archivo/referencia**. No se edita directamente. Si necesitas cambios:

1. Copia el código que necesites a rama principal
2. Adapta al modelo 1.0.x
3. Hazlo funcionar
4. Si algo no funciona, vuelve a esta rama para entender la lógica original

---

**Última actualización:** 2026-04-13  
**Creada por:** Claude Code  
**Propósito:** Preservar código funcional v2.0.x como punto seguro de rollback
