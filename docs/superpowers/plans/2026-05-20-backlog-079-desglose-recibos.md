# BACKLOG-079: Registrar Desglose de Cuotas en Recibos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add breakdown tracking to receipt records, capturing social fee (fixed system parameter) and service fee (calculated difference) separately from total quota value.

**Architecture:** Implement via database migration (2.0.30) adding two columns to `recibos` table, update Sequelize model, inject calculation logic into `recibosController.generar()`, and render breakdown in `ReciboDetalleModal` with visual warning for negative fees.

**Tech Stack:** Node.js/Express (backend), Sequelize ORM, React (frontend), Jest/Testing Library (tests), SCSS (styling)

---

## Task 1: Create Database Migration 2.0.30

**Files:**
- Create: `backend/src/migrations/versions/2.0.30/upgrade.sql`
- Create: `backend/src/migrations/versions/2.0.30/downgrade.sql`

### Step 1.1: Create upgrade.sql

Create the directory and file:

```sql
-- backend/src/migrations/versions/2.0.30/upgrade.sql
ALTER TABLE recibos ADD COLUMN cuota_social DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER valor_cuota;
ALTER TABLE recibos ADD COLUMN arancel_por_servicio DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER cuota_social;

-- Backfill existing records: assign full valor_cuota to arancel_por_servicio, cuota_social = 0
UPDATE recibos 
SET cuota_social = 0.00, arancel_por_servicio = valor_cuota
WHERE cuota_social = 0 AND arancel_por_servicio = 0;
```

- [ ] **Step 1.1: Create `backend/src/migrations/versions/2.0.30/upgrade.sql` with column definitions and backfill query**

### Step 1.2: Create downgrade.sql

```sql
-- backend/src/migrations/versions/2.0.30/downgrade.sql
ALTER TABLE recibos DROP COLUMN arancel_por_servicio;
ALTER TABLE recibos DROP COLUMN cuota_social;
```

- [ ] **Step 1.2: Create `backend/src/migrations/versions/2.0.30/downgrade.sql` with DROP COLUMN statements**

### Step 1.3: Verify migration can be listed

Run command:
```bash
npm run db:migrate:list
```

Expected output: Should show `2.0.30` as available migration.

- [ ] **Step 1.3: Run `npm run db:migrate:list` and confirm 2.0.30 appears**

---

## Task 2: Update Recibo Model

**Files:**
- Modify: `backend/src/models/Recibo.js` (around attribute definitions, ~30-80)

### Step 2.1: Add cuota_social attribute

Find the section where model attributes are defined (DataTypes.STRING, etc.). Add after `valor_cuota`:

```javascript
// In Recibo.js model definition
cuota_social: {
  type: DataTypes.DECIMAL(10, 2),
  allowNull: false,
  defaultValue: 0.00,
  comment: 'Valor de cuota social del sistema al momento de generar recibo'
},
```

- [ ] **Step 2.1: Add `cuota_social` attribute to Recibo model**

### Step 2.2: Add arancel_por_servicio attribute

Add right after `cuota_social`:

```javascript
arancel_por_servicio: {
  type: DataTypes.DECIMAL(10, 2),
  allowNull: false,
  defaultValue: 0.00,
  comment: 'Diferencia entre valor_cuota y cuota_social (servicios facturados)'
},
```

- [ ] **Step 2.2: Add `arancel_por_servicio` attribute to Recibo model**

### Step 2.3: Verify model syntax

Run linting:
```bash
npm run lint backend/src/models/Recibo.js
```

Expected: No errors.

- [ ] **Step 2.3: Run `npm run lint` on Recibo.js to verify syntax**

---

## Task 3: Implement Breakdown Calculation Logic in recibosController

**Files:**
- Modify: `backend/src/controllers/recibosController.js` (in `generar()` method, ~line 40+)

### Step 3.1: Read current generar() method

Open `backend/src/controllers/recibosController.js` and locate the `generar()` method. Identify the loop that iterates over `plan.plan_integrantes`.

