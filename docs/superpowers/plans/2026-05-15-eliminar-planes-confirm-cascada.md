# Eliminar Plan con Confirmación de Cascada - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a two-modal confirmation flow for deleting plans, with "Suspend" (reversible) and "Delete Permanently" (irreversible with cascading deletion) options.

**Architecture:** Backend DELETE endpoint with transactional cascading deletion; frontend two-step modal flow. Modal 1 offers choice, Modal 2 requires permanent confirmation. Both reutilize styles from ConfirmDeletePeriodoRecibosModal.

**Tech Stack:** React (frontend), Sequelize (backend ORM), Express (backend routing), SCSS (styling)

---

## Task 1: Backend Setup - Delete Endpoint Route

**Files:**
- Modify: `backend/src/routes/v1.0-planes.js`

- [ ] **Step 1: Review current routes file**

Open `backend/src/routes/v1.0-planes.js` and identify existing DELETE routes (if any) and the route pattern.

- [ ] **Step 2: Add DELETE route for a single plan**

Add this route after existing PATCH/PUT routes:

```javascript
// Delete plan permanently with cascading deletion
router.delete('/:planNumero', auth, async (req, res) => {
  try {
    const { planNumero } = req.params;
    
    // Validate planNumero is a number
    if (isNaN(planNumero)) {
      return res.status(400).json({
        success: false,
        message: 'Plan number must be a valid integer',
        code: 'INVALID_PLAN_NUMBER'
      });
    }

    const result = await planesController.deletePermanently(parseInt(planNumero, 10));
    res.json(result);
  } catch (err) {
    console.error('Error deleting plan:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Error deleting plan',
      code: 'DELETE_PLAN_ERROR'
    });
  }
});
```

- [ ] **Step 3: Commit route changes**

```bash
git add backend/src/routes/v1.0-planes.js
git commit -m "feat(planes): add DELETE /v1.0/planes/:planNumero route"
```

---

## Task 2: Backend - Delete Controller Method

**Files:**
- Modify: `backend/src/controllers/v1.0/planesController.js`

- [ ] **Step 1: Review controller file structure**

Open `backend/src/controllers/v1.0/planesController.js` and identify the existing pattern for async methods and how they interact with models.

- [ ] **Step 2: Add deletePermanently method**

Add this method to the planesController object (at the end, before the export):

```javascript
// Delete plan and all associated records in cascading transaction
deletePermanently: async (planNumero) => {
  const t = await sequelize.transaction();
  
  try {
    // Find plan first to ensure it exists
    const plan = await PlanV1.findByPk(planNumero, { transaction: t });
    if (!plan) {
      throw new Error('Plan not found');
    }

    // Delete in cascading order (respecting FK constraints)
    // 1. Delete IntegranteServicio (services for plan integrantes)
    const integrantes = await PlanIntegrante.findAll(
      { where: { plan_numero: planNumero }, transaction: t }
    );
    const integranteIds = integrantes.map(i => i.id);
    if (integranteIds.length > 0) {
      await IntegranteServicio.destroy(
        { where: { plan_integrante_id: integranteIds }, transaction: t }
      );
    }

    // 2. Delete PlanIntegrante (integrantes/afiliados of the plan)
    await PlanIntegrante.destroy(
      { where: { plan_numero: planNumero }, transaction: t }
    );

    // 3. Delete ReciboIntegrante (receipt lines)
    const recibos = await Recibo.findAll(
      { where: { plan_numero: planNumero }, transaction: t }
    );
    const reciboIds = recibos.map(r => r.id);
    if (reciboIds.length > 0) {
      await ReciboIntegrante.destroy(
        { where: { recibo_id: reciboIds }, transaction: t }
      );
    }

    // 4. Delete Recibo (receipts)
    await Recibo.destroy(
      { where: { plan_numero: planNumero }, transaction: t }
    );

    // 5. Delete HistorialCuota (quota history)
    await HistorialCuota.destroy(
      { where: { plan_numero: planNumero }, transaction: t }
    );

    // 6. Delete Plan
    await PlanV1.destroy(
      { where: { plan_numero: planNumero }, transaction: t }
    );

    // Commit transaction
    await t.commit();

    return {
      success: true,
      message: 'Plan eliminado correctamente',
      data: { plan_numero: planNumero }
    };
  } catch (err) {
    await t.rollback();
    console.error('Transaction failed, rolled back:', err);
    
    if (err.message === 'Plan not found') {
      const error = new Error('Plan not found');
      error.statusCode = 404;
      throw error;
    }
    
    throw err;
  }
},
```

