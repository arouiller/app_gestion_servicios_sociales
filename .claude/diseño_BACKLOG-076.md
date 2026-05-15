# BACKLOG-076: Navegación por teclado en Gestión de Planes - Enter para abrir + Atajos de Tabs

**Prioridad:** 🔴 Alta  
**Estado:** 📋 Registrado  
**Fecha:** 2026-05-15

---

## Requerimientos

### R1: Reemplazar ALT+G por Enter en lista de planes
- **Contexto:** Actualmente ALT+G abre el plan en edición desde la lista
- **Cambio:** Reemplazar por tecla **Enter**
- **Comportamiento:** Usuario navega con ↑↓ hasta un plan y presiona Enter → abre modal de edición

### R2: Atajos de navegación entre tabs en PlanV1Modal
Cuando el modal de plan está abierto, permitir navegar entre tabs con:
- **ALT+A** → Tab "Afiliados" (integrantes del plan)
- **ALT+R** → Tab "Recibos" (recibos generados)
- **ALT+D** → Tab "Datos Generales" (información base del plan)
- **ALT+H** → Tab "Historial de Cuota" (cambios de cuota históricos)

### R3: Auto-focus en primer componente interactivo del tab
Cuando un usuario presiona ALT+X para cambiar de tab:
1. Tab se activa
2. **Automáticamente**, el primer elemento interactivo del tab recibe el foco
   - "Datos Generales" → input `numero_afiliado`
   - "Afiliados" → tabla de integrantes (o botón "Agregar")
   - "Recibos" → tabla de recibos
   - "Historial de Cuota" → tabla de cambios

---

## Diseño de Implementación

### Ficheros Afectados

#### Frontend
1. **`frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx`**
   - Modificar `handleKeyDown`: Reemplazar ALT+G → Enter
   - Cambio: `if (altKey && key === 'g')` por `if (key === 'enter')`

2. **`frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx`**
   - Agregar nuevo `useEffect` para listener de atajos de tabs
   - Implementar refs a componentes de cada tab para auto-focus
   - Manejar ALT+A, ALT+R, ALT+D, ALT+H

3. **`frontend/src/hooks/useTabNavigation.js`** (CREAR NUEVO HOOK)
   - Hook reutilizable para navegación de tabs por teclado
   - Params: `tabsMap` (objeto con configs de tab: nombre, tecla, ref)
   - Retorna: `setActiveTab`, manejo de eventos

#### Backend
- **Sin cambios** (toda la lógica es UI/frontend)

---

## Arquitectura: Hook useTabNavigation

### Firma
```javascript
function useTabNavigation(tabsConfig, onTabChange) {
  // tabsConfig = {
  //   afiliados: { key: 'a', ref: refAfiliados, focusSelector: 'button.agregar-integrante' },
  //   recibos: { key: 'r', ref: refRecibos, focusSelector: 'table tbody tr:first-child' },
  //   datosgenerales: { key: 'd', ref: refDatos, focusSelector: 'input#numero_afiliado' },
  //   historial: { key: 'h', ref: refHistorial, focusSelector: 'table tbody tr:first-child' }
  // }
  
  return {
    handleTabKeyDown,  // Handler para agregar a window keydown listener
    getCurrentTab,
    // ...
  };
}
```

### Lógica Interna
1. **Listener global:** Detecta ALT+A/R/D/H
2. **Busca correspondencia:** Matchea tecla con config de tab
3. **Cambio de tab:** Llama callback `onTabChange(tabName)`
4. **Auto-focus:** Busca elemento con selector en la ref y llama `.focus()`
5. **Scope:** Solo activo cuando modal está abierto (verificar `modalMode !== null`)

---

## Cambios en GestionPlanesV1.jsx

### Cambio 1: Reemplazar ALT+G → Enter

**Ubicación:** `handleKeyDown` en línea ~155-220

