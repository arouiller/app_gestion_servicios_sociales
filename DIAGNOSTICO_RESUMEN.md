# Resumen Ejecutivo: Diagnóstico Recibos PDF

## El Problema en una Oración
El PDF se genera con 1 recibo/página en lugar de 2, posiblemente porque `recibos_por_pagina` no se lee o se lee como 1 desde el template.

---

## Cadena de Datos: Dónde Puede Fallar

```
┌─────────────────────────────────────────────────────────────┐
│ BD: recibo_templates.bloque_pageconfig                      │
│ (Debe contener: {recibos_por_pagina: 2, gap_vertical_mm: 6})│
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   PUNTO DÉBIL #1:    │ ◄─ Getter corrupto o retorna string
        │  ReciboTemplate.js   │
        │   (líneas 71-89)     │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────────────────────┐
        │   PUNTO DÉBIL #2:                    │ ◄─ Código confuso, 2 lecturas
        │   recibosController.js               │
        │   (líneas 586-622)                   │
        │   - pageConfig = bloque_pageconfig   │
        │   - intenta parsear SIN LOGS         │
        │   - potencial valor por defecto (1)  │
        └──────────┬──────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────┐
        │   PUNTO DÉBIL #3:                    │ ◄─ Fórmula asume recibosPerPage
        │   recibosController.js               │    correcto
        │   (línea 643)                        │
        │   reciboHeight = (avail -            │
        │    gap*(recibosPerPage-1)) /         │
        │    recibosPerPage                    │
        └──────────┬──────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────┐
        │   PUNTO DÉBIL #4:                    │ ◄─ html-pdf ignora alturas
        │   pdfHelpers.js                      │    en divs (limitación lib)
        │   generateMultiPagePDF()             │
        │   → Retorna PDF 1 recibo/página      │
        └──────────────────────────────────────┘
```

---

## Diagnóstico: 5 Pasos Simples

### 1️⃣ **¿BD tiene datos?**
Conectar a MySQL y ejecutar:
```sql
SELECT bloque_pageconfig FROM recibo_templates WHERE activo = true;
```
**Qué buscar:** ¿Contiene `"recibos_por_pagina": 2`?

### 2️⃣ **¿Controller los lee?**
Agregar estos logs en línea 600 de `recibosController.js`:
```javascript
console.log('[PDF-DEBUG] pageConfig leído:', pageConfig);
console.log('[PDF-DEBUG] recibos_por_pagina:', pageConfig.recibos_por_pagina);
```
Generar PDF y revisar logs.

### 3️⃣ **¿Getter del modelo funciona?**
El getter de `bloque_pageconfig` intenta auto-reparar datos corruptos. Revisar si devuelve objeto o string.

### 4️⃣ **¿HTML tiene alturas correctas?**
Agregar log en línea 728 de `recibosController.js`:
```javascript
console.log('[PDF-DEBUG] HTML generado:', fullHTML.substring(0, 2000));
```
Buscar: `<div style="height: 65mm; ...>` (si hay 2 recibos/página).

### 5️⃣ **¿html-pdf respeta alturas?**
html-pdf es una librería antigua que tiene limitaciones. Puede ignorar `<div style="height: Xmm">`.

---

## Causas Probables (por orden de probabilidad)

| # | Causa | Síntoma | Probabilidad |
|---|-------|---------|--------------|
| **1** | `recibos_por_pagina` llega como `undefined` o `1` al controller | Controller loga `recibos_por_pagina: 1` | **40%** |
| **2** | BD contiene NULL o JSON inválido en `bloque_pageconfig` | SELECT devuelve NULL o string roto | **25%** |
| **3** | html-pdf ignora alturas en `<div>` (limitación librería) | HTML tiene alturas correctas pero PDF ignora | **25%** |
| **4** | Getter del modelo devuelve string en lugar de objeto | Controller recibe string y lo parsea mal | **10%** |

---

## Correcciones Rápidas (sin Breaking Changes)

### Corrección A: Limpiar lectura de pageConfig
**Archivo:** `recibosController.js` líneas 586-622  
**Cambio:** Eliminar la lectura confusa, dejar UNA sola  
**Riesgo:** Bajo (refactoring puro)  
**Tiempo:** 5 min

### Corrección B: Agregar validación
**Archivo:** `recibosController.js` línea 624  
**Cambio:** Validar que `recibosPerPage` es número > 0  
**Riesgo:** Muy bajo  
**Tiempo:** 5 min

### Corrección C: Logs de auditoría
**Archivo:** `recibosController.js` líneas 600, 728  
**Cambio:** Agregar logs detallados  
**Riesgo:** Ninguno (solo logs)  
**Tiempo:** 10 min

---

## Si Falla Todo Esto...

Si después de estos pasos:
- BD tiene datos correctos ✓
- Controller los lee correctamente ✓
- HTML tiene alturas correctas ✓
- **Pero PDF sigue siendo 1 recibo/página** ❌

→ **Causa:** html-pdf no respeta alturas en `<div>`  
→ **Solución:** Migrar a librería moderna:
- **htmlkit-pdf** (drop-in replacement, más robusto)
- **puppeteer** (control total sobre rendering, más pesado)

---

## Tabla de Decisión Rápida

```
¿PDF sigue mal después de diagnóstico?
│
├─ ¿BD tiene recibos_por_pagina = 2?
│  ├─ NO → Llenar BD correctamente [BACKLOG-XXX]
│  └─ SÍ ↓
│
├─ ¿Controller loga recibos_por_pagina = 2?
│  ├─ NO → Bug en getter del modelo [FIX-MODELO]
│  └─ SÍ ↓
│
├─ ¿HTML tiene divs con height = 65mm (dos recibos)?
│  ├─ NO → Bug en cálculo de reciboHeight [FIX-CALCULO]
│  └─ SÍ ↓
│
└─ → html-pdf ignora alturas → Migrar librería [EPIC-PDF-LIBS]
```

---

## Archivos a Monitorear

Durante el diagnóstico, estos son los archivos clave:

```
backend/src/
├── controllers/v1.0/recibosController.js  ◄─ Líneas 586-751 (generarPDF)
├── models/ReciboTemplate.js              ◄─ Líneas 71-97 (getter)
├── utils/pdfHelpers.js                   ◄─ Líneas 352-398 (generateMultiPagePDF)
└── models/index.js                       ◄─ Asegura ReciboTemplate cargado
```

---

## Próximos Pasos

**Después de este diagnóstico:**

1. ✅ Ejecutar 5 pasos de diagnóstico
2. ✅ Identificar punto de ruptura exacto
3. ✅ Aplicar correcciones A/B/C (10 minutos)
4. ✅ Validar PDF genera correctamente
5. ⚠️ Si aún falla: evaluar migración de librería PDF

---

## References

- **PLAN_DIAGNOSTICO_RECIBOS_PDF.md** - Plan detallado con código
- **BUG-053** - Bug previo: bloques superpuestos (coordinadas incorrectas)
- **Error 500 templates** - Bug previo: márgenes como INT vs JSON

