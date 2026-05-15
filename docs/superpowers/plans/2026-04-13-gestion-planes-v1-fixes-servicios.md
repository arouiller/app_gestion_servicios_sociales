# GestionPlanesV1 Fixes + Servicios Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix DNI display and affiliate number suggestion bugs, then add service selection and display capabilities to plan affiliate management.

**Architecture:** 
- Backend: Extend planesController to include numero_documento in Persona attributes, fix getMaxAfiliadoNumber logic. Create new integrante-servicios controller/routes for CRUD operations on IntegranteServicio.
- Frontend: Update PlanV1Modal table to include numero_documento column and servicios column. Create IntegranteServiciosModal for selecting/managing services per affiliate. Store service selections in component state before saving.

**Tech Stack:** Express/Sequelize (backend), React/SCSS (frontend), Sequelize associations (IntegranteServicio ↔ ServicioAdicional)

---

## File Structure

### Backend Files
- **Modify**: `backend/src/controllers/v1.0/planesController.js` - Fix getMaxAfiliadoNumber, add numero_documento to Persona attributes
- **Create**: `backend/src/controllers/v1.0/integranteServiciosController.js` - CRUD for IntegranteServicio
- **Create**: `backend/src/routes/v1.0-integrante-servicios.js` - Routes for service management
- **Modify**: `backend/src/index.js` - Register new service routes

