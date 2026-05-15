# Spec: Eliminar Plan con Confirmación de Cascada

**Documento:** Diseño de implementación para BACKLOG-067
**Fecha:** 2026-05-15
**Estado:** Aprobado

---

## Resumen Ejecutivo

Reemplazar el flujo simple de suspensión de planes con un flujo dual que permite al usuario elegir entre:
1. **Suspender** (reversible): Cambiar estado a SUSPENDIDO
2. **Eliminar** (irreversible): Eliminación permanente en cascada con confirmación adicional

El flujo utiliza dos modales secuenciales para proteger contra eliminaciones accidentales.

---

## Requerimientos Funcionales

### RF-1: Primer Modal - Opción de Acción

**Trigger:** Usuario hace clic en ícono delete en la tabla de planes (solo visible si plan está en ACTIVO)

**Contenido del Modal:**
- Título: "¿Qué deseas hacer con este plan?"
- Identificador del plan: `zona_codigo-numero_afiliado` (ej: "01-00042")
- Titular del plan: Nombre del titular para claridad
- Dos opciones:
  * **Botón "Suspender Plan"** (primario, reversible)
    - Cambiar estado a SUSPENDIDO
    - Mantener datos intactos (recuperables)
  * **Botón "Eliminar Plan"** (destructivo, rojo)
    - Avanzar a segundo modal de confirmación irreversible

**Comportamiento:**
- Cierra con botón X, click fuera (backdrop), o ESC
- Deshabilita botones mientras se procesa
- Durante suspensión: muestra "Suspendiendo..."
- Si suspensión es exitosa: toast de éxito, recarga tabla, cierra modal
- Si hay error: muestra toast con mensaje del servidor

### RF-2: Segundo Modal - Confirmación Irreversible

**Trigger:** Usuario hace clic en "Eliminar Plan" en el primer modal

**Contenido del Modal:**
- Título: "⚠️ Confirmar Eliminación Permanente"
- Advertencia destacada en rojo: "Esta acción no se puede deshacer"
- Identificador del plan (zona-número y titular)
- Lista clara de qué se eliminará:
  * "Todos los integrantes/afiliados del plan"
  * "Todos los recibos generados"
  * "Todo el historial de cuotas"
  * "Todos los servicios adicionales asociados"
- Dos opciones:
  * **Botón "Cancelar"** (primario)
    - Vuelve al primer modal
  * **Botón "Sí, Eliminar Permanentemente"** (destructivo, rojo)
    - Ejecuta eliminación en cascada

**Comportamiento:**
- Cierra con botón X o "Cancelar"
- Deshabilita botones mientras se procesa
- Durante eliminación: muestra "Eliminando..."
- Si hay error: muestra mensaje de error en el modal (no desaparece, permite reintentar)
- Si eliminación es exitosa: toast de éxito, recarga tabla, cierra ambos modales

### RF-3: Restricciones de Visibilidad

**Frontend:**
- Botón delete visible para cualquier estado de plan (ACTIVO, SUSPENDIDO, etc.)
- Cualquier plan puede eliminarse desde la UI

**Backend:**
- Endpoint permite eliminar cualquier plan sin restricción de estado
- Validación: plan debe existir (404 si no)

### RF-4: Autorización

- Cualquier usuario autenticado puede eliminar planes
- No hay restricción de rol (admin o usuario común)

### RF-5: Eliminación en Cascada

**Orden de eliminación (transacción atómica):**
1. Eliminar IntegranteServicio (servicios adicionales de integrantes)
2. Eliminar PlanIntegrante (integrantes/afiliados del plan)
3. Eliminar ReciboIntegrante (líneas de cada recibo)
4. Eliminar Recibo (recibos del plan)
5. Eliminar HistorialCuota (historial de cambios de cuota)
6. Eliminar Plan (el plan mismo)

**Garantías:**
- Transacción: Si falla en cualquier paso, rollback total
- Consistencia referencial: Todas las FKs respetadas
- Auditoría: Eliminación registrada en AuditLog

---

## Arquitectura de Componentes

### Nuevos Componentes

#### ConfirmDeletePlanModal.jsx
**Propósito:** Primer modal con opciones Suspender/Eliminar

**Props:**
```javascript
{
  isOpen: boolean,              // Visibilidad del modal
  plan: {                        // Objeto plan seleccionado
    plan_numero: number,
    numero_afiliado: string,
    zona_id: number,
    zona: { codigo: string },   // Zona relacionada
    titular: {                   // Titular del plan
      apellido: string,
      nombre: string,
    }
  },
  onSuspend: async () => void,  // Callback: suspender
  onDelete: () => void,         // Callback: ir a modal 2
  onCancel: () => void,         // Callback: cerrar
  isLoading: boolean,           // Estado de procesamiento
}
```

**Features:**
- Reutiliza estilos de ConfirmDeletePeriodoRecibosModal
- Muestra identificador zona-número y titular
- ESC cierra modal
- Click fuera cierra modal
- Manejo de loading state en botones

#### ConfirmDeletePlanPermanentModal.jsx
**Propósito:** Segundo modal con confirmación irreversible

