# Diseño: Permitir Porcentajes Negativos en Aumento Masivo de Cuotas

**Fecha**: 2026-05-15  
**Versión**: V_1.0.7  
**Rama**: `V_1.0.7`  
**Backlog**: BACKLOG-071

---

## Resumen Ejecutivo

Habilitar el ingreso de porcentajes negativos en el modal de aumento masivo de cuotas (BulkUpdateCuotaModal) para permitir rebajas de cuotas simultáneamente con aumentos. El cambio es principalmente de validación: eliminar restricciones que rechazaban valores ≤ 0, manteniendo la estructura, flujo y etiquetas existentes.

---

## Requisitos Funcionales

### RF1: Aceptar Porcentajes Negativos
- Input numérico "Porcentaje de aumento" debe aceptar valores negativos sin límites
  - Ejemplo: `-50` para disminuir en 50%, `-150` para disminuir en 150%
- Sin rango mínimo ni máximo (permitir cualquier valor)
- Mantener hint actualizado: `"(ej: 10 para +10%, -10 para -10%)"`

### RF2: Visualización Correcta en Preview
- Tabla de preview (Step 2) debe mostrar cambios negativos claramente
- Columna "Aumento" muestra formato dual:
  - **Para positivos**: `"+10% (+$10.00)"`
  - **Para negativos**: `"-15% (-$15.00)"`
- Resumen de preview (arriba de tabla) muestra signo dinámico:
  - Si valor = 10: `"Aumento: +10%"`
  - Si valor = -15: `"Aumento: -15%"`

### RF3: Cálculo Matemático Transparente
- Fórmula se mantiene igual: `cuotaNueva = cuotaActual × (1 + porcentaje/100)`
- Permite resultados negativos si `porcentaje < -100` (ej: -100% → cuota = $0, -150% → cuota = negativa)
- Redondeo se aplica normalmente según `redondeo_precision` configurado

### RF4: Historial y Auditoría
- Tabla `aumentos_masivos` registra porcentaje con signo (ya existe, sin cambios)
- Ejemplo: `porcentaje = -15` se guarda como número negativo

---

## Validaciones y Reglas de Negocio

### Validación de Input
1. **Frontend**: Rechazar solo si campo está vacío (`valor === ''`)
2. **Backend**: Rechazar solo si es undefined, null, o vacío (`!valor`)
3. **Rango**: SIN restricción de rango (permitir `-∞ a +∞`)

### Casos de Uso
| Porcentaje | Cuota Antes | Cuota Después | Propósito |
|------------|-------------|---------------|-----------|
| +10 | $100 | $110 | Aumento normal |
| -10 | $100 | $90 | Descuento normal |
| -100 | $100 | $0 | Eliminación de cuota |
| -150 | $100 | -$50 | Descuento total + ajuste |

---

## Arquitectura Técnica

### Frontend: `BulkUpdateCuotaModal.jsx`

**Cambio 1: Input de Porcentaje (línea ~271)**
```jsx
// ANTES:
<input type="number" step="0.01" min="0.01" value={valor} ... />

// DESPUÉS:
<input type="number" step="0.01" value={valor} ... />
```
- Remover atributo `min="0.01"`
- Permite valores negativos automáticamente

**Cambio 2: Label/Hint (línea ~263-265)**
```jsx
// ANTES:
<label>
  Porcentaje de aumento (%):
  <span className="form-hint"> (ej: 10 para +10%)</span>
</label>

// DESPUÉS:
<label>
  Porcentaje de aumento (%):
  <span className="form-hint"> (ej: 10 para +10%, -10 para -10%)</span>
</label>
```

**Cambio 3: Validación en handlePreview() (línea ~156-159)**
```jsx
// ANTES:
if (!valor || parseFloat(valor) <= 0) {
  setError('Ingresa un porcentaje válido');
  return;
}

// DESPUÉS:
if (!valor) {
  setError('Ingresa un porcentaje válido');
  return;
}
```
- Cambiar `parseFloat(valor) <= 0` → solo validar que no esté vacío

**Cambio 4: Resumen de preview (línea ~321-324)**
```jsx
// ANTES:
<p>
  Aumento: <strong>+{valor}%</strong>
</p>

// DESPUÉS:
<p>
  Aumento: <strong>{parseFloat(valor) > 0 ? '+' : ''}{valor}%</strong>
</p>
```
- Mostrar signo dinámicamente (+ para positivos, - para negativos)

