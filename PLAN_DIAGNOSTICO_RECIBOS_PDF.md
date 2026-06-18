# Plan de Diagnóstico: Valores de Template no Respetados en PDF

**Versión:** 1.0  
**Fecha:** 2026-06-18  
**Estado:** En Diseño  
**Prioridad:** CRÍTICO

---

## Resumen del Problema

El PDF generado **no respeta los valores del template configurado**:
- **Template configurado:** 2 recibos/página, A4, márgenes 10mm, gap 6mm
- **Comportamiento actual:** 1 recibo/página (4 páginas en lugar de 2)
- **Raíz probable:** `recibos_por_pagina` no se lee correctamente del template

---

## Arquitectura de la Cadena de Datos

```
ReciboTemplate (BD)
    ↓
generarPDF() [controller v1.0]
    ├─ Leer templateDB.bloque_pageconfig
    ├─ Extraer pageConfig (recibos_por_pagina, márgenes, gap)
    ├─ Calcular reciboHeight
    └─ Generar HTML con divs dimensionados
    ↓
generateMultiPagePDF() [pdfHelpers]
    ├─ Envolver HTML con DOCTYPE
    ├─ Pasar opciones a html-pdf
    └─ Retornar buffer PDF
    ↓
Cliente recibe PDF
```

**Puntos críticos donde se pierden valores:**
1. **BD → Controller:** ¿Se lee correctamente `bloque_pageconfig`?
2. **Controller → HTML:** ¿Se calculan correctamente las alturas?
3. **HTML → PDF:** ¿Respeta html-pdf los divs dimensionados?

---

## Puntos de Ruptura Identificados

### 1. Lectura desde BD (líneas 586-622 recibosController.js)

**Código actual:**
```javascript
// Línea 587-589: primer intento de leer
let templateDB = await db.ReciboTemplate.findOne({
  where: { activo: true },
});

// Línea 591-599: intento confuso de leer pageConfig
let pageConfig = templateDB?.bloque_pageconfig || {};
if (typeof pageConfig === 'string') {
  try {
    pageConfig = JSON.parse(pageConfig);
  } catch (e) {
    pageConfig = {};
  }
}

// Línea 601-622: SOBRESCRITURA de pageConfig (¿redundante?)
let bloquePageConfig = templateDB.bloque_pageconfig || {};
if (typeof bloquePageConfig === 'string') {
  try {
    bloquePageConfig = JSON.parse(bloquePageConfig);
  } catch (e) {
    console.error('[PDF] Error parseando bloque_pageconfig:', e);
    bloquePageConfig = {};
  }
}

if (bloquePageConfig && Object.keys(bloquePageConfig).length > 0) {
  pageConfig.gap_vertical_mm = bloquePageConfig.gap_vertical_mm;
  pageConfig.recibos_por_pagina = bloquePageConfig.recibos_por_pagina;
  // ... más asignaciones
}
```

**Problemas detectados:**
- ✗ Código confuso: intenta leer `pageConfig` DOS VECES (líneas 592 y 601)
- ✗ Primera lectura (592) puede quedar sin parsear si es string
- ✗ Segunda lectura (601) intenta sobreescribir, pero condición es confusa
- ✗ NO HAY LOGS del valor leído desde BD antes del parsing

### 2. Modelo ReciboTemplate (ReciboTemplate.js)

**Getter de `bloque_pageconfig` (líneas 71-89):**
```javascript
get() {
  const value = this.getDataValue('bloque_pageconfig');
  if (typeof value === 'string') {
    return JSON.parse(value);
  }
  // Intento de reconstruir si viene como objeto de caracteres (BUG previo)
  if (typeof value === 'object' && value !== null && !Array.isArray(value) && !value.tamaño) {
    try {
      let reconstructed = '';
      for (let key in value) {
        reconstructed += value[key];
      }
      return JSON.parse(reconstructed);
    } catch (e) {
      return value;
    }
  }
  return value;
}
```