- [ ] **Step 3.1: Read and understand current `generar()` method structure in recibosController.js**

### Step 3.2: Fetch ConfiguracionApp parameter

Inside the integrante loop, add at the top (before Recibo.create()):

```javascript
// Fetch system parameter: valor_cuota_social
const configApp = await db.ConfiguracionApp.findOne({
  attributes: ['valor_cuota_social'],
  where: {} // Single app config record
});
const cuotaSocial = parseFloat(configApp?.valor_cuota_social || 0);
```

- [ ] **Step 3.2: Add code to fetch `valor_cuota_social` from ConfiguracionApp**

### Step 3.3: Calculate arancel_por_servicio

Still inside the loop, add after fetching cuotaSocial:

```javascript
// Calculate service fee (difference between quota and social fee)
const valorCuota = parseFloat(plan.valor_cuota || 0);
const arancelPorServicio = valorCuota - cuotaSocial;
```

- [ ] **Step 3.3: Add calculation logic for `arancelPorServicio`**

### Step 3.4: Update Recibo.create() call

Find the `Recibo.create()` call in the loop. Add three new fields to the object:

```javascript
const recibo = await db.Recibo.create({
  // ... existing fields (numero_recibo, zona_id, periodo, etc.)
  valor_cuota: valorCuota,
  cuota_social: cuotaSocial,
  arancel_por_servicio: arancelPorServicio,
  // ... rest of fields
});
```

- [ ] **Step 3.4: Modify `Recibo.create()` call to include the three breakdown fields**

### Step 3.5: Add invariant validation

After each recibo is created, add validation:

```javascript
// Validate breakdown invariant (sum equals total, with float tolerance)
const invariante = Math.abs(
  (recibo.cuota_social + recibo.arancel_por_servicio) - recibo.valor_cuota
);
if (invariante > 0.01) {
  throw new Error(
    `Invariante de desglose violada. Recibo: ${recibo.id}. ` +
    `Suma: ${recibo.cuota_social + recibo.arancel_por_servicio}, ` +
    `Total: ${recibo.valor_cuota}`
  );
}
```

- [ ] **Step 3.5: Add invariant validation after recibo creation**

### Step 3.6: Add warning log for negative arancel

After recibo creation (inside the loop), add:

```javascript
// Log warning if service fee is negative
if (arancelPorServicio < 0) {
  logger.warn(
    `BACKLOG-079: arancel_por_servicio negativo en recibo. ` +
    `Plan: ${plan.numero_afiliado}, valor_cuota: ${valorCuota}, ` +
    `cuota_social: ${cuotaSocial}, arancel: ${arancelPorServicio}`
  );
}
```

- [ ] **Step 3.6: Add warning log for negative arancel_por_servicio**

### Step 3.7: Verify controller syntax

Run linting:
```bash
npm run lint backend/src/controllers/recibosController.js
```

Expected: No errors.

- [ ] **Step 3.7: Run `npm run lint` on recibosController.js to verify syntax**

---

## Task 4: Unit Test recibosController Breakdown Logic

**Files:**
- Create/Modify: `backend/src/tests/recibosController.test.js`

### Step 4.1: Write test for normal breakdown calculation

In test file (create if needed), add:

```javascript
describe('recibosController.generar() - Breakdown Calculation', () => {
  test('calcula desglose correcto cuando parámetro existe', async () => {
    // Setup: Create ConfiguracionApp with valor_cuota_social = 50
    const config = await db.ConfiguracionApp.create({
      valor_cuota_social: 50.00
    });

    // Setup: Create plan with valor_cuota = 150
    const plan = await db.Plan.create({
      numero_afiliado: 'TEST001',
      valor_cuota: 150.00
    });

    // Execute
    const response = await recibosController.generar({
      periodo: '2026-05',
      planes: [plan.id]
    });

    // Verify
    const recibo = response.recibos[0];
    expect(recibo.cuota_social).toBe(50);
    expect(recibo.arancel_por_servicio).toBe(100);
    expect(recibo.valor_cuota).toBe(150);
    expect(recibo.cuota_social + recibo.arancel_por_servicio).toBe(recibo.valor_cuota);
  });
});
```