**Cambio 5: Columna "Aumento" en tabla preview (línea ~380-381)**
```jsx
// ANTES:
<td>
  {`+${valor}% ($${difference.toFixed(2)})`}
</td>

// DESPUÉS:
<td>
  {`${parseFloat(valor) > 0 ? '+' : ''}${valor}% (${parseFloat(difference) >= 0 ? '+' : ''}$${difference.toFixed(2)})`}
</td>
```
- Mostrar signo en porcentaje y en diferencia
- Ejemplo: `-15% (-$15.00)` o `+10% (+$10.00)`

---

### Backend: `planesController.js`

**Cambio 1: Validación en bulkUpdateCuota() (línea ~119-121)**
```javascript
// ANTES:
if (!valor || parseFloat(valor) <= 0) {
  return res.status(400).json({ success: false, message: 'valor debe ser positivo' });
}

// DESPUÉS:
if (!valor) {
  return res.status(400).json({ success: false, message: 'valor es requerido' });
}
```
- Remover restricción `parseFloat(valor) <= 0`
- Cambiar mensaje a algo más neutro

**Cambio 2: Cálculo (línea ~140-142)**
- SIN CAMBIOS — ya funciona con negativos:
  ```javascript
  let valorNuevo = valActualNum * (1 + parseFloat(valor) / 100);
  valorNuevo = Math.ceil(valorNuevo / precision) * precision;
  ```

---

### No Hay Cambios En

- ✅ Modelo `AumentoMasivo` — acepta números negativos
- ✅ Endpoint `PATCH /api/planes/bulk-update-cuota` — ya funciona
- ✅ Lógica de filtros — sin cambios
- ✅ Transacciones y registros — sin cambios
- ✅ Tabla de historial (`aumentos_masivos`) — sin cambios

---

## Testing Plan

### Frontend Tests
1. **Input vacío**: Mostrar error "Ingresa un porcentaje válido"
2. **Porcentaje positivo** (+10): Mostrar "+10%" en resumen y "+10% (+$X.XX)" en tabla
3. **Porcentaje negativo** (-15): Mostrar "-15%" en resumen y "-15% (-$X.XX)" en tabla
4. **Valores extremos** (-500, +1000): Sin errores, cálculos correctos

### Backend Tests
1. **Validación**: Rechazar solo si `!valor`
2. **Cálculo**: Verificar que `-15% sobre $100 = $85` y `-100% sobre $100 = $0`
3. **Historial**: Registrar en `aumentos_masivos` con porcentaje negativo
4. **Redondeo**: Aplicar `redondeo_precision` correctamente en resultados negativos

### Casos de Uso
- ✅ Descuento del 15%: `-15` → $100 → $85
- ✅ Eliminación total: `-100` → $100 → $0
- ✅ Descuento extremo: `-150` → $100 → -$50 (cuota negativa)
- ✅ Aumento normal: `+10` → $100 → $110 (sin regresión)

---

## Impacto en Otras Áreas

### Cuotas Negativas
- Permitidas por diseño (sin límite de rango)
- ⚠️ Nota: descuentos > 100% generan cuotas negativas
- Implicación: generación de recibos con montos negativos (refleja descuentos acumulados)

### Compatibilidad Hacia Atrás
- ✅ Cambio es puramente aditivo (permite más valores)
- ✅ Aumentos positivos siguen funcionando igual
- ✅ Sin cambios en BD, rutas, o estructura de datos

---

## Criterio de Completitud

- [ ] Cambios frontend: input sin `min`, validación sin `<= 0`, hints y etiquetas actualizados
- [ ] Cambios backend: validación sin `<= 0`, mensaje de error actualizado
- [ ] Testing: verificar positivos, negativos, y casos extremos
- [ ] Commit y push a rama `V_1.0.7`
- [ ] Actualizar BACKLOG-071 a "🚀 Desarrollado"

---

## Notas de Implementación

1. **Orden de cambios**: Cambios frontend y backend son independientes — pueden hacerse en paralelo
2. **Testeo manual**: Probar flujo completo en dev server (si disponible)
3. **Redondeo**: El sistema ya maneja negativos en `Math.ceil()` — verificar casos extremos
4. **Historial**: La tabla `aumentos_masivos` ya existe y acepta negativos

