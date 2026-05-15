# Eliminación de Recibos por Período — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar capacidad de eliminar todos los recibos de un período desde la vista de períodos, con confirmación simple que muestre período y cantidad.

**Architecture:** 
- Frontend: Nuevo modal reutilizable `ConfirmDeletePeriodoRecibosModal` + cambios en `RecibosPage.jsx` para agregar botón eliminar en tabla de períodos
- Backend: Endpoint DELETE `/api/recibos/periodo/:periodo` que elimina en cascada (Recibo + ReciboIntegrante + PeriodosRecibos)
- Service: Método `deletePeriodo()` en `recibosService.js`

**Tech Stack:** React (frontend), Express + Sequelize (backend)

---

## File Structure

**Frontend (Create)**:
- `frontend/src/components/ConfirmDeletePeriodoRecibosModal/ConfirmDeletePeriodoRecibosModal.jsx` — Modal de confirmación
- `frontend/src/components/ConfirmDeletePeriodoRecibosModal/ConfirmDeletePeriodoRecibosModal.scss` — Estilos del modal

**Frontend (Modify)**:
- `frontend/src/pages/RecibosPage/RecibosPage.jsx` — Agregar icono delete, estado modal, handlers
- `frontend/src/services/recibosService.js` — Agregar método `deletePeriodo()`

**Backend (Modify)**:
- `backend/src/routes/recibos.js` — Agregar ruta DELETE
- `backend/src/controllers/v1.0/recibosController.js` — Agregar controlador `deletePeriodo`

---

## Tasks

### Task 1: Crear componente `ConfirmDeletePeriodoRecibosModal.jsx`

**Files:**
- Create: `frontend/src/components/ConfirmDeletePeriodoRecibosModal/ConfirmDeletePeriodoRecibosModal.jsx`

- [ ] **Step 1: Crear archivo del componente**

Crear nuevo archivo con el siguiente contenido:

```javascript
import React from 'react';
import './ConfirmDeletePeriodoRecibosModal.scss';

/**
 * Modal de confirmación para eliminar todos los recibos de un período
 *
 * Props:
 * - isOpen: boolean - si modal está visible
 * - periodo: string - período en formato YYYY-MM (ej: "2026-04")
 * - cantidad: number - cantidad de recibos a eliminar
 * - onConfirm: function - callback cuando usuario confirma
 * - onCancel: function - callback cuando usuario cancela
 * - isLoading: boolean - si está en proceso de eliminación
 * - error: string - mensaje de error si la eliminación falló
 */
function ConfirmDeletePeriodoRecibosModal({
  isOpen,
  periodo,
  cantidad,
  onConfirm,
  onCancel,
  isLoading = false,
  error = null,
}) {
  if (!isOpen) return null;

  // Formatear período YYYY-MM a texto legible
  const formatPeriodo = (periodoStr) => {
    if (!periodoStr || periodoStr.length < 7) return '';
    const [anio, mesNum] = periodoStr.substring(0, 7).split('-');
    const nombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${nombres[parseInt(mesNum, 10) - 1]} ${anio}`;
  };

  const pluralRecibos = cantidad === 1 ? 'recibo' : 'recibos';

  return (
    <>
      {isOpen && (
        <div className="confirm-delete-backdrop" onClick={onCancel} />
      )}
      <div className={`confirm-delete-modal${isOpen ? ' confirm-delete-modal--open' : ''}`}>
        <div className="confirm-delete-modal__header">
          <h2 className="confirm-delete-modal__title">
            ⚠️ ¿Eliminar recibos?
          </h2>
          <button
            className="confirm-delete-modal__close"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="confirm-delete-modal__body">
          <div className="confirm-delete-modal__info-block">
            <div className="confirm-delete-modal__info-item">
              <strong>Período:</strong> {formatPeriodo(periodo)}
            </div>
            <div className="confirm-delete-modal__info-item">
              <strong>Cantidad:</strong> {cantidad} {pluralRecibos}
            </div>
          </div>

          <div className="confirm-delete-modal__alert">
            <p className="confirm-delete-modal__warning">
              ⚠️ Esta acción no se puede deshacer.
            </p>
          </div>

          {error && (
            <div className="confirm-delete-modal__error">
              <p>❌ Error: {error}</p>
            </div>
          )}
        </div>

        <div className="confirm-delete-modal__footer">
          <button
            className="confirm-delete-modal__btn confirm-delete-modal__btn--cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            className="confirm-delete-modal__btn confirm-delete-modal__btn--confirm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Eliminando...' : 'Sí, Eliminar'}
          </button>
        </div>
      </div>
    </>
  );
}