- [ ] **Step 4.1: Write test for normal breakdown calculation (cuota_social=50, arancel=100, total=150)**

### Step 4.2: Write test for missing parameter (defaults to 0)

```javascript
test('usa 0 cuando parámetro valor_cuota_social no existe', async () => {
  // Setup: Delete ConfiguracionApp
  await db.ConfiguracionApp.destroy({ where: {} });

  // Setup: Create plan with valor_cuota = 100
  const plan = await db.Plan.create({
    numero_afiliado: 'TEST002',
    valor_cuota: 100.00
  });

  // Execute
  const response = await recibosController.generar({
    periodo: '2026-05',
    planes: [plan.id]
  });

  // Verify
  const recibo = response.recibos[0];
  expect(recibo.cuota_social).toBe(0);
  expect(recibo.arancel_por_servicio).toBe(100);
  expect(recibo.valor_cuota).toBe(100);
});
```

- [ ] **Step 4.2: Write test for missing parameter (defaults cuota_social to 0)**

### Step 4.3: Write test for negative arancel warning

```javascript
test('registra warning cuando arancel es negativo', async () => {
  // Setup: Create ConfiguracionApp with valor_cuota_social = 200
  await db.ConfiguracionApp.create({
    valor_cuota_social: 200.00
  });

  // Setup: Create plan with valor_cuota = 150 (results in -50 arancel)
  const plan = await db.Plan.create({
    numero_afiliado: 'TEST003',
    valor_cuota: 150.00
  });

  // Spy on logger.warn
  const warnSpy = jest.spyOn(logger, 'warn');

  // Execute
  const response = await recibosController.generar({
    periodo: '2026-05',
    planes: [plan.id]
  });

  // Verify warning was called
  expect(warnSpy).toHaveBeenCalledWith(
    expect.stringContaining('arancel_por_servicio negativo')
  );
  expect(warnSpy).toHaveBeenCalledWith(
    expect.stringContaining('BACKLOG-079')
  );
  
  warnSpy.mockRestore();
});
```

- [ ] **Step 4.3: Write test for negative arancel warning log**

### Step 4.4: Run tests

```bash
npm test -- backend/src/tests/recibosController.test.js
```

Expected: All three tests PASS.

- [ ] **Step 4.4: Run `npm test` on recibosController tests and verify all pass**

---

## Task 5: Create ResumenDesglose Frontend Component

**Files:**
- Create: `frontend/src/components/modals/ResumenDesglose.jsx`

### Step 5.1: Create ResumenDesglose component

```javascript
// frontend/src/components/modals/ResumenDesglose.jsx

import React from 'react';
import PropTypes from 'prop-types';
import './ResumenDesglose.scss';

const ResumenDesglose = ({ cuotaSocial, arancelPorServicio, valorCuota }) => {
  const esNegativo = arancelPorServicio < 0;
  const montoCuotaSocial = parseFloat(cuotaSocial || 0).toFixed(2);
  const montoArancel = parseFloat(arancelPorServicio || 0).toFixed(2);
  const montoTotal = parseFloat(valorCuota || 0).toFixed(2);

  return (
    <div className="recibo-desglose">
      <h4>Desglose de Cuota</h4>
      
      <table className="desglose-table">
        <tbody>
          <tr>
            <td className="desglose-label">Cuota Social</td>
            <td className="desglose-value">${montoCuotaSocial}</td>
          </tr>
          <tr className={esNegativo ? 'negativo' : ''}>
            <td className="desglose-label">Arancel por Servicio</td>
            <td className="desglose-value">
              ${montoArancel}
              {esNegativo && <span className="warning-icon">⚠️</span>}
            </td>
          </tr>
          <tr className="desglose-total">
            <td className="desglose-label"><strong>Valor Total Cuota</strong></td>
            <td className="desglose-value"><strong>${montoTotal}</strong></td>
          </tr>
        </tbody>
      </table>

      {esNegativo && (
        <div className="desglose-warning">
          ⚠️ Arancel negativo detectado. Revisar con administrador.
        </div>
      )}
    </div>
  );
};

ResumenDesglose.propTypes = {
  cuotaSocial: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  arancelPorServicio: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  valorCuota: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

ResumenDesglose.defaultProps = {
  cuotaSocial: 0,
  arancelPorServicio: 0,
  valorCuota: 0,
};

export default ResumenDesglose;
```

