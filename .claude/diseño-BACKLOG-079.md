# BACKLOG-079: Registrar 3 Valores en Tabla Recibo

## Descripción Ejecutiva

Al generar recibos, el sistema debe registrar el desglose de la cuota en 3 componentes:
1. **cuota_social**: Valor fijo del parámetro "Valor Cuota Social" (del sistema)
2. **arancel_por_servicio**: Diferencia entre cuota del plan y cuota social
3. **valor_cuota**: Valor total de cuota del plan (ya implementado)

Esto permite auditoría detallada del cálculo de cuotas y transparencia en facturación.

---

## Requerimientos

### Funcionales

1. **Almacenamiento en BD**
   - Agregar 2 nuevas columnas a tabla `recibos`:
     - `cuota_social` (DECIMAL 10,2) NOT NULL DEFAULT 0
     - `arancel_por_servicio` (DECIMAL 10,2) NOT NULL DEFAULT 0
   - Columna `valor_cuota` ya existe

2. **Generación de Recibos**
   - Al crear recibo, leer parámetro `valor_cuota_social` del sistema
   - Calcular: `arancel_por_servicio = valor_cuota_plan - valor_cuota_social`
   - Guardar 3 valores en recibo:
     - `cuota_social` = parámetro del sistema
     - `arancel_por_servicio` = resultado del cálculo
     - `valor_cuota` = valor cuota del plan

3. **Validaciones**
   - Si parámetro `valor_cuota_social` no existe o es NULL: usar 0
   - Si `arancel_por_servicio` resulta negativo: alertar pero permitir (auditoría de casos excepcionales)
   - Validar que valor_cuota = cuota_social + arancel_por_servicio (invariante)

4. **Visualización**
   - ReciboDetalleModal: mostrar desglose en tabla:
     ```
     Componente               | Monto
     ─────────────────────────┼──────────
     Cuota Social             | $XXX.XX
     Arancel por Servicio     | $YYY.YY
     ─────────────────────────┼──────────
     Valor Total Cuota        | $ZZZ.ZZ
     ```
   - Si `arancel_por_servicio < 0`: mostrar con color de advertencia

---

## Diseño Técnico

### 1. Base de Datos

**Migración 2.0.30:**

```sql
-- upgrade.sql
ALTER TABLE recibos ADD COLUMN cuota_social DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER valor_cuota;
ALTER TABLE recibos ADD COLUMN arancel_por_servicio DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER cuota_social;

-- Actualizar registros existentes (backfill)
UPDATE recibos 
SET cuota_social = 0.00, arancel_por_servicio = valor_cuota
WHERE cuota_social = 0 AND arancel_por_servicio = 0;

-- downgrade.sql
ALTER TABLE recibos DROP COLUMN arancel_por_servicio;
ALTER TABLE recibos DROP COLUMN cuota_social;
```

**Modelo Sequelize (Recibo.js):**

```javascript
// Agregados al define de atributos
cuota_social: {
  type: DataTypes.DECIMAL(10, 2),
  allowNull: false,
  defaultValue: 0.00,
  comment: 'Valor de cuota social del sistema al momento de generar recibo'
},
arancel_por_servicio: {
  type: DataTypes.DECIMAL(10, 2),
  allowNull: false,
  defaultValue: 0.00,
  comment: 'Diferencia entre valor_cuota y cuota_social (servicios facturados)'
}
```

### 2. Backend - Controller

**recibosController.js - método `generar()`**

Cambios en función generar (línea ~40):