export default ConfirmDeletePeriodoRecibosModal;
```

- [ ] **Step 2: Verificar que el archivo se creó correctamente**

```bash
ls -la frontend/src/components/ConfirmDeletePeriodoRecibosModal/
```

Expected: Archivo `ConfirmDeletePeriodoRecibosModal.jsx` listado.

---

### Task 2: Crear estilos `ConfirmDeletePeriodoRecibosModal.scss`

**Files:**
- Create: `frontend/src/components/ConfirmDeletePeriodoRecibosModal/ConfirmDeletePeriodoRecibosModal.scss`

- [ ] **Step 1: Crear archivo de estilos**

Crear nuevo archivo con el siguiente contenido (basado en el patrón de `ConfirmDeleteWithRefsModal.scss`):

```scss
// Modal de confirmación para eliminar recibos por período

.confirm-delete-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.confirm-delete-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.95);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: all var(--transition-normal);
  max-width: 500px;
  width: 90vw;

  &--open {
    opacity: 1;
    pointer-events: auto;
    transform: translate(-50%, -50%) scale(1);
  }
}

.confirm-delete-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
  gap: 1rem;
}

.confirm-delete-modal__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.confirm-delete-modal__close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-xs);
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    background-color: var(--color-bg-soft);
    color: var(--color-text);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.confirm-delete-modal__body {
  padding: 1.5rem;
}

.confirm-delete-modal__info-block {
  background-color: var(--color-bg-soft);
  border-left: 4px solid var(--color-primary);
  padding: 1rem;
  border-radius: var(--radius-xs);
  margin-bottom: 1rem;
}

.confirm-delete-modal__info-item {
  margin: 0.5rem 0;
  font-size: 0.95rem;
  color: var(--color-text);

  &:last-child {
    margin-bottom: 0;
  }

  strong {
    color: var(--color-text);
    margin-right: 0.5rem;
  }
}

.confirm-delete-modal__alert {
  background-color: rgba(var(--color-danger-rgb), 0.1);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-xs);
  padding: 1rem;
  margin-bottom: 1rem;
}

.confirm-delete-modal__warning {
  margin: 0;
  color: var(--color-danger);
  font-weight: 500;
}

.confirm-delete-modal__error {
  background-color: rgba(var(--color-danger-rgb), 0.1);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-xs);
  padding: 1rem;
  margin-bottom: 1rem;

  p {
    margin: 0;
    color: var(--color-danger);
    font-size: 0.9rem;
  }
}

.confirm-delete-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.5rem;
  border-top: 1px solid var(--color-border);
}