- [ ] **Step 5.1: Create ResumenDesglose.jsx component with breakdown table logic**

### Step 5.2: Run eslint on component

```bash
npm run lint frontend/src/components/modals/ResumenDesglose.jsx
```

Expected: No errors.

- [ ] **Step 5.2: Run `npm run lint` on ResumenDesglose.jsx**

---

## Task 6: Style ResumenDesglose Component

**Files:**
- Create: `frontend/src/components/modals/ResumenDesglose.scss`

### Step 6.1: Create SCSS file with styles

```scss
// frontend/src/components/modals/ResumenDesglose.scss

.recibo-desglose {
  margin: 20px 0;
  padding: 15px;
  background: #f9f9f9;
  border-left: 4px solid $color-primary;
  border-radius: 4px;

  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: $color-dark;
  }

  .desglose-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
    font-size: 13px;

    tr {
      border-bottom: 1px solid #e0e0e0;
      
      &.desglose-total {
        border-top: 2px solid $color-primary;
        border-bottom: none;
        background: #f0f7ff;
      }

      &.negativo {
        background: #fff3cd;
        color: #856404;
      }
    }

    td {
      padding: 8px 12px;
      text-align: right;

      &.desglose-label {
        text-align: left;
        font-weight: 500;
        color: $color-dark;
      }

      &.desglose-value {
        font-weight: 600;
        font-family: 'Monaco', monospace;
        color: $color-success;

        .warning-icon {
          margin-left: 6px;
          font-size: 12px;
        }
      }
    }

    tr.desglose-total td.desglose-value {
      color: $color-primary;
      font-size: 14px;
    }
  }

  .desglose-warning {
    padding: 10px 12px;
    background: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 3px;
    color: #856404;
    font-size: 12px;
    margin-top: 8px;
  }
}
```

- [ ] **Step 6.1: Create ResumenDesglose.scss with all styling for breakdown table and warning**

---

## Task 7: Integrate ResumenDesglose into ReciboDetalleModal

**Files:**
- Modify: `frontend/src/components/modals/ReciboDetalleModal.jsx`

### Step 7.1: Import ResumenDesglose

At the top of the file, add import:

```javascript
import ResumenDesglose from './ResumenDesglose';
```

- [ ] **Step 7.1: Add import statement for ResumenDesglose**

### Step 7.2: Render ResumenDesglose in modal body

Find where the modal renders recibo data. Add after rendering recibo header but before footer:

```javascript
{/* Desglose de Cuota */}
<ResumenDesglose
  cuotaSocial={recibo.cuota_social}
  arancelPorServicio={recibo.arancel_por_servicio}
  valorCuota={recibo.valor_cuota}
/>
```

- [ ] **Step 7.2: Add ResumenDesglose component rendering in ReciboDetalleModal body**

### Step 7.3: Verify component renders without errors

Open the app, generate recibos, open a ReciboDetalleModal and verify:
- Table appears with 3 rows (Cuota Social, Arancel por Servicio, Valor Total)
- Values display with $ prefix and 2 decimal places
- If arancel is negative, warning message appears

- [ ] **Step 7.3: Manually test that ResumenDesglose renders correctly in modal**

---

## Task 8: Unit Test ResumenDesglose Component

**Files:**
- Create: `frontend/src/tests/ResumenDesglose.test.jsx`

### Step 8.1: Write test for normal values