```javascript
// Dentro del bucle que crea integrantes de recibos
for (const integrante of plan.plan_integrantes) {
  // 1. Obtener parámetro del sistema
  const configApp = await db.ConfiguracionApp.findOne({
    attributes: ['valor_cuota_social'],
    where: {} // Usar el registro único de configuración
  });
  const cuotaSocial = parseFloat(configApp?.valor_cuota_social || 0);

  // 2. Calcular arancel por servicio
  const valorCuota = parseFloat(plan.valor_cuota || 0);
  const arancelPorServicio = valorCuota - cuotaSocial;

  // 3. Crear recibo con los 3 valores
  const recibo = await db.Recibo.create({
    // ... campos existentes (numero_recibo, zona_id, periodo, etc.)
    valor_cuota: valorCuota,
    cuota_social: cuotaSocial,
    arancel_por_servicio: arancelPorServicio,
    // ... resto de campos
  });

  // 4. Registrar advertencia si arancel es negativo
  if (arancelPorServicio < 0) {
    logger.warn(
      `BACKLOG-079: arancel_por_servicio negativo en recibo. ` +
      `Plan: ${plan.numero_afiliado}, valor_cuota: ${valorCuota}, ` +
      `cuota_social: ${cuotaSocial}, arancel: ${arancelPorServicio}`
    );
  }
}
```

**Validación invariante:**

```javascript
// Después de crear cada recibo
const invariante = Math.abs(
  (recibo.cuota_social + recibo.arancel_por_servicio) - recibo.valor_cuota
);
if (invariante > 0.01) { // Tolerancia por redondeo
  throw new Error(
    `Invariante de desglose violada. Recibo: ${recibo.id}. ` +
    `Suma: ${recibo.cuota_social + recibo.arancel_por_servicio}, ` +
    `Total: ${recibo.valor_cuota}`
  );
}
```

### 3. Frontend - Component

**ReciboDetalleModal.jsx - Nueva Sección de Desglose**

Ubicación: Después de mostrar datos del afiliado y plan, antes de historial de cambios.

```javascript
// Componente auxiliar: ResumenDesglose
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

// En el render principal de ReciboDetalleModal
return (
  <Modal>
    {/* Datos del recibo */}
    <ReciboHeader recibo={recibo} />
    
    {/* NUEVO: Desglose de cuota */}
    <ResumenDesglose
      cuotaSocial={recibo.cuota_social}
      arancelPorServicio={recibo.arancel_por_servicio}
      valorCuota={recibo.valor_cuota}
    />
    
    {/* Resto del contenido */}
    <ReciboFooter recibo={recibo} />
  </Modal>
);
```

**ReciboDetalleModal.scss - Nuevos Estilos**

```scss
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

### 4. Servicio Frontend

**recibosService.js**

Cambios menores para pasar nuevos campos:

```javascript
// En método getDetalles() - asegurar que retorna los nuevos campos
getDetalles: async (recibosId) => {
  const { data } = await api.get(`/recibos/${recibosId}`);
  return data.data || data;
  // Respuesta debe incluir: cuota_social, arancel_por_servicio, valor_cuota
},
```

---

## Flujo de Generación (Completo)

```
GenerarRecibosModal.handleGenerar()
↓
POST /api/recibos/generar { periodo, planes }
↓
recibosController.generar()
  ├─ Obtener parámetro sistema: valor_cuota_social
  ├─ Para cada plan:
  │  ├─ valor_cuota = plan.valor_cuota
  │  ├─ cuota_social = parámetro
  │  ├─ arancel = valor_cuota - cuota_social
  │  └─ CREATE Recibo { valor_cuota, cuota_social, arancel_por_servicio }
  ├─ Registrar warnings si arancel < 0
  └─ Retorna { success: true, recibos: [...] }
↓
Frontend recibe respuesta exitosa
↓
Usuario abre ReciboDetalleModal
  └─ Muestra tabla de desglose con 3 valores