- [ ] **Step 3: Add required imports at top of controller**

Verify these models are imported at the top:
- `PlanV1`
- `PlanIntegrante`
- `IntegranteServicio`
- `Recibo`
- `ReciboIntegrante`
- `HistorialCuota`
- `sequelize` (from config/database)

If missing, add them:

```javascript
const { PlanV1, PlanIntegrante, IntegranteServicio, Recibo, ReciboIntegrante, HistorialCuota } = require('../../models');
const sequelize = require('../../config/database');
```

- [ ] **Step 4: Commit controller changes**

```bash
git add backend/src/controllers/v1.0/planesController.js
git commit -m "feat(planes): add deletePermanently method with cascading deletion"
```

---

## Task 3: Backend - Update Model Associations (if needed)

**Files:**
- Modify: `backend/src/models/index.js`

- [ ] **Step 1: Check current HistorialCuota association**

Search for the line defining HistorialCuota associations with PlanV1. It should look something like:

```javascript
if (db.HistorialCuota && db.PlanV1) {
  db.PlanV1.hasMany(db.HistorialCuota, { foreignKey: 'plan_numero' });
  db.HistorialCuota.belongsTo(db.PlanV1, { foreignKey: 'plan_numero' });
}
```

- [ ] **Step 2: Add onDelete: CASCADE if missing**

If the association exists but doesn't have `onDelete: 'CASCADE'`, update it to:

```javascript
if (db.HistorialCuota && db.PlanV1) {
  db.PlanV1.hasMany(db.HistorialCuota, { foreignKey: 'plan_numero', onDelete: 'CASCADE' });
  db.HistorialCuota.belongsTo(db.PlanV1, { foreignKey: 'plan_numero', onDelete: 'CASCADE' });
}
```

(If it already has `onDelete: 'CASCADE'`, no changes needed.)

- [ ] **Step 3: Verify IntegranteServicio associations**

Ensure IntegranteServicio has CASCADE to PlanIntegrante. Should look like:

```javascript
if (db.PlanIntegrante && db.IntegranteServicio) {
  db.PlanIntegrante.hasMany(db.IntegranteServicio, { 
    foreignKey: 'plan_integrante_id', 
    onDelete: 'CASCADE' 
  });
  db.IntegranteServicio.belongsTo(db.PlanIntegrante, { 
    foreignKey: 'plan_integrante_id' 
  });
}
```

If missing `onDelete: 'CASCADE'`, add it.

- [ ] **Step 4: Commit if changes made**

```bash
git add backend/src/models/index.js
git commit -m "fix(models): ensure onDelete CASCADE for HistorialCuota and IntegranteServicio"
```

(If no changes needed, skip this step.)

---

## Task 4: Frontend - Service Method for Delete

**Files:**
- Modify: `frontend/src/services/planesV1Service.js`

- [ ] **Step 1: Review existing service methods**

Open the file and note the pattern for API calls (e.g., using `api.post`, `api.put`, `api.delete`).

- [ ] **Step 2: Add deletePermanently method**

Add this method to the `planesV1Service` object (before the `export`):

```javascript
// Eliminar plan permanentemente
deletePermanently: async (planNumero) => {
  const { data } = await api.delete(`/v1.0/planes/${planNumero}`);
  return data.data;
},
```

- [ ] **Step 3: Commit service changes**

```bash
git add frontend/src/services/planesV1Service.js
git commit -m "feat(planesV1Service): add deletePermanently method"
```