```javascript
import { render, screen } from '@testing-library/react';
import ResumenDesglose from '../components/modals/ResumenDesglose';

describe('ResumenDesglose Component', () => {
  test('renderiza tabla de desglose con valores normales', () => {
    render(
      <ResumenDesglose
        cuotaSocial={50}
        arancelPorServicio={100}
        valorCuota={150}
      />
    );

    expect(screen.getByText('Desglose de Cuota')).toBeInTheDocument();
    expect(screen.getByText('Cuota Social')).toBeInTheDocument();
    expect(screen.getByText('Arancel por Servicio')).toBeInTheDocument();
    expect(screen.getByText('Valor Total Cuota')).toBeInTheDocument();
    
    // Check values are formatted with $
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });
});
```

- [ ] **Step 8.1: Write test for normal breakdown values rendering**

### Step 8.2: Write test for negative arancel

```javascript
test('muestra advertencia cuando arancel es negativo', () => {
  render(
    <ResumenDesglose
      cuotaSocial={200}
      arancelPorServicio={-50}
      valorCuota={150}
    />
  );

  // Check warning appears
  expect(screen.getByText(/Arancel negativo detectado/i)).toBeInTheDocument();
  
  // Check warning icon appears
  expect(screen.getByText('⚠️', { selector: '.warning-icon' })).toBeInTheDocument();
  
  // Check row has negativo class by checking for warning styling
  const arancelRow = screen.getByText('Arancel por Servicio').closest('tr');
  expect(arancelRow).toHaveClass('negativo');
});
```

- [ ] **Step 8.2: Write test for negative arancel warning display**

### Step 8.3: Write test for default props

```javascript
test('usa 0 como default cuando props no proporcionados', () => {
  render(<ResumenDesglose />);

  expect(screen.getByText('$0.00')).toBeInTheDocument();
  expect(screen.queryByText(/negativo/i)).not.toBeInTheDocument();
});
```

- [ ] **Step 8.3: Write test for default props handling**

### Step 8.4: Run tests

```bash
npm test -- frontend/src/tests/ResumenDesglose.test.jsx
```

Expected: All tests PASS.

- [ ] **Step 8.4: Run `npm test` on ResumenDesglose tests and verify all pass**

---

## Task 9: Integration Test - Full Recibo Generation Flow

**Files:**
- Create/Modify: `backend/src/tests/recibosController.integration.test.js`

### Step 9.1: Write end-to-end test

```javascript
describe('recibosController.generar() - Full Integration', () => {
  test('crea recibos con desglose completo y consistente', async () => {
    // Setup: Migración (2.0.30) ya corrida
    // Setup: Crear ConfiguracionApp
    const config = await db.ConfiguracionApp.create({
      valor_cuota_social: 75.00
    });

    // Setup: Crear plan
    const plan = await db.Plan.create({
      numero_afiliado: 'INTEG001',
      valor_cuota: 200.00
    });

    // Execute: Generar recibos
    const response = await recibosController.generar({
      periodo: '2026-05',
      planes: [plan.id]
    });

    // Verify response
    expect(response.success).toBe(true);
    expect(response.recibos).toHaveLength(1);

    // Verify breakdown values
    const recibo = response.recibos[0];
    expect(recibo.cuota_social).toBe(75);
    expect(recibo.arancel_por_servicio).toBe(125);
    expect(recibo.valor_cuota).toBe(200);

    // Verify invariant
    expect(recibo.cuota_social + recibo.arancel_por_servicio).toBe(recibo.valor_cuota);

    // Verify record exists in DB
    const dbRecibo = await db.Recibo.findByPk(recibo.id);
    expect(dbRecibo.cuota_social).toBe(75);
    expect(dbRecibo.arancel_por_servicio).toBe(125);
  });
});
```

- [ ] **Step 9.1: Write integration test for complete generation flow**

### Step 9.2: Run integration test

```bash
npm test -- backend/src/tests/recibosController.integration.test.js
```

Expected: Test PASSES.

- [ ] **Step 9.2: Run integration test and verify it passes**

---

## Task 10: Manual End-to-End Testing in Browser