**Props:**
```javascript
{
  isOpen: boolean,
  plan: { /* mismo objeto que arriba */ },
  onConfirm: async () => void,  // Callback: eliminar permanentemente
  onCancel: () => void,         // Callback: volver a modal 1
  isLoading: boolean,
  error: string | null,         // Mensaje de error si existe
}
```

**Features:**
- Advertencia destacada con ⚠️ en rojo
- Lista clara de qué se eliminará
- Muestra error en el modal (no desaparece) para reintentos
- ESC cierra modal (vuelve a modal 1)
- Botones deshabilitados durante processing

### Cambios en Componentes Existentes

#### GestionPlanesV1.jsx

**Nuevo estado:**
```javascript
const [deleteModalState, setDeleteModalState] = useState({
  firstModal: false,   // Modal 1 abierto
  secondModal: false,  // Modal 2 abierto
  selectedPlan: null,  // Plan siendo eliminado
  isLoading: false,    // Durante procesamiento
  error: null,         // Mensaje de error
});
```

**Nuevas funciones:**
```javascript
// Abre primer modal
const handleDeletePlan = (plan) => {
  setDeleteModalState({
    firstModal: true,
    secondModal: false,
    selectedPlan: plan,
    isLoading: false,
    error: null,
  });
};

// Suspender desde modal 1
const handleSuspendFromModal = async (plan) => {
  setDeleteModalState(prev => ({ ...prev, isLoading: true }));
  try {
    await planesV1Service.suspender(plan.plan_numero);
    mostrarMensaje('Plan suspendido correctamente', 'success');
    setDeleteModalState({
      firstModal: false,
      secondModal: false,
      selectedPlan: null,
      isLoading: false,
      error: null,
    });
    cargar();
  } catch (err) {
    mostrarMensaje(
      err.response?.data?.message || 'Error al suspender plan',
      'error'
    );
    setDeleteModalState(prev => ({ ...prev, isLoading: false }));
  }
};

// Avanza a modal 2
const handleDeleteChoice = () => {
  setDeleteModalState(prev => ({
    ...prev,
    firstModal: false,
    secondModal: true,
    error: null,
  }));
};

// Vuelve a modal 1
const handleBackToFirstModal = () => {
  setDeleteModalState(prev => ({
    ...prev,
    firstModal: true,
    secondModal: false,
    error: null,
  }));
};

// Cierra ambos modales
const handleCloseDeleteModal = () => {
  setDeleteModalState({
    firstModal: false,
    secondModal: false,
    selectedPlan: null,
    isLoading: false,
    error: null,
  });
};

// Confirma eliminación permanente
const handleConfirmPermanentDelete = async () => {
  const { selectedPlan } = deleteModalState;
  setDeleteModalState(prev => ({ ...prev, isLoading: true, error: null }));
  try {
    await planesV1Service.deletePermanently(selectedPlan.plan_numero);
    mostrarMensaje('Plan eliminado definitivamente', 'success');
    setDeleteModalState({
      firstModal: false,
      secondModal: false,
      selectedPlan: null,
      isLoading: false,
      error: null,
    });
    cargar();
  } catch (err) {
    setDeleteModalState(prev => ({
      ...prev,
      isLoading: false,
      error: err.response?.data?.message || 'Error al eliminar plan',
    }));
  }
};
```

**Cambio en tabla:**
- Botón delete llama a `handleDeletePlan(plan)` en lugar de `handleSuspenderPlan(plan)`
- Condición de visibilidad: solo si `plan.estado === 'ACTIVO'` (igual que ahora)

**Render de modales:**
```javascript
<ConfirmDeletePlanModal
  isOpen={deleteModalState.firstModal}
  plan={deleteModalState.selectedPlan}
  onSuspend={handleSuspendFromModal}
  onDelete={handleDeleteChoice}
  onCancel={handleCloseDeleteModal}
  isLoading={deleteModalState.isLoading}
/>

{deleteModalState.secondModal && (
  <ConfirmDeletePlanPermanentModal
    isOpen={deleteModalState.secondModal}
    plan={deleteModalState.selectedPlan}
    onConfirm={handleConfirmPermanentDelete}
    onCancel={handleBackToFirstModal}
    isLoading={deleteModalState.isLoading}
    error={deleteModalState.error}
  />
)}
```

---

## Cambios en Backend

### Nuevo Endpoint: DELETE /v1.0/planes/:planNumero

**Método:** DELETE
**Ruta:** `/v1.0/planes/:planNumero`
**Autenticación:** Requerida (JWT)
**Autorización:** Cualquier usuario autenticado

**Parámetros:**
- `planNumero` (URL param): Número del plan a eliminar

**Validaciones:**
- Plan debe existir (404 si no)
- Plan debe ser un número válido