---

## Task 5: Frontend - First Modal Component (Option)

**Files:**
- Create: `frontend/src/components/ConfirmDeletePlanModal/ConfirmDeletePlanModal.jsx`
- Create: `frontend/src/components/ConfirmDeletePlanModal/ConfirmDeletePlanModal.scss`

- [ ] **Step 1: Create component file**

Create `frontend/src/components/ConfirmDeletePlanModal/ConfirmDeletePlanModal.jsx`:

```javascript
import React from 'react';
import './ConfirmDeletePlanModal.scss';

/**
 * Modal de confirmación para elegir entre suspender o eliminar un plan
 *
 * Props:
 * - isOpen: boolean - si modal está visible
 * - plan: object - plan con { plan_numero, numero_afiliado, zona: { codigo }, titular: { apellido, nombre } }
 * - onSuspend: async function - callback cuando usuario elige suspender
 * - onDelete: function - callback cuando usuario elige eliminar (abre modal 2)
 * - onCancel: function - callback cuando usuario cancela
 * - isLoading: boolean - si está en proceso
 */
function ConfirmDeletePlanModal({
  isOpen,
  plan,
  onSuspend,
  onDelete,
  onCancel,
  isLoading = false,
}) {
  if (!isOpen || !plan) return null;

  const formatIdentificador = () => {
    if (!plan.zona || !plan.numero_afiliado) return 'Plan';
    const zonaCode = String(plan.zona.codigo).padStart(2, '0');
    return `${zonaCode}-${plan.numero_afiliado}`;
  };

  const formatTitular = () => {
    if (!plan.titular) return 'Sin titular';
    const { apellido, nombre } = plan.titular;
    return `${apellido}, ${nombre}`.trim();
  };

  const handleSuspend = async () => {
    await onSuspend(plan);
  };

  const handleDelete = () => {
    onDelete();
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      handleCancel();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isLoading) {
      handleCancel();
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="confirm-delete-backdrop" 
          onClick={handleBackdropClick}
          role="presentation"
        />
      )}
      <div 
        className={`confirm-delete-modal${isOpen ? ' confirm-delete-modal--open' : ''}`}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        <div className="confirm-delete-modal__header">
          <h2 className="confirm-delete-modal__title" id="confirm-delete-title">
            ¿Qué deseas hacer con este plan?
          </h2>
          <button
            className="confirm-delete-modal__close"
            onClick={handleCancel}
            disabled={isLoading}
            aria-label="Cerrar"
            title="Cerrar (ESC)"
          >
            ✕
          </button>
        </div>

        <div className="confirm-delete-modal__body">
          <div className="confirm-delete-modal__info-block">
            <div className="confirm-delete-modal__info-item">
              <strong>Identificador:</strong> {formatIdentificador()}
            </div>
            <div className="confirm-delete-modal__info-item">
              <strong>Titular:</strong> {formatTitular()}
            </div>
          </div>

          <div className="confirm-delete-modal__description">
            <p>Puedes suspender el plan (reversible) o eliminarlo permanentemente.</p>
          </div>
        </div>

        <div className="confirm-delete-modal__footer">
          <button
            className="confirm-delete-modal__btn confirm-delete-modal__btn--primary"
            onClick={handleSuspend}
            disabled={isLoading}
          >
            {isLoading ? 'Suspendiendo...' : 'Suspender Plan'}
          </button>
          <button
            className="confirm-delete-modal__btn confirm-delete-modal__btn--cancel"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            className="confirm-delete-modal__btn confirm-delete-modal__btn--danger"
            onClick={handleDelete}
            disabled={isLoading}
          >
            Eliminar Plan
          </button>
        </div>
      </div>
    </>
  );
}

export default ConfirmDeletePlanModal;
```

- [ ] **Step 2: Create stylesheet**

Create `frontend/src/components/ConfirmDeletePlanModal/ConfirmDeletePlanModal.scss`:

```scss
// Reutilizar estilos base de confirm-delete-modal (igual que ConfirmDeletePeriodoRecibosModal)
// Importar colores globales
@import '../../styles/_colors.scss';

.confirm-delete-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.95);
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
  z-index: 1001;

  &--open {
    opacity: 1;
    pointer-events: auto;
    transform: translate(-50%, -50%) scale(1);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: #333;
  }

  &__close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
      background-color: #f5f5f5;
      color: #333;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  &__body {
    padding: 20px;
    max-height: 60vh;
    overflow-y: auto;
  }

  &__info-block {
    background-color: #f9f9f9;
    border-left: 4px solid $color-primary;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 15px;
  }

  &__info-item {
    font-size: 14px;
    line-height: 1.6;
    color: #555;

    strong {
      color: #333;
      margin-right: 8px;
    }

    &:not(:last-child) {
      margin-bottom: 8px;
    }
  }

  &__description {
    font-size: 14px;
    color: #666;
    line-height: 1.6;

    p {
      margin: 0;
    }
  }

  &__footer {
    display: flex;
    gap: 10px;
    padding: 20px;
    border-top: 1px solid #e0e0e0;
    background-color: #fafafa;
  }

  &__btn {
    padding: 10px 16px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    flex: 1;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    &--primary {
      background-color: $color-primary;
      color: white;

      &:hover:not(:disabled) {
        background-color: darken($color-primary, 10%);
      }
    }

    &--cancel {
      background-color: #e0e0e0;
      color: #333;

      &:hover:not(:disabled) {
        background-color: #d0d0d0;
      }
    }

    &--danger {
      background-color: #dc3545;
      color: white;

      &:hover:not(:disabled) {
        background-color: darken(#dc3545, 10%);
      }
    }
  }
}

.confirm-delete-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  cursor: pointer;
}
```

- [ ] **Step 3: Commit modal component**

```bash
git add frontend/src/components/ConfirmDeletePlanModal/ConfirmDeletePlanModal.jsx frontend/src/components/ConfirmDeletePlanModal/ConfirmDeletePlanModal.scss
git commit -m "feat(ConfirmDeletePlanModal): add first modal for suspend/delete choice"
```

---

## Task 6: Frontend - Second Modal Component (Permanent Confirmation)

**Files:**
- Create: `frontend/src/components/ConfirmDeletePlanPermanentModal/ConfirmDeletePlanPermanentModal.jsx`
- Create: `frontend/src/components/ConfirmDeletePlanPermanentModal/ConfirmDeletePlanPermanentModal.scss`

- [ ] **Step 1: Create component file**

Create `frontend/src/components/ConfirmDeletePlanPermanentModal/ConfirmDeletePlanPermanentModal.jsx`:

