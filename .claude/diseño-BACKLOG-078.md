# BACKLOG-078: Agregar Parámetro "valor_cuota_social" y Renombrar Sección de Configuración

**Prioridad:** 🟡 Media  
**Estado:** 📋 Registrado  
**Fecha:** 2026-05-15

---

## Requerimiento

### Problema Actual
La sección "Redondeo de cuotas" en ConfiguracionNotificaciones solo contiene un parámetro: `redondeo_precision`. El nombre de la sección es muy específico y no refleja su propósito más amplio como sección de parámetros del sistema.

### Requerimiento
1. **Crear nuevo parámetro del sistema:** `valor_cuota_social` que acepte valores numéricos con decimales (punto o coma)
2. **Agregar en configuración:** El parámetro debe estar disponible en ConfiguracionNotificaciones
3. **Renombrar sección:** "Redondeo de cuotas" → "Parametros de configuracion"
4. **Validación:** Aceptar números con punto (.) o coma (,) como separador decimal

### Contexto
El parámetro `valor_cuota_social` es un valor base configurable que representa el costo de la cuota social en el sistema. Tener esta valor centralizado en configuración permite cambios globales sin modificar código. La sección renombrada reflejará mejor su propósito: contener múltiples parámetros del sistema, no solo redondeo.

---

## Análisis de Implementación Actual

### Ubicación del Parámetro de Configuración Actual
**Archivo:** `frontend/src/pages/DashboardPage/components/ConfiguracionNotificaciones/ConfiguracionNotificaciones.jsx`

#### Sección Actual (Redondeo de Cuotas)
```jsx
<div className="config-section">
  <h3>Redondeo de cuotas</h3>
  {/* redondeo_precision input aquí */}
</div>
```

### Tabla de Parámetros en Base de Datos
**Tabla:** `system_config`
**Campos actuales:**
- `id` (PK)
- `param_name` (VARCHAR 255, UNIQUE)
- `param_value` (TEXT)
- `param_type` (ENUM: 'number', 'string', 'boolean', 'decimal')
- `description` (TEXT)
- `created_at`, `updated_at`

**Parámetro existente:**
```sql
INSERT INTO system_config (param_name, param_value, param_type, description)
VALUES ('redondeo_precision', '2', 'number', 'Cantidad de decimales para redondeo de cuotas');
```

---

## Diseño de la Solución

### Cambio 1: Crear Migración BD (v2.0.28)

**Archivo:** `backend/src/migrations/versions/2.0.28/upgrade.sql`

```sql
-- Agregar nuevo parámetro valor_cuota_social
INSERT INTO system_config (param_name, param_value, param_type, description, created_at, updated_at)
VALUES (
  'valor_cuota_social',
  '0.00',
  'decimal',
  'Valor base de la cuota social (configurable)',
  NOW(),
  NOW()
);
```

**Archivo:** `backend/src/migrations/versions/2.0.28/downgrade.sql`

```sql
-- Remover parámetro valor_cuota_social
DELETE FROM system_config WHERE param_name = 'valor_cuota_social';
```

### Cambio 2: Actualizar Seed de Base de Datos

**Archivo:** `backend/scripts/seed.js`

Agregar al array de parámetros:
```javascript
{
  param_name: 'valor_cuota_social',
  param_value: '0.00',
  param_type: 'decimal',
  description: 'Valor base de la cuota social (configurable)'
}
```

### Cambio 3: Actualizar Modelo SystemConfig

**Archivo:** `backend/src/models/SystemConfig.js` (si existe)

Asegurar que el modelo incluye validación para decimales:
```javascript
param_value: {
  type: DataTypes.DECIMAL(10, 2),  // Permite hasta 99999999.99
  allowNull: false,
  defaultValue: 0
}
```

### Cambio 4: Actualizar ConfiguracionNotificaciones.jsx

**Ubicación:** `frontend/src/pages/DashboardPage/components/ConfiguracionNotificaciones/ConfiguracionNotificaciones.jsx`

#### 4.1 Renombrar Sección
```jsx
// Antes:
<div className="config-section">
  <h3>Redondeo de cuotas</h3>
  
// Después:
<div className="config-section">
  <h3>Parámetros de configuración</h3>
```

#### 4.2 Agregar Campo para valor_cuota_social
```jsx
{/* redondeo_precision - Field de redondeo */}
<div className="config-field">
  <label htmlFor="redondeo_precision">
    Precisión decimal para redondeo
  </label>
  <input
    id="redondeo_precision"
    type="number"
    min="0"
    max="10"
    value={config.redondeo_precision || 2}
    onChange={(e) => handleConfigChange('redondeo_precision', e.target.value)}
  />
</div>

{/* NUEVO: valor_cuota_social */}
<div className="config-field">
  <label htmlFor="valor_cuota_social">
    Valor cuota social
  </label>
  <input
    id="valor_cuota_social"
    type="text"
    placeholder="0.00"
    pattern="[0-9,.]+"
    value={config.valor_cuota_social || '0.00'}
    onChange={(e) => handleConfigChange('valor_cuota_social', e.target.value)}
    title="Ingrese un número con punto (.) o coma (,) como separador decimal"
  />
  <small>Ej: 10.50 o 10,50</small>
</div>
```

### Cambio 5: Actualizar Validación y Manejo en Frontend