```

---

## Casos de Uso

### Caso 1: Generación Normal
- Parámetro `valor_cuota_social` = $50.00
- Plan tiene `valor_cuota` = $150.00
- **Resultado:**
  - `cuota_social` = $50.00
  - `arancel_por_servicio` = $100.00 (150 - 50)
  - `valor_cuota` = $150.00 ✅

### Caso 2: Sin Parámetro Configurado
- `valor_cuota_social` = NULL/indefinido
- Plan tiene `valor_cuota` = $100.00
- **Resultado:**
  - `cuota_social` = $0.00 (default)
  - `arancel_por_servicio` = $100.00 (100 - 0)
  - `valor_cuota` = $100.00 ✅

### Caso 3: Arancel Negativo (Advertencia)
- Parámetro `valor_cuota_social` = $200.00
- Plan tiene `valor_cuota` = $150.00
- **Resultado:**
  - `cuota_social` = $200.00
  - `arancel_por_servicio` = -$50.00 ⚠️
  - `valor_cuota` = $150.00
  - **Acción:** Log de warning, visualización en modal con ⚠️

---

## Archivos a Modificar

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `migrations/2.0.30/upgrade.sql` | Agregar 2 columnas a recibos | 🔴 |
| `migrations/2.0.30/downgrade.sql` | Remover 2 columnas | 🔴 |
| `backend/src/models/Recibo.js` | Definir atributos cuota_social, arancel_por_servicio | 🔴 |
| `backend/src/controllers/recibosController.js` | Lógica de cálculo en generar() | 🔴 |
| `backend/src/services/recibosService.js` | Incluir campos en respuestas | 🟡 |
| `frontend/src/pages/RecibosPage/RecibosPage.jsx` | (Opcional: mostrar desglose en listado) | 🟢 |
| `frontend/src/modals/ReciboDetalleModal.jsx` | Agregar sección desglose + ResumenDesglose | 🔴 |
| `frontend/src/modals/ReciboDetalleModal.scss` | Estilos para tabla desglose | 🔴 |
| `frontend/src/services/recibosService.js` | Validar incluye campos en getDetalles() | 🟡 |

---

## Testing

### Backend

```javascript
describe('recibosController.generar()', () => {
  test('genera recibos con desglose correcto', async () => {
    // Setup: crear plan con valor_cuota = 150
    // Setup: parámetro valor_cuota_social = 50
    
    const response = await generar({ periodo: '2026-05', planes: [planId] });
    
    // Verificar
    expect(response.recibos[0].cuota_social).toBe(50);
    expect(response.recibos[0].arancel_por_servicio).toBe(100);
    expect(response.recibos[0].valor_cuota).toBe(150);
    expect(recibo.cuota_social + recibo.arancel_por_servicio)
      .toBe(recibo.valor_cuota);
  });

  test('genera warning si arancel es negativo', async () => {
    // Setup: plan valor_cuota = 100, parámetro = 150
    
    const response = await generar({ ... });
    
    // Verificar warning en logs
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('negativo'));
  });
});
```

### Frontend

1. Generar recibos con parámetro conocido
2. Abrir ReciboDetalleModal
3. Verificar tabla desglose muestra 3 valores correctos
4. Editar parámetro a valor que genere arancel negativo
5. Generar nuevos recibos
6. Verificar advertencia en modal

---

## Impacto

- **Afecta tablas:** `recibos` (+ 2 columnas)
- **Afecta modelos:** `Recibo.js`
- **Afecta vistas:** `ReciboDetalleModal`, (opcional) `RecibosPage`
- **Backward compatible:** Sí (defaultValues = 0, backfill automático)
- **Requiere migración:** Sí (2.0.30)

---

## Estimación

| Tarea | Horas |
|-------|-------|
| Migración BD | 0.5 |
| Modelo Recibo.js | 0.25 |
| recibosController (lógica + validación) | 1.5 |
| ReciboDetalleModal + ResumenDesglose | 1 |
| Estilos SCSS | 0.5 |
| Testing backend | 1 |
| Testing frontend | 1 |
| **Total** | **6** |

---

## Notas

- Este requerimiento complementa **BACKLOG-078** (agregar parámetro `valor_cuota_social`). Asegurar que BACKLOG-078 esté completo antes de iniciar.
- El desglose es solo para auditoría. No afecta cálculos de forma sustancial (arancel = diferencia).
- En futuro, puede expandirse a más desglose (ej: cuota plan, cuota adicionales por servicios, impuestos, etc.).