**Files:**
- No code changes (testing only)

### Step 10.1: Run app and test normal case

1. Start backend and frontend servers
2. Log in as admin
3. Go to Recibos page
4. Generate recibos with known parámetro `valor_cuota_social`
5. Click on a recibo to open ReciboDetalleModal
6. Verify table appears with correct breakdown

- [ ] **Step 10.1: Test normal case - generate recibos and verify desglose displays correctly**

### Step 10.2: Test negative arancel case

1. Edit ConfiguracionApp parameter to a value higher than plan cuotas
2. Generate new recibos
3. Open ReciboDetalleModal
4. Verify warning message appears for negative arancel

- [ ] **Step 10.2: Test negative arancel - set high parámetro and verify warning shows**

### Step 10.3: Test missing parameter case

1. Delete or null out ConfiguracionApp `valor_cuota_social`
2. Generate recibos
3. Open ReciboDetalleModal
4. Verify `cuota_social` shows 0.00

- [ ] **Step 10.3: Test missing parameter - verify default to 0**

---

## Task 11: Commit All Changes

**Files:**
- All modified/created files from Tasks 1-10

### Step 11.1: Run migration up

```bash
npm run db:migrate:up
```

Expected: Migration 2.0.30 executes successfully.

- [ ] **Step 11.1: Execute migration `npm run db:migrate:up`**

### Step 11.2: Stage all changes and commit

```bash
git add backend/src/migrations/versions/2.0.30/
git add backend/src/models/Recibo.js
git add backend/src/controllers/recibosController.js
git add backend/src/tests/recibosController.test.js
git add backend/src/tests/recibosController.integration.test.js
git commit -m "feat(BACKLOG-079): agregar desglose de cuotas en recibos - BD"
```

- [ ] **Step 11.2: Commit backend changes (migration + model + controller + tests)**

```bash
git add frontend/src/components/modals/ResumenDesglose.jsx
git add frontend/src/components/modals/ResumenDesglose.scss
git add frontend/src/components/modals/ReciboDetalleModal.jsx
git add frontend/src/tests/ResumenDesglose.test.jsx
git commit -m "feat(BACKLOG-079): agregar desglose de cuotas en recibos - frontend"
```

- [ ] **Step 11.3: Commit frontend changes (component + styles + tests)**

### Step 11.4: Push branch

```bash
git push origin V_1.0.7
```

Expected: Branch pushed successfully.

- [ ] **Step 11.4: Push changes to remote branch**

---

## Self-Review Against Spec

✅ **Requerimiento 1: Almacenamiento en BD**
- Task 1: Create migration 2.0.30 with `cuota_social` and `arancel_por_servicio` columns
- Task 2: Update Recibo model with both attributes

✅ **Requerimiento 2: Generación de Recibos**
- Task 3: Implement `generar()` logic to read `valor_cuota_social`, calculate arancel, and save 3 values

✅ **Requerimiento 3: Validaciones**
- Task 3, Step 3.2: Default to 0 if parameter missing
- Task 3, Step 3.6: Log warning if arancel negative
- Task 3, Step 3.5: Validate invariant (sum = total)

✅ **Requerimiento 4: Visualización**
- Task 5: Create ResumenDesglose component with breakdown table
- Task 6: Style table with desglose layout
- Task 7: Integrate into ReciboDetalleModal
- Component shows all 3 values and warning for negative

✅ **Testing Coverage**
- Task 4: Backend unit tests for calculation logic
- Task 8: Frontend unit tests for component rendering
- Task 9: Integration test for full flow
- Task 10: Manual browser testing

✅ **Archivos Identificados**
- All files from spec's "Archivos a Modificar" section are covered

---

## Plan complete and saved to `docs/superpowers/plans/2026-05-20-backlog-079-desglose-recibos.md`

**Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review each task completion, fast iteration with quality gates

**2. Inline Execution** — Execute tasks sequentially in this session using executing-plans skill, batch execution with checkpoints between tasks

**Which approach would you prefer?**