**Problemas detectados:**
- ✗ Getter intenta auto-reparar objetos corruptos (sintoma de bug previo)
- ✗ Si el getter falla, `templateDB.bloque_pageconfig` puede ser `undefined` o corrupcionado
- ? **NO SABEMOS si el getter devuelve objeto o string**

### 3. Cálculo de Altura de Recibo (línea 643)

```javascript
const reciboHeight = (availableHeight - (recibosPerPage - 1) * gapVertical - buffer) / recibosPerPage;
```

**Problemas detectados:**
- ✗ Si `recibosPerPage === 1` (default), la fórmula es correcta
- ✓ Pero si `recibosPerPage === 2`, necesitamos validar que la fórmula funciona
- ? **NO SABEMOS si `recibosPerPage` se leyó como 1 o 2**

### 4. Logs Insuficientes (línea 645-652)

El código loga `pageConfig` completo, pero:
- ✗ NO LOGA el valor RAW de `bloque_pageconfig` antes de parsear
- ✗ NO LOGA qué propiedades se extrajeron exitosamente
- ✗ NO LOGA si `bloquePageConfig` fue vacío (línea 613)

---

## Diagnóstico: Plan de 5 Pasos

### **PASO 1: Verificar Estado de BD** (15 minutos)
**Objetivo:** Confirmar que el template existe y tiene valores correctos en BD

**Acciones:**
1. Conectar a BD (Hostinger MySQL)
2. Ejecutar:
   ```sql
   SELECT id, nombre, activo, bloque_pageconfig FROM recibo_templates WHERE activo = true LIMIT 1;
   ```
3. Inspeccionar `bloque_pageconfig`:
   - ¿Es NULL?
   - ¿Es un JSON string válido?
   - ¿Contiene las claves `recibos_por_pagina`, `gap_vertical_mm`, etc.?

**Log de salida esperado:**
```
Recibos por página en BD: 2 (value: 2, type: number)
Gap vertical en BD: 6 (value: 6, type: number)
Márgenes en BD: {superior: 10, inferior: 10, izquierdo: 10, derecho: 10}
```

**Archivo donde registrar:** `/PLAN_DIAGNOSTICO_RECIBOS_PDF.md` (sección Resultados)

---

### **PASO 2: Verificar Lectura en Controller** (10 minutos)
**Objetivo:** Confirmar que el controller lee correctamente desde la BD

**Acciones:**
1. Modificar `recibosController.js` líneas 586-622:
   - ANTES del primer `if (typeof pageConfig === 'string')` (línea 593), agregar:
     ```javascript
     console.log('[PDF-DEBUG] templateDB raw:', {
       id: templateDB?.id,
       nombre: templateDB?.nombre,
       activo: templateDB?.activo,
       bloque_pageconfig_raw: templateDB?.bloque_pageconfig,
       bloque_pageconfig_type: typeof templateDB?.bloque_pageconfig,
     });
     ```
   - DESPUÉS de ambos parseos (línea 622), agregar:
     ```javascript
     console.log('[PDF-DEBUG] pageConfig después de lecturas:', pageConfig);
     console.log('[PDF-DEBUG] bloquePageConfig después de lecturas:', bloquePageConfig);
     ```

2. Generar PDF una vez y revisar logs
3. Comparar valores de BD vs controller

**Archivo donde registrar:** `/PLAN_DIAGNOSTICO_RECIBOS_PDF.md` (sección Resultados)

---

### **PASO 3: Verificar Modelo Getter** (10 minutos)
**Objetivo:** Confirmar que el getter de `bloque_pageconfig` funciona correctamente

**Acciones:**
1. Si en PASO 2 se observa que `bloque_pageconfig_raw` viene parseado:
   - El getter está devolviendo objeto ✓
   
