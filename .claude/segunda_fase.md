# Fase 2: Cambios en Tabla de Gestión de Planes

## Requerimientos

**BACKLOG-072:** Búsqueda en gestión de planes - filtrar solo por apellido del titular
- Actualmente busca en: tipo de plan, cobrador (nombre y apellido), obra social, persona (nombre y apellido)
- Requerimiento: buscar SOLO en `plan.PlanIntegrantes[0].Persona.apellido`

**BACKLOG-073:** Navegación por teclado en gestión de planes con registro activo
- Implementar concepto de "registro activo" en tabla de planes
- Navegación: ↑/↓ (un registro), scroll ↑/↓ (10 registros)
- Al alcanzar inicio/fin de página, cambiar automáticamente de página
- ALT+G abre el plan activo en modo editar
- Visual: fila resaltada con borde izquierdo grueso y coloreado
- Reset al primero cuando hay cambios en filtro/búsqueda/ordenamiento

## Archivos a Modificar

### GestionPlanesV1.jsx
- Búsqueda: cambiar lógica de filtrado (líneas ~105-114)
- Estado: agregar `activeRowId` para rastrear registro activo
- Handlers: agregar `handleKeyDown` para navegación con teclado
- Render: agregar clase `.active` a fila activa, agregar el listener de keydown

### usePagination.js (posible creación de hook)
- Si no existe, crear hook para manejar lógica de paginación
- Si existe, extender para soportar navegación por teclado

### GestionPlanesV1.scss
- Agregar estilos para fila activa: `.gestion-planes-v1__row--active` con borde izquierdo

## Consideraciones de Implementación

1. **Búsqueda (BACKLOG-072):**
   - Cambio simple en la lógica de filtrado
   - No afecta API ni base de datos
   - Cambio puramente en frontend

2. **Navegación por teclado (BACKLOG-073):**
   - Requiere estado local en GestionPlanesV1
   - Listener global de keyboard events
   - Lógica de paginación automática
   - ALT+G abre modal de edición

3. **Interacciones:**
   - Si usuario ordena: reset active row al primero
   - Si usuario busca/filtra: reset active row al primero
   - Si usuario cambia página: mantener active row si sigue siendo visible, sino reset
   - Si usuario elimina un plan: active row salta al siguiente

## Estimación

- BACKLOG-072: ~30 minutos
- BACKLOG-073: ~2-3 horas (incluye testing)
- Testing completo: ~30 minutos

Total: ~4-5 horas

## Prioridad

Ambas marcadas como 🔴 CRÍTICO/ALTA, pero BACKLOG-072 es más simple y se puede completar primero.

## Notas

- No hay cambios en backend
- No requiere cambios en servicios o API
- Toda la lógica es frontend-side
- Testing manual es crítico para navegación por teclado
