# BACKLOG.md

Registro de mejoras y nuevos requerimientos detectados durante la implementación.
Estos ítems se abordan **después** de completar todas las fases del PLAN.md.

## Convención de prioridades
- 🔴 Alta — impacto directo en funcionalidad core
- 🟡 Media — mejora importante pero no bloqueante  
- 🟢 Baja — nice to have

## Convención de estados
- ⏳ Pendiente
- 🔄 En análisis
- ✅ Incorporado al plan
- 🚫 Descartado (con motivo)

## Items

| ID | Prioridad | Estado | Descripción | Contexto / Motivo | Archivos estimados |
|----|-----------|--------|-------------|-------------------|--------------------|
| BACKLOG-001 | 🟡 Media | ⏳ Pendiente | Mejorar preview de aumento de cuotas: navegación completa + comparación antes/después | Descubierto en Fase 3 (BulkUpdateCuotaModal). Actualmente muestra solo primeros 5 planes; usuario necesita validar todos los registros y ver contraste de valores | BulkUpdateCuotaModal.jsx, SCSS |

## Detalles de Items

### BACKLOG-001: Mejorar Preview de Aumento de Cuotas

**Descripción:**
El modal de preview en BulkUpdateCuotaModal muestra actualmente solo los primeros 5 planes afectados. Para validación fehaciente antes de ejecutar un aumento masivo, se necesita:

**Requerimientos:**

a. **Navegación completa de planes**
   - Mostrar todos los planes afectados (no solo primeros 5)
   - Agregar paginación (ej: 10 planes por página) O scroll infinito
   - Permitir búsqueda/filtro dentro del preview para encontrar rápidamente un plan específico

b. **Contraste antes/después de valores**
   - Mostrar en tabla: 
     - Plan # | Afiliado | Valor Actual | Valor Nuevo | Diferencia
   - O columna adicional: "Aumento: +$50 / +10%"
   - Formato visual que resalte la diferencia (color, flecha, etc.)

**Contexto:**
- Descubierto durante implementación de Fase 3
- Usuario no puede validar todos los planes antes de confirmar
- Riesgo: ejecutar aumento sin ver todos los afectados
- Impacto: mejora confiabilidad de operaciones críticas

**Archivos a modificar:**
- `frontend/src/pages/DashboardPage/components/BulkUpdateCuotaModal/BulkUpdateCuotaModal.jsx`
- `frontend/src/pages/DashboardPage/components/BulkUpdateCuotaModal/BulkUpdateCuotaModal.scss`

**Estimación:** 1.5-2 horas (agregar paginación + nueva columna con cálculo dinámico)

**Prioridad:** 🟡 Media — Mejora importante para confiabilidad pero no bloqueante

---

## Items descartados

| ID | Descripción | Motivo descarte |
|----|-------------|-----------------|