```javascript
import React from 'react';
import './ConfirmDeletePlanPermanentModal.scss';

/**
 * Modal de confirmación para eliminar plan permanentemente
 *
 * Props:
 * - isOpen: boolean - si modal está visible
 * - plan: object - plan con { plan_numero, numero_afiliado, zona: { codigo }, titular: { apellido, nombre } }
 * - onConfirm: async function - callback cuando usuario confirma eliminación
 * - onCancel: function - callback cuando usuario cancela (vuelve a modal 1)
 * - isLoading: boolean - si está en proceso de eliminación
 * - error: string - mensaje de error si la eliminación falló
 */
function ConfirmDeletePlanPermanentModal({
  isOpen,
  plan,
  onConfirm,
  onCancel,
  isLoading = false,
  error = null,
}) {
  if (!isOpen || !plan) return null;

  const formatIdentificador = () => {
    if (!plan.zona || !plan.numero_afiliado) return 'Plan';
    const zonaCode = String(plan.zona.codigo).padStart(2, '0');
    return `${zonaCode}-${plan.numero_afiliado}`;
  };

  const formatTitular = () => {
    if (!plan.titular) return 'Sin titular';
    const { apellido, nombre } = plan.titular;
    return `${apellido}, ${nombre}`.trim();
  };

  const handleConfirm = async () => {
    await onConfirm();
  };

  const handleCancel = () => {
    onCancel();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      handleCancel();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isLoading) {
      handleCancel();
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="confirm-delete-backdrop" 
          onClick={handleBackdropClick}
          role="presentation"
        />
      )}
      <div 
        className={`confirm-delete-permanent-modal${isOpen ? ' confirm-delete-permanent-modal--open' : ''}`}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-permanent-delete-title"
      >
        <div className="confirm-delete-permanent-modal__header">
          <h2 className="confirm-delete-permanent-modal__title" id="confirm-permanent-delete-title">
            ⚠️ Confirmar Eliminación Permanente
          </h2>
          <button
            className="confirm-delete-permanent-modal__close"
            onClick={handleCancel}
            disabled={isLoading}
            aria-label="Cerrar"
            title="Cerrar (ESC)"
          >
            ✕
          </button>
        </div>

        <div className="confirm-delete-permanent-modal__body">
          <div className="confirm-delete-permanent-modal__warning">
            <p className="confirm-delete-permanent-modal__warning-text">
              ⚠️ <strong>Esta acción no se puede deshacer.</strong>
            </p>
          </div>

          <div className="confirm-delete-permanent-modal__info-block">
            <div className="confirm-delete-permanent-modal__info-item">
              <strong>Identificador:</strong> {formatIdentificador()}
            </div>
            <div className="confirm-delete-permanent-modal__info-item">
              <strong>Titular:</strong> {formatTitular()}
            </div>
          </div>

          <div className="confirm-delete-permanent-modal__what-will-be-deleted">
            <p className="confirm-delete-permanent-modal__subtitle">
              Se eliminarán permanentemente:
            </p>
            <ul className="confirm-delete-permanent-modal__delete-list">
              <li>Todos los integrantes/afiliados del plan</li>
              <li>Todos los recibos generados</li>
              <li>Todo el historial de cuotas</li>
              <li>Todos los servicios adicionales asociados</li>
            </ul>
          </div>

          {error && (
            <div className="confirm-delete-permanent-modal__error">
              <p className="confirm-delete-permanent-modal__error-text">
                ❌ Error: {error}
              </p>
            </div>
          )}
        </div>

        <div className="confirm-delete-permanent-modal__footer">
          <button
            className="confirm-delete-permanent-modal__btn confirm-delete-permanent-modal__btn--cancel"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            className="confirm-delete-permanent-modal__btn confirm-delete-permanent-modal__btn--confirm"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Eliminando...' : 'Sí, Eliminar Permanentemente'}
          </button>
        </div>
      </div>
    </>
  );
}

export default ConfirmDeletePlanPermanentModal;
```

- [ ] **Step 2: Create stylesheet**

Create `frontend/src/components/ConfirmDeletePlanPermanentModal/ConfirmDeletePlanPermanentModal.scss`:

```scss
@import '../../styles/_colors.scss';

.confirm-delete-permanent-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.95);
  background: white;
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 550px;
  width: 90%;
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s ease;
  z-index: 1001;

  &--open {
    opacity: 1;
    pointer-events: auto;
    transform: translate(-50%, -50%) scale(1);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 2px solid #dc3545;
    background-color: #fff5f5;
  }

  &__title {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: #dc3545;
  }

  &__close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: background-color 0.2s;

    &:hover:not(:disabled) {
      background-color: #ffe0e0;
      color: #dc3545;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  &__body {
    padding: 20px;
    max-height: 60vh;
    overflow-y: auto;
  }

  &__warning {
    background-color: #fde7e7;
    border-left: 4px solid #dc3545;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 15px;
  }

  &__warning-text {
    margin: 0;
    font-size: 14px;
    color: #dc3545;
    font-weight: 600;
  }

  &__info-block {
    background-color: #f9f9f9;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 15px;
  }

  &__info-item {
    font-size: 14px;
    line-height: 1.6;
    color: #555;

    strong {
      color: #333;
      margin-right: 8px;
    }

    &:not(:last-child) {
      margin-bottom: 8px;
    }
  }

  &__what-will-be-deleted {
    margin-bottom: 15px;
  }

  &__subtitle {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin: 0 0 10px 0;
  }

  &__delete-list {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 14px;
    color: #555;

    li {
      padding: 6px 0 6px 24px;
      position: relative;
      line-height: 1.4;

      &:before {
        content: '•';
        position: absolute;
        left: 8px;
        color: #dc3545;
        font-weight: bold;
      }
    }
  }

  &__error {
    background-color: #fff3cd;
    border-left: 4px solid #ffc107;
    padding: 12px;
    border-radius: 4px;
    margin-top: 15px;
  }

  &__error-text {
    margin: 0;
    font-size: 14px;
    color: #856404;
  }

  &__footer {
    display: flex;
    gap: 10px;
    padding: 20px;
    border-top: 1px solid #e0e0e0;
    background-color: #fafafa;
  }

  &__btn {
    padding: 10px 16px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    flex: 1;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    &--cancel {
      background-color: #e0e0e0;
      color: #333;

      &:hover:not(:disabled) {
        background-color: #d0d0d0;
      }
    }

    &--confirm {
      background-color: #dc3545;
      color: white;

      &:hover:not(:disabled) {
        background-color: #c82333;
      }
    }
  }
}

.confirm-delete-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  cursor: pointer;
}
```

- [ ] **Step 3: Commit permanent modal component**

```bash
git add frontend/src/components/ConfirmDeletePlanPermanentModal/ConfirmDeletePlanPermanentModal.jsx frontend/src/components/ConfirmDeletePlanPermanentModal/ConfirmDeletePlanPermanentModal.scss
git commit -m "feat(ConfirmDeletePlanPermanentModal): add second modal for irreversible confirmation"
```

---

## Task 7: Frontend - Integrate Modals in GestionPlanesV1

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx`

- [ ] **Step 1: Add modal imports at top**

After the existing imports, add:

```javascript
import ConfirmDeletePlanModal from '../../../../components/ConfirmDeletePlanModal/ConfirmDeletePlanModal';
import ConfirmDeletePlanPermanentModal from '../../../../components/ConfirmDeletePlanPermanentModal/ConfirmDeletePlanPermanentModal';
```

- [ ] **Step 2: Add state for delete modal**

Add this state after the existing modal states (around line 40):

```javascript
const [deleteModalState, setDeleteModalState] = useState({
  firstModal: false,
  secondModal: false,
  selectedPlan: null,
  isLoading: false,
  error: null,
});
```

- [ ] **Step 3: Replace handleSuspenderPlan function**

Find the `handleSuspenderPlan` function and replace it with:

```javascript
const handleDeletePlan = (plan) => {
  setDeleteModalState({
    firstModal: true,
    secondModal: false,
    selectedPlan: plan,
    isLoading: false,
    error: null,
  });
};

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

const handleDeleteChoice = () => {
  setDeleteModalState(prev => ({
    ...prev,
    firstModal: false,
    secondModal: true,
    error: null,
  }));
};

const handleBackToFirstModal = () => {
  setDeleteModalState(prev => ({
    ...prev,
    firstModal: true,
    secondModal: false,
    error: null,
  }));
};

const handleCloseDeleteModal = () => {
  setDeleteModalState({
    firstModal: false,
    secondModal: false,
    selectedPlan: null,
    isLoading: false,
    error: null,
  });
};

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

- [ ] **Step 4: Update delete button in table to call new handler**

Find the button with `onClick={() => handleSuspenderPlan(plan)}` and change it to:

```javascript
onClick={() => handleDeletePlan(plan)}
```

Also verify the condition for showing the button is still `plan.estado !== 'SUSPENDIDO'`. Change it to `plan.estado === 'ACTIVO'` for consistency with the spec:

```javascript
{plan.estado === 'ACTIVO' && (
  <IconButton
    icon="delete"
    title="Eliminar o Suspender"
    onClick={() => handleDeletePlan(plan)}
    className="icon-button--danger"
  />
)}
```