**Archivo:** `frontend/src/services/configService.js`

Agregar validación al guardar:
```javascript
// Normalizar entrada: reemplazar coma por punto
const normalizeDecimalValue = (value) => {
  return value.replace(',', '.');
};

// En handleSave:
const valor_cuota_social_normalized = normalizeDecimalValue(values.valor_cuota_social);

// Validar formato
if (!/^\d+(\.\d{1,2})?$/.test(valor_cuota_social_normalized)) {
  throw new Error('valor_cuota_social: formato inválido. Aceptados: 10.50, 10,50');
}
```

### Cambio 6: Actualizar Validación Backend (Opcional)

**Archivo:** `backend/src/middleware/validate.js`

```javascript
// Validar que valor_cuota_social sea un decimal válido
const validateDecimalParam = (value) => {
  const normalized = value.replace(',', '.');
  const num = parseFloat(normalized);
  return !isNaN(num) && num >= 0 && /^\d+(\.\d{1,2})?$/.test(normalized);
};
```

---

## Estructura de Archivos Afectados

| Archivo | Cambios |
|---------|---------|
| `backend/src/migrations/versions/2.0.28/upgrade.sql` | Crear nueva migración para agregar parámetro |
| `backend/src/migrations/versions/2.0.28/downgrade.sql` | Downgrade idempotente |
| `backend/scripts/seed.js` | Agregar parámetro al seed |
| `backend/src/models/SystemConfig.js` | Validación de tipo decimal (si aplica) |
| `frontend/src/pages/DashboardPage/components/ConfiguracionNotificaciones/ConfiguracionNotificaciones.jsx` | Renombrar sección, agregar input para valor_cuota_social |
| `frontend/src/services/configService.js` | Validación y normalización de entrada |

---

## Impacto Visual

### Antes
```
┌─────────────────────────────────────────┐
│  Redondeo de cuotas                     │
│                                         │
│  Precisión decimal para redondeo        │
│  [2_________________]                   │
└─────────────────────────────────────────┘
```

### Después
```
┌─────────────────────────────────────────┐
│  Parámetros de configuración            │
│                                         │
│  Precisión decimal para redondeo        │
│  [2_________________]                   │
│                                         │
│  Valor cuota social                     │
│  [10.50_______________]                 │
│  Ej: 10.50 o 10,50                     │
└─────────────────────────────────────────┘
```

---

## Testing Plan

| Escenario | Acción | Resultado Esperado |
|-----------|--------|-------------------|
| **T1** | Ingresar valor "10.50" en valor_cuota_social | Se guarda correctamente como 10.50 |
| **T2** | Ingresar valor "10,50" (con coma) en valor_cuota_social | Se normaliza y guarda como 10.50 |
| **T3** | Ingresar valor "10" (sin decimales) | Se guarda como 10.00 |
| **T4** | Ingresar valor inválido "10,5,0" | Se rechaza con mensaje de error |
| **T5** | Ingresar valor negativo "-5.00" | Se rechaza o acepta según validación |
| **T6** | Cargar página ConfiguracionNotificaciones | Sección renombrada a "Parámetros de configuración" |
| **T7** | Guardar cambios en ambos campos | Ambos parámetros se persisten correctamente |
| **T8** | Recargar página | Valores guardados se restauran |

---

## Estimación

| Tarea | Horas | Notas |
|-------|-------|-------|
| Crear migración BD | 0.25h | Migración simple, downgrade idempotente |
| Actualizar seed | 0.1h | Una línea agregada |
| Modificar ConfiguracionNotificaciones.jsx | 0.5h | Renombrar sección, agregar input, estilos |
| Agregar validación frontend | 0.25h | Normalización de coma/punto |
| Testing manual | 0.5h | Validar formatos entrada, persistencia |
| **Total** | **1.6h** | Cambio simple, bajo riesgo |

---

## Consideraciones

### Ventajas
- ✅ Parámetro centralizado, editable sin código
- ✅ Aceptar ambos formatos (punto y coma) mejora UX en diferentes regiones
- ✅ Sección renombrada es más clara y extensible para futuros parámetros
- ✅ Bajo riesgo: solo agregar, sin modificar lógica existente

### Desventajas
- ❌ Require migración BD
- ❌ Normalización de coma a punto debe ser consistente en frontend y backend

### Futuras Extensiones
Con esta sección renombrada como "Parámetros de configuración", es fácil agregar más parámetros en el futuro:
- `valor_incremento_minimo`
- `valor_tasa_administrativa`
- `valor_descuento_pronto_pago`
- etc.

---

## Dependencias Bloqueantes
- ✅ Ninguna (cambio es independiente)

---

## Notas de Implementación

- **No requiere cambios backend API:** El backend ya soporta parámetros genéricos mediante SystemConfig
- **Normalización:** Implementar en frontend para reemplazar coma por punto antes de enviar al backend
- **Seed idempotente:** Si se ejecuta seed múltiples veces, no crear duplicados (usar INSERT IGNORE o verificar existencia)
- **Compatible:** Funciona en todos los navegadores modernos con `type="text"` + validación regex

---

## Orden de Implementación

1. Crear migración BD (2.0.28)
2. Actualizar seed
3. Modificar ConfiguracionNotificaciones.jsx (renombrar + agregar input)
4. Agregar validación en configService.js
5. Testing manual en navegador
6. Commit y push