**Actual:**
```javascript
const handleKeyDown = useCallback((e) => {
  if (modalMode || planesFiltered.length === 0) return;
  
  const key = e.key.toLowerCase();
  const altKey = e.altKey;
  
  // ALT+G: Editar fila activa
  if (altKey && key === 'g') {
    e.preventDefault();
    const activeRow = planesFiltered.find(p => p.plan_numero === activeRowId);
    if (activeRow) {
      handleEditarPlan(activeRow);
    }
    return;
  }
  
  // ... resto de navegación
```

**Nuevo:**
```javascript
const handleKeyDown = useCallback((e) => {
  if (modalMode || planesFiltered.length === 0) return;
  
  const key = e.key.toLowerCase();
  
  // Enter: Editar fila activa (reemplaza ALT+G)
  if (key === 'enter') {
    e.preventDefault();
    const activeRow = planesFiltered.find(p => p.plan_numero === activeRowId);
    if (activeRow) {
      handleEditarPlan(activeRow);
    }
    return;
  }
  
  // ... resto de navegación
```

---

## Cambios en PlanV1Modal.jsx

### Cambio 1: Importar hook y crear refs

```javascript
import useTabNavigation from '../../../../hooks/useTabNavigation';

function PlanV1Modal({ mode, planData, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('datos'); // Por defecto: Datos Generales
  
  // Crear refs para cada componente de tab
  const refDatos = useRef(null);
  const refAfiliados = useRef(null);
  const refRecibos = useRef(null);
  const refHistorial = useRef(null);
```

### Cambio 2: Configurar y usar hook

```javascript
  // Configurar navegación de tabs
  const tabsConfig = {
    datos: {
      key: 'd',
      ref: refDatos,
      focusSelector: 'input#numero_afiliado', // Primer input de Datos
      name: 'datos'
    },
    afiliados: {
      key: 'a',
      ref: refAfiliados,
      focusSelector: 'button.plan-v1-modal__btn-agregar-integrante', // Botón "Agregar"
      name: 'afiliados'
    },
    recibos: {
      key: 'r',
      ref: refRecibos,
      focusSelector: 'table tbody tr:first-child td:first-child', // Primera celda de tabla
      name: 'recibos'
    },
    historial: {
      key: 'h',
      ref: refHistorial,
      focusSelector: 'table tbody tr:first-child td:first-child', // Primera celda de tabla
      name: 'historial'
    }
  };

  const { handleTabKeyDown } = useTabNavigation(tabsConfig, (tabName) => {
    setActiveTab(tabName);
  });

  // Agregar listener global para atajos de tabs
  useEffect(() => {
    window.addEventListener('keydown', handleTabKeyDown);
    return () => {
      window.removeEventListener('keydown', handleTabKeyDown);
    };
  }, [handleTabKeyDown]);

  // Auto-focus cuando cambia tab
  useEffect(() => {
    const tabConfig = tabsConfig[activeTab];
    if (tabConfig && tabConfig.ref?.current) {
      const focusTarget = tabConfig.ref.current.querySelector(tabConfig.focusSelector);
      if (focusTarget) {
        setTimeout(() => focusTarget.focus(), 100); // Pequeño delay para asegurar render
      }
    }
  }, [activeTab]);
```

### Cambio 3: Asignar refs a los tabs

**En el JSX de renderizado de tabs:**

```jsx
<div className="plan-v1-modal__tabs">
  {/* ... */}
  
  {activeTab === 'datos' && (
    <div ref={refDatos} className="plan-v1-modal__tab-pane">
      {/* Contenido de Datos Generales */}
    </div>
  )}
  
  {activeTab === 'afiliados' && (
    <div ref={refAfiliados} className="plan-v1-modal__tab-pane">
      {/* Contenido de Afiliados */}
    </div>
  )}
  
  {activeTab === 'recibos' && (
    <div ref={refRecibos} className="plan-v1-modal__tab-pane">
      {/* Contenido de Recibos */}
    </div>
  )}
  
  {activeTab === 'historial' && (
    <div ref={refHistorial} className="plan-v1-modal__tab-pane">
      {/* Contenido de Historial */}
    </div>
  )}
</div>
```

---

## Hook useTabNavigation.js (CREAR)