2. Si `bloque_pageconfig_raw` viene como string:
   - El getter está devolviendo string (posible error en modelo)
   - El controller intenta parsear nuevamente (redundancia)

3. Crear test unitario simple en `backend/src/models/ReciboTemplate.test.js`:
   ```javascript
   const db = require('../models');
   
   test('ReciboTemplate getter bloque_pageconfig devuelve objeto', async () => {
     const template = await db.ReciboTemplate.findOne({ where: { activo: true } });
     const config = template.bloque_pageconfig;
     
     expect(typeof config).toBe('object');
     expect(config.recibos_por_pagina).toBeDefined();
     expect(typeof config.recibos_por_pagina).toBe('number');
   });
   ```

**Archivo donde registrar:** `/PLAN_DIAGNOSTICO_RECIBOS_PDF.md` (sección Resultados)

---

### **PASO 4: Verificar HTML Generado** (15 minutos)
**Objetivo:** Confirmar que el HTML tiene los divs correctamente dimensionados

**Acciones:**
1. Modificar `generarPDF()` línea 728, ANTES de `generateMultiPagePDF()`:
   ```javascript
   console.log('[PDF-DEBUG] fullHTML primeros 2000 caracteres:\n', fullHTML.substring(0, 2000));
   ```

2. Generar PDF nuevamente

3. En los logs, buscar:
   - ¿Los divs `.page` tienen `margin` y `padding` correctos?
   - ¿El div contenedor tiene `height: Xmm` (donde X = reciboHeight * recibosPerPage + gap)?
   - ¿Hay divs internos con `height: Ymm` (donde Y = reciboHeight)?

**Ejemplo de HTML correcto (para 2 recibos/página):**
```html
<div class="page" style="page-break-after: always; margin: 0; padding: 10mm 10mm 10mm 10mm;">
  <div style="height: 130mm; margin: 0; padding: 0; page-break-inside: avoid;">
    <!-- Recibo 1: height = 65mm -->
    <div style="height: 65mm; margin: 0; padding: 0; overflow: hidden;">...</div>
    <!-- Gap: height = 6mm -->
    <div style="height: 6mm; margin: 0; padding: 0; display: block;">&nbsp;</div>
    <!-- Recibo 2: height = 65mm -->
    <div style="height: 65mm; margin: 0; padding: 0; overflow: hidden;">...</div>
  </div>
</div>
```

**Archivo donde registrar:** `/PLAN_DIAGNOSTICO_RECIBOS_PDF.md` (sección Resultados)

---

### **PASO 5: Rastrear a través de html-pdf** (10 minutos)
**Objetivo:** Confirmar que html-pdf respeta las alturas del HTML

**Acciones:**
1. El problema más probable es que html-pdf **NO respeta** las alturas en `<div>` cuando usa `html-pdf` (librería antigua, limitaciones conocidas)
   
2. Revisar alternativas:
   - html-pdf fuerza márgenes propios ¿eso reduce `availableHeight`?
   - Los divs dimensionados en HTML pueden ser ignorados por html-pdf
   - Necesitamos validar si `page-break-inside: avoid` funciona en html-pdf

3. Test rápido: cambiar `generateMultiPagePDF()` para loguear opciones:
   ```javascript
   console.log('[PDF-DEBUG] Opciones html-pdf:', options);
   ```

**Archivo donde registrar:** `/PLAN_DIAGNOSTICO_RECIBOS_PDF.md` (sección Resultados)

---

## Correcciones Propuestas (orden de aplicación)

### **CORRECCIÓN A: Simplificar Lectura de pageConfig** (crítico)
**Archivo:** `backend/src/controllers/v1.0/recibosController.js` líneas 586-622