- [ ] **Step 5: Add modal components to render (before closing div)**

Find the end of the JSX (before the final closing `</div>` of the component) and add:

```javascript
{deleteModalState.firstModal && (
  <ConfirmDeletePlanModal
    isOpen={deleteModalState.firstModal}
    plan={deleteModalState.selectedPlan}
    onSuspend={handleSuspendFromModal}
    onDelete={handleDeleteChoice}
    onCancel={handleCloseDeleteModal}
    isLoading={deleteModalState.isLoading}
  />
)}

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

- [ ] **Step 6: Commit GestionPlanesV1 changes**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/GestionPlanesV1.jsx
git commit -m "feat(GestionPlanesV1): integrate delete modals with state management"
```

---

## Task 8: Testing - Manual Feature Test

**Files:**
- No new files, manual testing

- [ ] **Step 1: Start backend server**

```bash
cd backend
npm run dev
```

Expected: Server starts on localhost:5000

- [ ] **Step 2: Start frontend dev server (in another terminal)**

```bash
cd frontend
npm start
```

Expected: App starts on localhost:3000

- [ ] **Step 3: Login and navigate to Gestión de Planes**

Login with test credentials and navigate to the main Planes section.

- [ ] **Step 4: Test delete button visibility**

- Verify delete icon appears only for ACTIVO plans
- Verify delete icon does NOT appear for SUSPENDIDO or other states
- Verify icon has tooltip "Eliminar o Suspender"

- [ ] **Step 5: Test First Modal Flow - Suspend Option**

- Click delete icon on an ACTIVO plan
- Verify Modal 1 opens with:
  - Title: "¿Qué deseas hacer con este plan?"
  - Identificador displayed (zone-number)
  - Titular displayed
  - "Suspender Plan" button (primary)
  - "Cancelar" button
  - "Eliminar Plan" button (danger, red)
- Click "Suspender Plan"
- Verify toast success: "Plan suspendido correctamente"
- Verify modal closes
- Verify plan status changes to SUSPENDIDO in table
- Verify delete icon disappears from that row

- [ ] **Step 6: Test First Modal Flow - Cancel Option**

- Click delete icon on another ACTIVO plan
- Click "Cancelar" button
- Verify modal closes
- Verify plan is unchanged

- [ ] **Step 7: Test Second Modal Flow - Full Deletion**

- Click delete icon on another ACTIVO plan
- Click "Eliminar Plan" button
- Verify Modal 2 opens with:
  - Title: "⚠️ Confirmar Eliminación Permanente"
  - Red warning: "Esta acción no se puede deshacer"
  - Identificador and Titular
  - List of what will be deleted (integrantes, recibos, etc)
  - "Cancelar" button
  - "Sí, Eliminar Permanentemente" button (red)
- Click "Sí, Eliminar Permanentemente"
- Verify toast success: "Plan eliminado definitivamente"
- Verify modal closes
- Verify plan is removed from table
- Verify table is reloaded

- [ ] **Step 8: Test Second Modal Flow - Back to First Modal**

- Click delete icon on another ACTIVO plan
- Click "Eliminar Plan"
- Verify Modal 2 opens
- Click "Cancelar"
- Verify Modal 2 closes and Modal 1 is still open
- Click "Cancelar" again
- Verify Modal 1 closes

- [ ] **Step 9: Test Keyboard Navigation**

- Click delete icon
- Press ESC
- Verify Modal 1 closes
- Click delete icon again
- Click "Eliminar Plan"
- Press ESC
- Verify Modal 2 closes and Modal 1 is visible

- [ ] **Step 10: Test Backdrop Click**