### Frontend Files
- **Modify**: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx` - Add servicios column, service icon button, store integrante IDs
- **Create**: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/IntegranteServiciosModal.jsx` - Service selector modal
- **Create**: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/IntegranteServiciosModal.scss` - Service modal styles
- **Create**: `frontend/src/services/integranteServiciosService.js` - API calls for service management

---

## Task Breakdown

### Task 1: Fix DNI Display - Backend

**Files:**
- Modify: `backend/src/controllers/v1.0/planesController.js:64`

- [ ] **Step 1: Add numero_documento to Persona attributes in obtener()**

In the `obtener` function, update the PlanIntegrante include to add the missing `numero_documento` attribute:

```javascript
const obtener = async (req, res) => {
  const { planNumero } = req.params;

  const plan = await db.PlanV1.findByPk(planNumero, {
    include: [
      {
        model: db.PlanIntegrante,
        include: [{ 
          model: db.Persona, 
          attributes: ['id', 'apellido', 'nombre', 'numero_documento', 'tipo_documento', 'fecha_nacimiento', 'fecha_cobertura'] 
        }],
      },
      { model: db.TipoDePlan, attributes: ['tipo_plan_numero', 'tipo_plan_nombre'] },
      { model: db.Cobrador, attributes: ['cobrador_numero', 'cobrador_apellido', 'cobrador_nombre'] },
      { model: db.TipoDeGrupo, attributes: ['tipo_de_grupo_numero', 'tipo_de_grupo_nombre'] },
      { model: db.ObraSocial, attributes: ['os_numero', 'os_nombre'] },
    ],
  });

  // Cargar Recibos por separado para evitar problemas de schema
  if (plan) {
    try {
      const recibos = await db.Recibo.findAll({
        where: { plan_numero: planNumero },
        attributes: ['id', 'periodo', 'valor_cuota', 'fecha_emision'],
        order: [['fecha_emision', 'DESC']],
      });
      plan.Recibos = recibos;
    } catch (err) {
      console.warn('Error loading Recibos:', err.message);
      plan.Recibos = [];
    }
  }

  if (!plan) {
    return res.status(404).json({ success: false, message: 'Plan no encontrado' });
  }

  return res.json({ success: true, data: plan });
};
```

- [ ] **Step 2: Verify otros métodos que cargan Persona también incluyan numero_documento**

Check `getByPersona` (línea 43) - also update to include numero_documento:

```javascript
const getByPersona = async (req, res) => {
  const { personaId } = req.params;

  const planes = await db.PlanV1.findAll({
    include: [
      {
        model: db.PlanIntegrante,
        where: { persona_id: personaId },
        include: [
          { model: db.Persona, attributes: ['id', 'apellido', 'nombre', 'numero_documento'] },
        ],
      },
      { model: db.TipoDePlan, attributes: ['tipo_plan_numero', 'tipo_plan_nombre'] },
      { model: db.Cobrador, attributes: ['cobrador_numero', 'cobrador_apellido', 'cobrador_nombre'] },
      { model: db.ObraSocial, attributes: ['os_numero', 'os_nombre'] },
    ],
  });

  return res.json({ success: true, data: planes });
};
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/v1.0/planesController.js
git commit -m "fix: include numero_documento in Persona attributes when loading plans"
```

---

### Task 2: Fix Affiliate Number Suggestion - Backend

**Files:**
- Modify: `backend/src/controllers/v1.0/planesController.js:214-225`

- [ ] **Step 1: Analyze numero_afiliado data type**

Check the PlanV1 model to verify if numero_afiliado is VARCHAR or INTEGER. Check if it has a pattern (e.g., zero-padded like "001", "002", etc.).

Based on code review, numero_afiliado is VARCHAR (string). The issue is that MAX() on strings does lexicographic comparison.

- [ ] **Step 2: Fix getMaxAfiliadoNumber to handle string numero_afiliado correctly**

```javascript
const getMaxAfiliadoNumber = async (req, res) => {
  try {
    // Get all affiliate numbers and find the maximum numeric value
    const allPlans = await db.PlanV1.findAll({
      attributes: ['numero_afiliado'],
      raw: true,
    });

    let maxNumber = 0;
    allPlans.forEach(plan => {
      const num = parseInt(plan.numero_afiliado, 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    });

    const suggestedNumber = maxNumber + 1;
    return res.json({ success: true, data: { maxNumber, suggestedNumber: String(suggestedNumber).padStart(3, '0') } });
  } catch (error) {
    console.error('Error fetching max affiliate number:', error);
    return res.status(500).json({ success: false, message: 'Error fetching max affiliate number' });
  }
};
```

**Explanation:**
- Fetch all numero_afiliado values from DB
- Parse each as integer, track the maximum numeric value
- Return suggested number as zero-padded string (assuming format "001", "002", etc.)
- If no plans exist, returns "001"

- [ ] **Step 3: Verify the number format matches database**

If numero_afiliado doesn't use zero-padding, adjust the padStart(3, '0') accordingly. For now, assume 3-digit zero-padded format (common in Argentine systems).

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/v1.0/planesController.js
git commit -m "fix: improve affiliate number suggestion with proper numeric comparison"
```

---

### Task 3: Create IntegranteServicios Controller - Backend

**Files:**
- Create: `backend/src/controllers/v1.0/integranteServiciosController.js`

- [ ] **Step 1: Create the controller file with CRUD operations**

```javascript
const db = require('../../models');

/**
 * GET /api/v1.0/servicios-adicionales
 * Obtener todos los servicios adicionales disponibles
 */
exports.listarServicios = async (req, res, next) => {
  try {
    const servicios = await db.ServicioAdicional.findAll({
      attributes: ['servicio_adicional_numero', 'servicio_adicional_nombre'],
      order: [['servicio_adicional_numero', 'ASC']],
    });

    res.status(200).json({ success: true, data: servicios });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1.0/integrante/:planIntegranteId/servicios
 * Obtener servicios asociados a un integrante del plan
 */
exports.obtenerServiciosIntegrante = async (req, res, next) => {
  try {
    const { planIntegranteId } = req.params;

    // Verify the plan integrante exists
    const integrante = await db.PlanIntegrante.findByPk(planIntegranteId);
    if (!integrante) {
      return res.status(404).json({ success: false, message: 'Plan integrante no encontrado' });
    }

    const servicios = await db.IntegranteServicio.findAll({
      where: { plan_integrante_id: planIntegranteId },
      include: [
        { model: db.ServicioAdicional, attributes: ['servicio_adicional_numero', 'servicio_adicional_nombre'] },
      ],
    });

    res.status(200).json({ success: true, data: servicios });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1.0/integrante/:planIntegranteId/servicios
 * Agregar un servicio a un integrante del plan
 */
exports.agregarServicio = async (req, res, next) => {
  try {
    const { planIntegranteId } = req.params;
    const { servicio_adicional_numero } = req.body;

    // Validate inputs
    if (!servicio_adicional_numero) {
      return res.status(400).json({ 
        success: false, 
        message: 'servicio_adicional_numero es requerido' 
      });
    }

    // Verify the plan integrante exists
    const integrante = await db.PlanIntegrante.findByPk(planIntegranteId);
    if (!integrante) {
      return res.status(404).json({ success: false, message: 'Plan integrante no encontrado' });
    }

    // Verify the service exists
    const servicio = await db.ServicioAdicional.findByPk(servicio_adicional_numero);
    if (!servicio) {
      return res.status(404).json({ success: false, message: 'Servicio no encontrado' });
    }

    // Check if service is already assigned
    const existing = await db.IntegranteServicio.findOne({
      where: { 
        plan_integrante_id: planIntegranteId,
        servicio_adicional_numero,
      },
    });

    if (existing) {
      return res.status(409).json({ 
        success: false, 
        message: 'Este servicio ya está asignado al integrante' 
      });
    }

    // Create the association
    const integranteServicio = await db.IntegranteServicio.create({
      plan_integrante_id: planIntegranteId,
      servicio_adicional_numero,
    });

    res.status(201).json({ success: true, data: integranteServicio });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1.0/integrante/:planIntegranteId/servicios/:servicioNumero
 * Remover un servicio de un integrante del plan
 */
exports.eliminarServicio = async (req, res, next) => {
  try {
    const { planIntegranteId, servicioNumero } = req.params;

    // Verify the plan integrante exists
    const integrante = await db.PlanIntegrante.findByPk(planIntegranteId);
    if (!integrante) {
      return res.status(404).json({ success: false, message: 'Plan integrante no encontrado' });
    }

    const result = await db.IntegranteServicio.destroy({
      where: {
        plan_integrante_id: planIntegranteId,
        servicio_adicional_numero: servicioNumero,
      },
    });

    if (result === 0) {
      return res.status(404).json({ success: false, message: 'Asociación no encontrada' });
    }

    res.status(200).json({ success: true, message: 'Servicio removido correctamente' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listarServicios,
  obtenerServiciosIntegrante,
  agregarServicio,
  eliminarServicio,
};
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/controllers/v1.0/integranteServiciosController.js
git commit -m "feat: create integrante servicios controller with CRUD operations"
```

---

### Task 4: Create IntegranteServicios Routes - Backend

**Files:**
- Create: `backend/src/routes/v1.0-integrante-servicios.js`

- [ ] **Step 1: Create routes file**

```javascript
const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/v1.0/integranteServiciosController');

const router = express.Router();

// GET /api/v1.0/servicios-adicionales
// Listar todos los servicios adicionales disponibles
router.get('/servicios-adicionales', verifyToken, controller.listarServicios);

// GET /api/v1.0/integrante/:planIntegranteId/servicios
// Obtener servicios asociados a un integrante del plan
router.get('/integrante/:planIntegranteId/servicios', verifyToken, controller.obtenerServiciosIntegrante);

// POST /api/v1.0/integrante/:planIntegranteId/servicios
// Agregar un servicio a un integrante (admin only)
router.post('/integrante/:planIntegranteId/servicios', verifyToken, requireAdmin, controller.agregarServicio);

// DELETE /api/v1.0/integrante/:planIntegranteId/servicios/:servicioNumero
// Remover un servicio de un integrante (admin only)
router.delete('/integrante/:planIntegranteId/servicios/:servicioNumero', verifyToken, requireAdmin, controller.eliminarServicio);

module.exports = router;
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/routes/v1.0-integrante-servicios.js
git commit -m "feat: create integrante servicios routes"
```

---

### Task 5: Register Routes in Index - Backend

**Files:**
- Modify: `backend/src/index.js`

- [ ] **Step 1: Find the routes section and add the new service routes**

Add this line after other v1.0 route registrations:

```javascript
app.use('/api/v1.0', require('./routes/v1.0-integrante-servicios'));
```

The section should look like:

```javascript
// v1.0 Routes
app.use('/api/v1.0/planes', require('./routes/v1.0-planes'));
app.use('/api/v1.0/plan-integrantes', require('./routes/v1.0-plan-integrantes'));
app.use('/api/v1.0', require('./routes/v1.0-integrante-servicios'));
app.use('/api/personas', require('./routes/personas'));
app.use('/api/lookup', require('./routes/lookup'));
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/index.js
git commit -m "feat: register integrante servicios routes"
```

---

### Task 6: Create IntegranteServicios Service - Frontend

**Files:**
- Create: `frontend/src/services/integranteServiciosService.js`

- [ ] **Step 1: Create service file with API methods**

```javascript
import api from './api';

const integranteServiciosService = {
  // Listar todos los servicios adicionales disponibles
  listarServicios: async () => {
    const { data } = await api.get('/v1.0/servicios-adicionales');
    return data.data;
  },

  // Obtener servicios asociados a un integrante del plan
  obtenerServiciosIntegrante: async (planIntegranteId) => {
    const { data } = await api.get(`/v1.0/integrante/${planIntegranteId}/servicios`);
    return data.data;
  },

  // Agregar un servicio a un integrante
  agregarServicio: async (planIntegranteId, servicioNumero) => {
    const { data } = await api.post(`/v1.0/integrante/${planIntegranteId}/servicios`, {
      servicio_adicional_numero: servicioNumero,
    });
    return data.data;
  },

  // Remover un servicio de un integrante
  eliminarServicio: async (planIntegranteId, servicioNumero) => {
    const { data } = await api.delete(`/v1.0/integrante/${planIntegranteId}/servicios/${servicioNumero}`);
    return data;
  },
};

export default integranteServiciosService;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/integranteServiciosService.js
git commit -m "feat: create integrante servicios service for API calls"
```

---

### Task 7: Create IntegranteServicios Modal - Frontend

**Files:**
- Create: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/IntegranteServiciosModal.jsx`

- [ ] **Step 1: Create modal component**

```javascript
import React, { useState, useEffect } from 'react';
import integranteServiciosService from '../../../../../services/integranteServiciosService';
import './IntegranteServiciosModal.scss';

function IntegranteServiciosModal({ planIntegranteId, integrante, onClose, onSave }) {
  const [servicios, setServicios] = useState([]); // Available services
  const [selectedServicios, setSelectedServicios] = useState([]); // Selected services for this integrante
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [planIntegranteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all available services
      const allServicios = await integranteServiciosService.listarServicios();
      setServicios(Array.isArray(allServicios) ? allServicios : []);

      // Load selected services for this integrante
      const selected = await integranteServiciosService.obtenerServiciosIntegrante(planIntegranteId);
      setSelectedServicios(Array.isArray(selected) ? selected.map(s => s.servicio_adicional_numero) : []);
      setError(null);
    } catch (err) {
      console.error('Error loading services:', err);
      setError('Error al cargar servicios');
      setServicios([]);
      setSelectedServicios([]);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceChange = (servicioNumero, isChecked) => {
    if (isChecked) {
      setSelectedServicios(prev => [...prev, servicioNumero]);
    } else {
      setSelectedServicios(prev => prev.filter(s => s !== servicioNumero));
    }
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      // Get current services
      const currentServicios = await integranteServiciosService.obtenerServiciosIntegrante(planIntegranteId);
      const currentSet = new Set(currentServicios.map(s => s.servicio_adicional_numero));
      const selectedSet = new Set(selectedServicios);

      // Remove services that were deselected
      for (const servicioNum of currentSet) {
        if (!selectedSet.has(servicioNum)) {
          await integranteServiciosService.eliminarServicio(planIntegranteId, servicioNum);
        }
      }

      // Add new services
      for (const servicioNum of selectedSet) {
        if (!currentSet.has(servicioNum)) {
          await integranteServiciosService.agregarServicio(planIntegranteId, servicioNum);
        }
      }

      onSave();
    } catch (err) {
      console.error('Error saving services:', err);
      setError('Error al guardar servicios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="integrante-servicios-modal__overlay" onClick={onClose} />
      <div className="integrante-servicios-modal">
        <div className="integrante-servicios-modal__header">
          <h3>Servicios para {integrante?.nombre} {integrante?.apellido}</h3>
          <button className="integrante-servicios-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="integrante-servicios-modal__body">
          {error && <div className="integrante-servicios-modal__error">{error}</div>}

          {loading ? (
            <div className="integrante-servicios-modal__loading">Cargando servicios...</div>
          ) : servicios.length === 0 ? (
            <div className="integrante-servicios-modal__empty">No hay servicios disponibles</div>
          ) : (
            <div className="integrante-servicios-modal__list">
              {servicios.map((servicio) => (
                <div key={servicio.servicio_adicional_numero} className="integrante-servicios-modal__item">
                  <input
                    type="checkbox"
                    id={`servicio-${servicio.servicio_adicional_numero}`}
                    checked={selectedServicios.includes(servicio.servicio_adicional_numero)}
                    onChange={(e) => handleServiceChange(servicio.servicio_adicional_numero, e.target.checked)}
                  />
                  <label htmlFor={`servicio-${servicio.servicio_adicional_numero}`}>
                    {servicio.servicio_adicional_nombre}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="integrante-servicios-modal__footer">
          <button
            className="integrante-servicios-modal__btn integrante-servicios-modal__btn--primary"
            onClick={handleGuardar}
            disabled={saving || loading}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            className="integrante-servicios-modal__btn integrante-servicios-modal__btn--secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
}

export default IntegranteServiciosModal;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/IntegranteServiciosModal.jsx
git commit -m "feat: create integrante servicios modal for service selection"
```

---

### Task 8: Create SCSS for IntegranteServicios Modal - Frontend

**Files:**
- Create: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/IntegranteServiciosModal.scss`

- [ ] **Step 1: Create stylesheet**

```scss
.integrante-servicios-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  max-width: 500px;
  width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  z-index: 1001;

  &__overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #dee2e6;

    h3 {
      margin: 0;
      font-size: 1.1rem;
    }
  }

  &__close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6c757d;

    &:hover {
      color: #000;
    }
  }

  &__body {
    padding: 1.5rem;
    flex: 1;
    overflow-y: auto;
  }

  &__error {
    color: #dc3545;
    background-color: #f8d7da;
    border: 1px solid #f5c6cb;
    padding: 0.75rem 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  &__loading {
    text-align: center;
    padding: 2rem;
    color: #6c757d;
  }

  &__empty {
    text-align: center;
    padding: 2rem;
    color: #6c757d;
    font-style: italic;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  &__item {
    display: flex;
    align-items: center;
    padding: 0.5rem 0;

    input[type="checkbox"] {
      margin-right: 0.75rem;
      cursor: pointer;
      width: 16px;
      height: 16px;
    }

    label {
      cursor: pointer;
      margin: 0;
      font-size: 0.875rem;
    }
  }

  &__footer {
    display: flex;
    gap: 0.75rem;
    padding: 1.5rem;
    border-top: 1px solid #dee2e6;
    justify-content: flex-end;
  }

  &__btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.3s ease;

    &--primary {
      background-color: #007bff;
      color: white;

      &:hover:not(:disabled) {
        background-color: #0056b3;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    &--secondary {
      background-color: #6c757d;
      color: white;

      &:hover:not(:disabled) {
        background-color: #545b62;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/IntegranteServiciosModal.scss
git commit -m "feat: add styling for integrante servicios modal"
```

---

### Task 9: Update PlanV1Modal to Add Servicios Column and Icon - Frontend

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx`

- [ ] **Step 1: Add import for IntegranteServiciosModal**

At the top of the file, add:

```javascript
import IntegranteServiciosModal from './IntegranteServiciosModal';
```

- [ ] **Step 2: Add state for servicios modal**

In the component, after existing modal states (around line 26), add:

```javascript
const [serviciosModalOpen, setServiciosModalOpen] = useState(null); // null or plan_integrante_id
```

- [ ] **Step 3: Add handler for servicios modal**

Add this function after the existing handlers (around line 184):

```javascript
  const handleIntegranteServiciosOpen = (integrante) => {
    // Find the plan_integrante_id from the integrante
    // We need to get it from the full plan data or calculate it
    // For now, we'll store it in the integrante object
    setServiciosModalOpen(integrante);
  };

  const handleIntegranteServiciosSave = () => {
    setServiciosModalOpen(null);
    // Optionally reload plan data to show updated services
  };
```

- [ ] **Step 4: Update the afiliados table to include servicios column and icon**

Find the table rendering section (around line 384). Update it to:

```javascript
                  <table className="plan-v1-modal__afiliados-tabla">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>DNI</th>
                        <th>Servicios</th>
                        <th>Rol</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.integrantes.map((integrante) => (
                        <tr key={integrante.persona_id}>
                          <td>{integrante.persona?.nombre}</td>
                          <td>{integrante.persona?.apellido}</td>
                          <td>{integrante.persona?.numero_documento}</td>
                          <td>
                            <button
                              type="button"
                              className="plan-v1-modal__btn-icon"
                              onClick={() => handleIntegranteServiciosOpen(integrante)}
                              title="Seleccionar servicios"
                            >
                              ⚙
                            </button>
                          </td>
                          <td>
                            <select
                              value={integrante.rol}
                              onChange={(e) => handleRolChange(integrante.persona_id, e.target.value)}
                            >
                              <option value="titular">Titular</option>
                              <option value="adherente">Adherente</option>
                            </select>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="plan-v1-modal__btn-icon"
                              onClick={() => handleIntegranteEdit(integrante.persona_id)}
                              title="Editar"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              className="plan-v1-modal__btn-icon plan-v1-modal__btn-icon--danger"
                              onClick={() => handleIntegranteRemove(integrante.persona_id)}
                              title="Quitar"
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
```

- [ ] **Step 5: Add IntegranteServiciosModal to the secondary modals section**

Find where secondary modals are rendered (around line 490), add:

```javascript
      {serviciosModalOpen && (
        <IntegranteServiciosModal
          planIntegranteId={serviciosModalOpen.id}
          integrante={serviciosModalOpen.persona}
          onClose={() => setServiciosModalOpen(null)}
          onSave={handleIntegranteServiciosSave}
        />
      )}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx
git commit -m "feat: add servicios column and service selection icon to affiliates table"
```

---

### Task 10: Load Plan Integrante IDs in PlanV1Modal - Frontend

**Files:**
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx`
- Modify: `frontend/src/pages/DashboardPage/components/GestionPlanesV1/hooks/usePlanV1Form.js`

- [ ] **Step 1: Store integrante IDs in form state**

Update the `loadFullPlanData` function in PlanV1Modal (around line 69) to store the integrante ID:

```javascript
  const loadFullPlanData = async () => {
    try {
      const fullPlan = await planesV1Service.obtener(planData.plan_numero);
      console.log('[PlanV1Modal] Loaded full plan data:', fullPlan);

      // Actualizar el form con los datos completos incluyendo integrantes
      if (fullPlan && fullPlan.PlanIntegrantes) {
        // Convertir PlanIntegrantes al formato esperado por el form
        const integrantes = fullPlan.PlanIntegrantes.map(pi => ({
          id: pi.id, // ADD THIS LINE - store the DB id for service operations
          persona_id: pi.persona_id,
          persona: pi.Persona,
          rol: pi.rol,
        }));
        console.log('[PlanV1Modal] Integrantes encontrados:', integrantes);
        handleFieldChange('integrantes', integrantes);
      }
    } catch (err) {
      console.error('Error loading full plan data:', err);
    }
  };
```

- [ ] **Step 2: Also add ID when adding new integrante**

Update the `handleAfiladoSearch` function (around line 160) to include a placeholder ID:

```javascript
  const handleAfiladoSearch = (persona) => {
    if (form.integrantes.some((i) => i.persona_id === persona.id)) {
      alert('Este afiliado ya está asignado al plan');
      return;
    }
    // Open role selector - for now, default to 'adherente', user can change in table
    addIntegrante(persona, 'adherente');
    setAfiladoSearchOpen(false);
  };
```

Note: When creating new integrantes, the ID will be assigned by the backend after save.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/DashboardPage/components/GestionPlanesV1/modals/PlanV1Modal.jsx
git commit -m "feat: store plan integrante IDs for service operations"
```

---

### Task 11: Test Backend Endpoints - Verification

**No code changes, verification only**

- [ ] **Step 1: Start backend dev server**

```bash
cd backend && npm run dev
```

Expected: Server starts on port 5000

- [ ] **Step 2: Test getMaxAfiliadoNumber endpoint**

```bash
curl -X GET http://localhost:5000/api/v1.0/planes/numero-afiliado/max \
  -H "Authorization: Bearer <valid_jwt_token>"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "maxNumber": 100,
    "suggestedNumber": "101"
  }
}
```

- [ ] **Step 3: Test servicios endpoint**

```bash
curl -X GET http://localhost:5000/api/v1.0/servicios-adicionales \
  -H "Authorization: Bearer <valid_jwt_token>"
```

Expected: Array of services (must have at least one test service in DB)

- [ ] **Step 4: Test obtener plan with numeric_documento**

```bash
curl -X GET http://localhost:5000/api/v1.0/planes/1 \
  -H "Authorization: Bearer <valid_jwt_token>"
```

Expected: Plan data includes Persona with `numero_documento` field populated

---

### Task 12: Test Frontend UI - Verification

**No code changes, manual testing**

- [ ] **Step 1: Start frontend dev server**

```bash
cd frontend && npm start
```

Expected: App starts on port 3000

- [ ] **Step 2: Create a new plan**

Navigate to Gestion de Planes → + Nuevo Plan

- Check: DNI field of affiliates shows the document number (not empty)
- Check: "Número de Afiliado" field shows suggested number (e.g., "101")

- [ ] **Step 3: Add affiliate and test servicios**

In the Afiliados tab:
- Click "+ Agregar Afiliado"
- Select an affiliate
- In the table, click the ⚙ icon for that affiliate

Expected: IntegranteServiciosModal opens with list of available services

- [ ] **Step 4: Select services and save**

- Check some services
- Click "Guardar"

Expected: Modal closes, services are saved

- [ ] **Step 5: Verify servicios column displays**

After saving the plan and reopening it:
- In the Afiliados tab, check that the servicios column shows an icon for affiliates with services

---

## Git Status

All changes should be on branch `V_1.0.2` with frequent commits per task.

Expected commits:
1. Fix incluir numero_documento in Persona
2. Fix improve affiliate number suggestion
3. Create integrante servicios controller
4. Create integrante servicios routes
5. Register integrante servicios routes
6. Create integrante servicios service
7. Create integrante servicios modal
8. Add SCSS for integrante servicios modal
9. Add servicios column and icon to PlanV1Modal
10. Store plan integrante IDs for service operations

Total: 10 commits (excluding verification steps)

---

## Success Criteria

✅ DNI field displays correctly in affiliate list and edit modal
✅ Affiliate number suggestion appears when creating new plan
✅ User can select servicios for each affiliate via modal icon
✅ Servicios column appears in affiliate table
✅ Servicios are saved and persist when reopening plan
✅ All endpoints properly validated and error handling in place
✅ No console errors in frontend or backend