**Cambio:**
```javascript
// ANTES: código confuso con dos lecturas
let pageConfig = templateDB?.bloque_pageconfig || {};
if (typeof pageConfig === 'string') {
  try {
    pageConfig = JSON.parse(pageConfig);
  } catch (e) {
    pageConfig = {};
  }
}
let bloquePageConfig = templateDB.bloque_pageconfig || {};
if (typeof bloquePageConfig === 'string') {
  try {
    bloquePageConfig = JSON.parse(bloquePageConfig);
  } catch (e) {
    console.error('[PDF] Error parseando bloque_pageconfig:', e);
    bloquePageConfig = {};
  }
}
if (bloquePageConfig && Object.keys(bloquePageConfig).length > 0) {
  pageConfig.gap_vertical_mm = bloquePageConfig.gap_vertical_mm;
  // ... más asignaciones
}

// DESPUÉS: código claro con UNA lectura
const pageConfig = templateDB?.bloque_pageconfig || {};

// Validar que pageConfig es objeto válido
if (!pageConfig || typeof pageConfig !== 'object' || Object.keys(pageConfig).length === 0) {
  console.warn('[PDF] Template sin pageConfig, usando defaults');
  pageConfig = {
    tamaño: 'A4',
    orientacion: 'portrait',
    recibos_por_pagina: 1,
    margen_superior_mm: 10,
    margen_inferior_mm: 10,
    margen_izquierdo_mm: 10,
    margen_derecho_mm: 10,
    gap_vertical_mm: 0,
  };
}

// Log de auditoría
console.log('[PDF] pageConfig leído de BD:', {
  recibos_por_pagina: pageConfig.recibos_por_pagina,
  gap_vertical_mm: pageConfig.gap_vertical_mm,
  tamaño: pageConfig.tamaño,
  márgenes: {
    superior: pageConfig.margen_superior_mm,
    inferior: pageConfig.margen_inferior_mm,
    izquierdo: pageConfig.margen_izquierdo_mm,
    derecho: pageConfig.margen_derecho_mm,
  },
});
```

**Validación:**
- El log debe mostrar `recibos_por_pagina: 2` (si está configurado)
- Si muestra `recibos_por_pagina: 1` o `undefined`, el template no se guardó correctamente

---

### **CORRECCIÓN B: Validar Valor de recibosPerPage** (importante)
**Archivo:** `backend/src/controllers/v1.0/recibosController.js` línea 624

**Cambio:**
```javascript
// ANTES
const recibosPerPage = pageConfig.recibos_por_pagina || 1;

// DESPUÉS
const recibosPerPage = pageConfig.recibos_por_pagina || 1;

// Validar que es número válido
if (!Number.isInteger(recibosPerPage) || recibosPerPage < 1 || recibosPerPage > 10) {
  console.warn(`[PDF] recibos_por_pagina inválido (${recibosPerPage}), usando 1`);
  recibosPerPage = 1;
}

console.log('[PDF] recibosPerPage final:', recibosPerPage);
```

---

### **CORRECCIÓN C: Mejorar Logs de HTML Generado** (importante)
**Archivo:** `backend/src/controllers/v1.0/recibosController.js` línea 728

**Cambio:**
```javascript
// ANTES
console.log('[PDF] Generando PDF único con todas las páginas...');

// DESPUÉS
console.log('[PDF] Generando PDF único con todas las páginas...');
console.log('[PDF-HTML] Primeros 3000 caracteres del HTML generado:');
console.log(fullHTML.substring(0, 3000));
console.log('[PDF-HTML] Última página (últimos 2000 caracteres):');
console.log(fullHTML.substring(Math.max(0, fullHTML.length - 2000)));
```

---

### **CORRECCIÓN D: Validar Setter de Modelo** (crítico si getter falla)
**Archivo:** `backend/src/models/ReciboTemplate.js` líneas 90-97

**Cambio actual (revisar si es suficiente):**
```javascript
set(value) {
  // Asegurar que se guarde como JSON string válido, no como objeto
  if (typeof value === 'object' && value !== null) {
    this.setDataValue('bloque_pageconfig', JSON.stringify(value));
  } else {
    this.setDataValue('bloque_pageconfig', value);
  }
}
```