- Click delete icon
- Click outside the modal (on backdrop)
- Verify Modal 1 closes
- Click delete icon again
- Click "Eliminar Plan"
- Click outside Modal 2 (on backdrop)
- Verify nothing happens (Modal 1 stays open since we're on Modal 2)

- [ ] **Step 11: Verify Database Cascading**

- Get plan_numero of a plan to delete
- From database, verify:
  - Plan exists in `planes` table
  - Integrantes exist in `plan_integrantes`
  - Recibos exist in `recibos` table
  - Historial entries exist in `historial_cuota`
- Delete the plan via UI
- Query database again:
  - Verify Plan is deleted from `planes`
  - Verify PlanIntegrante records for this plan are deleted
  - Verify Recibo records for this plan are deleted
  - Verify HistorialCuota records for this plan are deleted

- [ ] **Step 12: Test Error Handling (Optional)**

- Simulate backend error by temporarily making the DELETE endpoint return 500
- Click delete icon and go through to confirmation
- Click "Sí, Eliminar Permanentemente"
- Verify error message appears in Modal 2
- Verify modal stays open
- Verify user can click button again to retry (after fixing backend)

---

## Task 9: Commit Final Changes and Update BACKLOG

**Files:**
- Modify: `BACKLOG.md`

- [ ] **Step 1: Mark BACKLOG-067 as Developed**

Open `BACKLOG.md` and find the BACKLOG-067 entry. Change status from `📋 Registrado` to `🚀 Desarrollado`:

```markdown
| BACKLOG-067 | 🔴 Alta | 🚀 Desarrollado | Eliminar plan con confirmación de cascada | ...
```

- [ ] **Step 2: Add commits reference to BACKLOG**

In the same row, add the commit references in parentheses after the description (following the pattern of other items):

```markdown
Commits: [commit-hash-1], [commit-hash-2], ... (You'll add these after final commit)
```

- [ ] **Step 3: Final commit**

```bash
git add BACKLOG.md
git commit -m "docs(backlog): mark BACKLOG-067 as developed"
```

- [ ] **Step 4: Push all changes**

```bash
git push origin V_1.0.7
```

Expected: All commits pushed successfully to remote branch V_1.0.7

---

## Self-Review Checklist

**Spec Coverage:**
- ✅ RF-1 (First Modal): Tasks 5, 7 cover implementation
- ✅ RF-2 (Second Modal): Task 6, 7 cover implementation
- ✅ RF-3 (Frontend restrictions): Task 7 Step 4 enforces ACTIVO-only
- ✅ RF-4 (Authorization): Task 2 uses `auth` middleware
- ✅ RF-5 (Cascading deletion): Task 2 implements ordered deletion + Task 3 ensures CASCADE
- ✅ Backend endpoint: Task 1, 2 implement DELETE route
- ✅ Service method: Task 4 adds `deletePermanently`
- ✅ Testing: Task 8 provides manual test steps
- ✅ BACKLOG tracking: Task 9 updates BACKLOG status

**Placeholder Scan:**
- ✅ No "TBD", "TODO", or "fill in" placeholders
- ✅ All code samples are complete and exact
- ✅ All command examples include expected output
- ✅ No "similar to Task N" references — each task is self-contained

**Type Consistency:**
- ✅ Modal props match across Task 5 and 6 definitions
- ✅ Function names consistent (handleDeletePlan, handleSuspendFromModal, etc.)
- ✅ State structure (deleteModalState) used consistently throughout Task 7
- ✅ Service method name (deletePermanently) used consistently in all calls

**No Gaps:**
- ✅ All files mentioned in spec are covered
- ✅ Import statements included
- ✅ CSS/SCSS complete
- ✅ Error handling implemented
- ✅ Accessibility features (aria-label, role, etc.) included

---

## Execution Path

This plan consists of 9 independent-but-sequential tasks:
1. Backend route (Task 1)
2. Backend controller method (Task 2)
3. Model associations (Task 3) — prerequisite done
4. Frontend service method (Task 4)
5. First modal component (Task 5)
6. Second modal component (Task 6)
7. Integration in GestionPlanesV1 (Task 7) — depends on 4, 5, 6
8. Manual testing (Task 8) — depends on all implementation tasks
9. BACKLOG update (Task 9) — final bookkeeping

**Recommended execution:** Sequential (1→2→3→4→5→6→7→8→9), but tasks 1-6 can be parallelized if needed.