**Ubicación:** `frontend/src/hooks/useTabNavigation.js`

```javascript
import { useCallback } from 'react';

/**
 * Hook para navegación por teclado entre tabs
 * @param {Object} tabsConfig - Configuración de tabs
 *   {
 *     tabName: {
 *       key: 'a',  // Tecla sin ALT
 *       ref: refTab,  // Ref al componente del tab
 *       focusSelector: 'css-selector',  // Selector CSS para elemento a enfocar
 *       name: 'tabName'  // Nombre identificador
 *     }
 *   }
 * @param {Function} onTabChange - Callback cuando cambia tab
 */
function useTabNavigation(tabsConfig, onTabChange) {
  const handleTabKeyDown = useCallback((e) => {
    // Solo si ALT está presionado
    if (!e.altKey) return;

    const key = e.key.toLowerCase();

    // Buscar tab que corresponda a esta tecla
    let targetTab = null;
    for (const [tabName, config] of Object.entries(tabsConfig)) {
      if (config.key === key) {
        targetTab = tabName;
        break;
      }
    }

    if (targetTab) {
      e.preventDefault();
      onTabChange(targetTab);
    }
  }, [tabsConfig, onTabChange]);

  return {
    handleTabKeyDown
  };
}

export default useTabNavigation;
```

---

## Testing Plan

| Escenario | Acción | Resultado Esperado |
|-----------|--------|-------------------|
| **T1** | En lista, navegar a plan, presionar Enter | Modal se abre con plan seleccionado |
| **T2** | Modal abierto en "Datos", presionar ALT+A | Tab cambia a "Afiliados", foco en botón Agregar |
| **T3** | Modal abierto en "Datos", presionar ALT+R | Tab cambia a "Recibos", foco en tabla |
| **T4** | Modal abierto en "Datos", presionar ALT+D | Permanece en "Datos", foco en primer input |
| **T5** | Modal abierto en "Datos", presionar ALT+H | Tab cambia a "Historial", foco en tabla |
| **T6** | Combinar: Enter para abrir, ALT+A para ir a Afiliados | Secuencia fluida sin errores |
| **T7** | ALT+G en lista con modal abierto | No funciona (evento no se dispara por modalMode check) |
| **T8** | Presionar atajos sin ALT en lista | No hace nada (lista ignora atajos de tab) |

---

## Notas de Implementación

### Dependencias
- No hay dependencias nuevas (React built-in)

### Compatibilidad
- ✅ Todos los navegadores modernos soportan ALT + tecla
- ⚠️ En Mac, ALT es ⌥ (Option) — comportamiento nativo del sistema

### Consideraciones UX
- **Feedback visual:** Cuando cambia tab por teclado, tab debe resaltarse visualmente (ya está implementado en PlanV1Modal)
- **Secuencia intuitiva:** ALT+D (Datos), ALT+A (Afiliados), ALT+H (Historial), ALT+R (Recibos)
  - Nota: Orden no es alfabético, es flujo lógico del usuario
- **Auto-scroll:** Si el elemento a enfocar está fuera de viewport, navegador hace scroll automático

### Posibles Mejoras Futuras
- Mostrar hints de atajos en el modal (ej: "ALT+A para Afiliados")
- Atajos para botones de acción (ALT+S para Guardar, ESC para Cancelar)
- Navegación de campos dentro de un tab con TAB (ya existe, no cambiar)

---

## Estimación

| Tarea | Horas | Notas |
|-------|-------|-------|
| Crear hook useTabNavigation | 0.5h | Simple, lógica recta |
| Modificar GestionPlanesV1.jsx | 0.25h | Cambio mínimo (ALT+G → Enter) |
| Modificar PlanV1Modal.jsx | 1.5h | Agregar refs, integrar hook, testing |
| Testing manual | 0.75h | 8 escenarios |
| **Total** | **3h** | |

---

## Dependencias Bloqueantes
- ✅ Ninguna (feature independiente de Fase 2)
- ✅ Puede implementarse en paralelo o después de Fase 2