.confirm-delete-modal__btn {
  padding: 0.5rem 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xs);
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  min-width: 100px;

  &--cancel {
    background-color: var(--color-surface);
    color: var(--color-text);

    &:hover:not(:disabled) {
      background-color: var(--color-bg-soft);
      border-color: var(--color-text-muted);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &--confirm {
    background-color: var(--color-danger);
    color: #fff;
    border-color: var(--color-danger);

    &:hover:not(:disabled) {
      background-color: var(--color-danger-hover);
      border-color: var(--color-danger-hover);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
```

- [ ] **Step 2: Verificar que el archivo se creó correctamente**

```bash
ls -la frontend/src/components/ConfirmDeletePeriodoRecibosModal/
```

Expected: Archivos `ConfirmDeletePeriodoRecibosModal.jsx` y `.scss` listados.

---

### Task 3: Agregar método `deletePeriodo` a `recibosService.js`

**Files:**
- Modify: `frontend/src/services/recibosService.js`

- [ ] **Step 1: Leer el archivo actual**

```bash
cat frontend/src/services/recibosService.js
```

- [ ] **Step 2: Agregar método `deletePeriodo` al final antes del export**

Agregar este código justo antes de `export default recibosService;` (antes de la línea final):

```javascript
  /**
   * DELETE /api/recibos/periodo/:periodo
   * Elimina todos los recibos de un período
   * @param {string} periodo - período en formato YYYY-MM
   */
  deletePeriodo: async (periodo) => {
    try {
      const response = await api.delete(`/recibos/periodo/${periodo}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
```

- [ ] **Step 3: Verificar sintaxis**

```bash
cd frontend && npm run lint
```

Expected: Sin errores de ESLint.

---

### Task 4: Actualizar `RecibosPage.jsx` — Agregar estado modal

**Files:**
- Modify: `frontend/src/pages/RecibosPage/RecibosPage.jsx:27-54`

- [ ] **Step 1: Agregar estado del modal**

En la sección de estados (después de la línea 44), agregar:

```javascript
  // Delete modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    periodo: null,
    cantidad: 0,
    isLoading: false,
    error: null,
  });
```

---

### Task 5: Actualizar `RecibosPage.jsx` — Importar componente y IconButton

**Files:**
- Modify: `frontend/src/pages/RecibosPage/RecibosPage.jsx:1-7`

- [ ] **Step 1: Agregar imports**

Después de la línea 5 (`import ReciboDetalleModal from...`), agregar:

```javascript
import ConfirmDeletePeriodoRecibosModal from '../../components/ConfirmDeletePeriodoRecibosModal/ConfirmDeletePeriodoRecibosModal';
import IconButton from '../../components/IconButton/IconButton';
```

---

### Task 6: Actualizar `RecibosPage.jsx` — Agregar handlers para eliminación

**Files:**
- Modify: `frontend/src/pages/RecibosPage/RecibosPage.jsx:102-109`

- [ ] **Step 1: Agregar handlers después de `handleGenerarSuccess`**

Después de la función `handleGenerarSuccess` (después de línea 108), agregar:

```javascript
  const handleDeletePeriodo = (periodo) => {
    setDeleteModal({
      isOpen: true,
      periodo: periodo.periodo,
      cantidad: periodo.cantidad_recibos,
      isLoading: false,
      error: null,
    });
  };

  const handleConfirmDeletePeriodo = async () => {
    const { periodo } = deleteModal;

    setDeleteModal(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await recibosService.deletePeriodo(periodo);
      // Recargar lista de períodos
      await loadPeriodos();
      setDeleteModal(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      setDeleteModal(prev => ({
        ...prev,
        error: err.response?.data?.error || err.response?.data?.message || 'Error al eliminar',
        isLoading: false,
      }));
    }
  };

  const handleCancelDeletePeriodo = () => {
    setDeleteModal(prev => ({
      ...prev,
      isOpen: false,
      periodo: null,
      cantidad: 0,
      error: null,
      isLoading: false,
    }));
  };
```

---

### Task 7: Actualizar `RecibosPage.jsx` — Agregar icono eliminar en tabla de períodos

**Files:**
- Modify: `frontend/src/pages/RecibosPage/RecibosPage.jsx:167-176`

- [ ] **Step 1: Reemplazar columna "Acción" en tabla de períodos**

En la sección de tabla de períodos (líneas 168-175), reemplazar:

```javascript
                      <td>
                        <button
                          className="recibos-page__btn-action"
                          onClick={() => handleVerRecibos(periodo)}
                        >
                          Ver recibos
                        </button>
                      </td>
```

Con:

```javascript
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            className="recibos-page__btn-action"
                            onClick={() => handleVerRecibos(periodo)}
                          >
                            Ver recibos
                          </button>
                          <IconButton
                            icon="delete"
                            title="Eliminar recibos del período"
                            onClick={() => handleDeletePeriodo(periodo)}
                            className="icon-button--danger"
                          />
                        </div>
                      </td>
```

---

### Task 8: Actualizar `RecibosPage.jsx` — Agregar modal de confirmación

**Files:**
- Modify: `frontend/src/pages/RecibosPage/RecibosPage.jsx:189-191`

- [ ] **Step 1: Agregar modal al final del JSX (antes del cierre de fragment)**

Antes del cierre del `<div className="recibos-page">` en la vista de períodos (alrededor de línea 189), agregar:

```javascript
        {/* ConfirmDeletePeriodoRecibosModal */}
        <ConfirmDeletePeriodoRecibosModal
          isOpen={deleteModal.isOpen}
          periodo={deleteModal.periodo}
          cantidad={deleteModal.cantidad}
          onConfirm={handleConfirmDeletePeriodo}
          onCancel={handleCancelDeletePeriodo}
          isLoading={deleteModal.isLoading}
          error={deleteModal.error}
        />
```

---

### Task 9: Backend — Agregar ruta DELETE en `recibos.js`

**Files:**
- Modify: `backend/src/routes/recibos.js`

- [ ] **Step 1: Leer archivo actual**

```bash
cat backend/src/routes/recibos.js
```

- [ ] **Step 2: Agregar ruta DELETE**

Antes de `module.exports = router;` (al final), agregar:

```javascript
// DELETE /api/recibos/periodo/:periodo
// Eliminar todos los recibos de un período
router.delete('/periodo/:periodo', verifyToken, recibosController.deletePeriodo);
```

---

### Task 10: Backend — Implementar controlador `deletePeriodo`

**Files:**
- Modify: `backend/src/controllers/v1.0/recibosController.js`

- [ ] **Step 1: Leer el archivo para entender su estructura**

```bash
head -50 backend/src/controllers/v1.0/recibosController.js
```

- [ ] **Step 2: Agregar controlador `deletePeriodo` al final del archivo**

Antes de `module.exports = { ... }`, agregar:

```javascript
/**
 * DELETE /api/recibos/periodo/:periodo
 * Elimina todos los recibos de un período (YYYY-MM)
 * También elimina sus integrantes (ReciboIntegrante) en cascada
 * Y actualiza PeriodosRecibos
 */
exports.deletePeriodo = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { periodo } = req.params;

    // Validar formato YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      return res.status(400).json({
        error: 'El período debe estar en formato YYYY-MM',
      });
    }

    // Obtener todos los recibos del período
    const recibos = await db.Recibo.findAll({
      where: {
        periodo: {
          [Op.startsWith]: periodo,
        },
      },
      transaction,
    });

    if (recibos.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        error: 'No hay recibos para este período',
      });
    }

    const recibosIds = recibos.map(r => r.id);

    // 1. Eliminar ReciboIntegrante asociados
    await db.ReciboIntegrante.destroy({
      where: {
        recibo_id: {
          [Op.in]: recibosIds,
        },
      },
      transaction,
    });

    // 2. Eliminar Recibos
    await db.Recibo.destroy({
      where: {
        periodo: {
          [Op.startsWith]: periodo,
        },
      },
      transaction,
    });

    // 3. Eliminar PeriodosRecibos
    await db.PeriodosRecibos.destroy({
      where: {
        periodo: periodo,
      },
      transaction,
    });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: `Se eliminaron ${recibos.length} recibos del período ${periodo}`,
      cantidad: recibos.length,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting recibos for period:', error);
    res.status(500).json({
      error: error.message || 'Error al eliminar recibos',
    });
  }
};
```

- [ ] **Step 3: Verificar que el controlador está exportado correctamente**

Al final del archivo, verificar que `deletePeriodo` está en el objeto de exports. El formato debe ser:

```javascript
module.exports = {
  generar,
  listPeriodos,
  list,
  getById,
  listByPlanNumero,
  getUltimoAumentoMasivo,
  getMaxNumeroRecibo,
  deletePeriodo,  // Agregar esto
};
```

---

### Task 11: Verificar sintaxis backend y testing

**Files:**
- Test: `backend/` (verificación general)

- [ ] **Step 1: Verificar que la sintaxis es correcta**

```bash
cd backend && npm run lint
```

Expected: Sin errores de ESLint (pueden haber warnings que estén ok).

- [ ] **Step 2: Verificar que el servidor inicia sin errores**

```bash
cd backend && npm run dev &
sleep 3
```

Expected: Servidor inicia, logs muestran que está escuchando en puerto 5000.

- [ ] **Step 3: Detener el servidor (si fue iniciado en background)**

```bash
pkill -f "node.*dev" || true
```

---

### Task 12: Testing manual frontend

**Files:**
- Test: `frontend/src/pages/RecibosPage/RecibosPage.jsx`

- [ ] **Step 1: Iniciar frontend en desarrollo**

```bash
cd frontend && npm start &
sleep 5
```

Expected: Frontend inicia, abre en navegador (o está disponible en localhost:3000).

- [ ] **Step 2: Navegar a Gestión de Recibos**

- Abrir navegador en `http://localhost:3000`
- Navegar a la sección de Recibos
- Debe verse la tabla de períodos con dos columnas de acción: "Ver recibos" e icono 🗑

- [ ] **Step 3: Hacer clic en icono eliminar**

- Click en el icono 🗑 de cualquier período
- Debe abrirse modal con:
  - Título: "⚠️ ¿Eliminar recibos?"
  - Período formateado (ej: "Abril 2026")
  - Cantidad de recibos
  - Advertencia: "Esta acción no se puede deshacer"
  - Botones: [Cancelar] [Sí, Eliminar]

- [ ] **Step 4: Cancelar eliminación**

- Click en "Cancelar"
- Modal debe cerrar sin eliminar nada

- [ ] **Step 5: Confirmar eliminación**

- Click en icono 🗑 nuevamente
- Click en "Sí, Eliminar"
- Modal debe mostrar "Eliminando..." en el botón
- Después de 2-3 segundos, modal cierra
- Tabla de períodos se recarga y el período no debe estar más

- [ ] **Step 6: Detener frontend**

```bash
pkill -f "npm start" || true
```

---

### Task 13: Commit cambios frontend

**Files:**
- Modified: Múltiples archivos frontend

- [ ] **Step 1: Verificar estado de git**

```bash
cd frontend && git status
```

Expected: Cambios en `RecibosPage.jsx`, `recibosService.js`, y archivos nuevos en `components/ConfirmDeletePeriodoRecibosModal/`.

- [ ] **Step 2: Agregar cambios al staging**

```bash
git add src/pages/RecibosPage/RecibosPage.jsx src/services/recibosService.js src/components/ConfirmDeletePeriodoRecibosModal/
```

- [ ] **Step 3: Crear commit**

```bash
git commit -m "feat(recibos): agregar eliminación de recibos por período con confirmación modal"
```

Expected: Commit creado exitosamente.

---

### Task 14: Commit cambios backend

**Files:**
- Modified: `backend/src/routes/recibos.js`, `backend/src/controllers/v1.0/recibosController.js`

- [ ] **Step 1: Verificar estado de git en backend**

```bash
cd backend && git status
```

Expected: Cambios en `routes/recibos.js` y `controllers/v1.0/recibosController.js`.

- [ ] **Step 2: Agregar cambios al staging**

```bash
git add src/routes/recibos.js src/controllers/v1.0/recibosController.js
```

- [ ] **Step 3: Crear commit**

```bash
git commit -m "feat(recibos): implementar endpoint DELETE /recibos/periodo/:periodo con cascada"
```

Expected: Commit creado exitosamente.

---

### Task 15: Push a rama activa

**Files:**
- Git: Rama V_1.0.7

- [ ] **Step 1: Verificar rama actual**

```bash
git branch
```

Expected: Rama activa es `V_1.0.7` (con asterisco).

- [ ] **Step 2: Push a rama**

```bash
git push origin V_1.0.7
```

Expected: Push exitoso. Commits aparecen en rama remota.

---

## Self-Review

**Spec Coverage:**
- ✅ Modal simple que muestra período y cantidad — Task 1, 2
- ✅ Icono 🗑 en tabla de períodos — Task 7
- ✅ Confirmación con período y cantidad — Task 1 (modal muestra info)
- ✅ Eliminación en cascada (ReciboIntegrante + Recibo + PeriodosRecibos) — Task 10
- ✅ Integración frontend-backend — Tasks 3-10
- ✅ Manejo de errores — Task 10 (try-catch + return error), Task 6 (error en modal)
- ✅ Push automático — Task 15

**Placeholder Scan:**
- ✅ No hay TBD, TODO, o "similar a Task X"
- ✅ Todo código está completo (no hay "add error handling" sin código)
- ✅ Comandos exactos con expected output

**Type Consistency:**
- ✅ `periodo` siempre formato YYYY-MM o con startsWith en queries
- ✅ `cantidad` siempre number
- ✅ `handleDeletePeriodo`, `handleConfirmDeletePeriodo`, `handleCancelDeletePeriodo` consistentes
- ✅ Modelos importados: `db.Recibo`, `db.ReciboIntegrante`, `db.PeriodosRecibos`

No hay gaps detectados.

---

## Execution Handoff

**Plan complete and saved.** Two execution options:

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration. Use superpowers:subagent-driven-development.

**2. Inline Execution** — Execute all tasks in this session. Use superpowers:executing-plans.

Which approach do you prefer?