**Si el getter falla, cambiar a:**
```javascript
set(value) {
  // Siempre guardar como JSON string en BD
  if (typeof value === 'object' && value !== null) {
    const stringified = JSON.stringify(value);
    console.log('[ReciboTemplate] Guardando bloque_pageconfig:', stringified.substring(0, 200));
    this.setDataValue('bloque_pageconfig', stringified);
  } else if (typeof value === 'string') {
    // Validar que sea JSON válido
    try {
      JSON.parse(value);
      this.setDataValue('bloque_pageconfig', value);
    } catch (e) {
      throw new Error('bloque_pageconfig debe ser JSON válido: ' + e.message);
    }
  } else {
    throw new Error('bloque_pageconfig debe ser objeto o string JSON');
  }
}
```

---

## Cronograma de Ejecución

| Paso | Tarea | Tiempo | Bloqueante |
|------|-------|--------|-----------|
| 1 | Verificar BD | 15 min | No |
| 2 | Logs en Controller | 10 min | No |
| 3 | Test Modelo | 10 min | No |
| 4 | Verificar HTML | 15 min | No |
| 5 | Rastrear html-pdf | 10 min | No |
| **Subtotal diagnóstico** | | **60 min** | |
| | | | |
| A | Simplificar pageConfig | 20 min | Sí |
| B | Validar recibosPerPage | 10 min | Sí |
| C | Mejorar Logs | 10 min | No |
| D | Validar Setter | 15 min | Depende de PASO 3 |
| **Subtotal correcciones** | | **55 min** | |
| | | | |
| **Verificación Final** | Generar PDF y validar | 15 min | Sí |
| **TOTAL** | | **130 minutos** | |

---

## Matriz de Riesgo

| Escenario | Probabilidad | Impacto | Mitigación |
|-----------|-------------|--------|-----------|
| Getter devuelve string sin parsear | Media | Alto | PASO 2 lo revela |
| BD contiene NULL o valor corrupto | Media | Alto | PASO 1 lo revela |
| html-pdf ignora alturas en divs | Alta | Alto | Requiere refactor (htmlkit, puppeteer) |
| Cambios causan quebr en otros templates | Media | Medio | Revert rápido, tests |

---

## Resultados del Diagnóstico

### PASO 1: Estado de BD
```
[Pendiente: Ejecutar diagnóstico]
```

### PASO 2: Lectura en Controller
```
[Pendiente: Ejecutar diagnóstico]
```

### PASO 3: Modelo Getter
```
[Pendiente: Ejecutar diagnóstico]
```

### PASO 4: HTML Generado
```
[Pendiente: Ejecutar diagnóstico]
```

### PASO 5: html-pdf Respeta Alturas
```
[Pendiente: Ejecutar diagnóstico]
```

---

## Conclusiones Esperadas

**Si todos los valores se leen correctamente pero PDF sigue siendo 1/página:**
→ html-pdf no respeta alturas de divs  
→ Solución: Migrar a htmlkit-pdf o puppeteer (más control sobre rendering)

**Si recibos_por_pagina llega como 1 al controller:**
→ Template no se guardó correctamente en BD  
→ Solución: Validar frontend (formulario de templates) y setter del modelo

**Si pageConfig viene NULL desde BD:**
→ Bloque_pageconfig es NULL o corrupto en BD  
→ Solución: Migración de datos para repoblar correctamente

---

## Referencias

- **Archivo controlador:** `/backend/src/controllers/v1.0/recibosController.js` (líneas 586-751)
- **Archivo helpers:** `/backend/src/utils/pdfHelpers.js`
- **Archivo modelo:** `/backend/src/models/ReciboTemplate.js`
- **Histórico:** BUG-053 (bloques superpuestos), Error 500 templates (márgenes tipo data)