**Lógica:**
1. Iniciar transacción Sequelize
2. Buscar plan (404 si no existe)
3. Eliminar en cascada (ver orden en RF-5)
4. Registrar en AuditLog
5. Commit transacción
6. Retornar respuesta exitosa

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Plan eliminado correctamente",
  "data": {
    "plan_numero": 123
  }
}
```

**Respuesta error (404):**
```json
{
  "success": false,
  "message": "Plan no encontrado",
  "code": "PLAN_NOT_FOUND"
}
```

**Respuesta error (500):**
```json
{
  "success": false,
  "message": "Error al eliminar plan: [detalle]",
  "code": "DELETE_PLAN_ERROR"
}
```

### Cambios en planesV1Service (Frontend)

**Nuevo método:**
```javascript
// Eliminar plan permanentemente
deletePermanently: async (planNumero) => {
  const { data } = await api.delete(`/v1.0/planes/${planNumero}`);
  return data.data;
},
```

### Cambios en Models (Backend)

**HistorialCuota.js:**
- Agregar asociación con onDelete: CASCADE (si no existe)

---

## Flujo Completo

```
[Usuario en tabla GestionPlanesV1]
         ↓
  [Click ícono delete]
         ↓
  [Plan.estado === 'ACTIVO'?]
     ↙        ↘
   NO          SÍ
   ↓           ↓
 (No pasa) [Abre Modal 1]
            ↓
    [Elige Suspender?]
    ↙                ↘
   SÍ                NO
   ↓                 ↓
[Suspender]     [Abre Modal 2]
   ↓                 ↓
[Toast]         [Elige Eliminar?]
[Recarga]       ↙                ↘
[Cierra]       NO                SÍ
             ↓                 ↓
          [Vuelve]      [DELETE endpoint]
          [a Modal 1]         ↓
                        [Cascada eliminación]
                              ↓
                        [Toast exitoso]
                        [Recarga tabla]
                        [Cierra Modal 2]
                        [Cierra Modal 1]
```

---

## Consideraciones de UX

1. **Claridad del identificador:** Mostrar `zona_codigo-numero_afiliado` para evitar confusiones
2. **Advertencia visual:** ⚠️ en rojo, texto claro de irreversibilidad
3. **Protección contra accidentes:** Dos pasos, dos confirmaciones
4. **Manejo de errores:** Errores en Modal 2 permiten reintentar sin cerrar
5. **Feedback inmediato:** Toast de éxito con audibilidad (si browser lo permite)
6. **Accesibilidad:** ESC cierra modales, aria-labels, keyboard navigation

---

## Consideraciones de Seguridad

1. **Autorización:** Solo usuarios autenticados
2. **Atomicidad:** Transacción BD garantiza consistencia
3. **Auditoría:** Eliminación registrada en AuditLog
4. **Validación:** Plan debe existir antes de eliminar
5. **Cascada controlada:** Orden explícita de eliminación, no confiar en FK automática

---

## Archivos Afectados

### Nuevos:
- `frontend/src/components/ConfirmDeletePlanModal/ConfirmDeletePlanModal.jsx`
- `frontend/src/components/ConfirmDeletePlanModal/ConfirmDeletePlanModal.scss`
- `frontend/src/components/ConfirmDeletePlanPermanentModal/ConfirmDeletePlanPermanentModal.jsx`
- `frontend/src/components/ConfirmDeletePlanPermanentModal/ConfirmDeletePlanPermanentModal.scss`

### Modificados:
- `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx`
- `frontend/src/services/planesV1Service.js`
- `backend/src/routes/v1.0-planes.js`
- `backend/src/controllers/v1.0/planesController.js`
- `backend/src/models/HistorialCuota.js` (si aplica)
- `backend/src/models/index.js` (si aplica)

---

## Testing

### Casos de prueba:

**Frontend:**
1. [ ] Modal 1 abre correctamente con plan seleccionado
2. [ ] Botón "Suspender" ejecuta suspensión y recarga tabla
3. [ ] Botón "Eliminar" abre Modal 2
4. [ ] Modal 2 muestra lista correcta de qué se eliminará
5. [ ] Botón "Cancelar" en Modal 2 vuelve a Modal 1
6. [ ] Botón "Sí, Eliminar" ejecuta eliminación
7. [ ] Toast de éxito aparece tras suspensión
8. [ ] Toast de éxito aparece tras eliminación
9. [ ] Tabla se recarga tras cada acción
10. [ ] ESC cierra Modal 1 y Modal 2
11. [ ] Click fuera cierra modales

**Backend:**
1. [ ] DELETE endpoint retorna 404 si plan no existe
2. [ ] DELETE endpoint elimina plan y cascada correctamente
3. [ ] Todos los PlanIntegrante del plan son eliminados
4. [ ] Todos los HistorialCuota del plan son eliminados
5. [ ] Todos los Recibo del plan son eliminados
6. [ ] Todos los ReciboIntegrante son eliminados
7. [ ] AuditLog registra la eliminación
8. [ ] Si falla en cascada, rollback y retorna error

---

## Notas de Implementación

1. Reutilizar estilos de ConfirmDeletePeriodoRecibosModal para consistencia
2. Usar el patrón de `mostrarMensaje()` existente para toasts
3. Asegurarse de que los datos del plan (titular, zona) se cargan correctamente en modales
4. Considerar agregar indicador visual de planes ELIMINADOS en la tabla (quizá grayed out o con badge)
5. Documentar el endpoint DELETE en OpenAPI/Swagger si aplica
