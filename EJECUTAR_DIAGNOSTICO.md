# Instrucciones Paso a Paso: Ejecutar Diagnóstico

**Tiempo Total Estimado:** 60 minutos  
**Riesgo:** Bajo (sin cambios en producción, solo logs)

---

## Pre-requisitos

- ✓ Acceso a BD MySQL (Hostinger o local)
- ✓ Node.js disponible (local o en servidor)
- ✓ Editor de código (VS Code o similar)
- ✓ 1 template configurado con 2 recibos/página
- ✓ Al menos 2 recibos generados para un período

---

## FASE 1: Recopilación de Evidencia (BD)

### 1A. Conectar a BD

**Opción 1: MySQL en línea de comandos**
```bash
mysql -h [HOST] -u [USER] -p[PASSWORD] -D [DATABASE]
```

**Opción 2: phpMyAdmin (Hostinger)**
- Login en cPanel
- Ir a phpMyAdmin
- Seleccionar base de datos

### 1B. Ejecutar Query: Verificar Template

```sql
SELECT 
  id,
  nombre,
  activo,
  bloque_pageconfig,
  CHAR_LENGTH(bloque_pageconfig) as config_size
FROM recibo_templates 
WHERE activo = true
LIMIT 1;
```

**Copiar resultado en:** `/DIAGNOSTICO_EVIDENCIA.txt` (archivo que crearás)

**Qué revisar:**
- ¿Hay un resultado? (si no, no hay template activo)
- ¿`bloque_pageconfig` es NULL?
- ¿`bloque_pageconfig` parece un JSON válido?
- ¿Contiene la palabra `recibos_por_pagina`?

**Ejemplo de output correcto:**
```
id: template-001
nombre: Recibo Estándar 2-per-page
activo: 1
bloque_pageconfig: {"tamaño":"A4","orientacion":"portrait",...,"recibos_por_pagina":2}
config_size: 287
```

### 1C. Analizar JSON de bloque_pageconfig

Si obtuviste un resultado, copiar el contenido de `bloque_pageconfig` y validarlo:

**Usar online JSON validator:**
1. Ir a https://jsonlint.com/
2. Pegar contenido de `bloque_pageconfig`
3. Validar que sea JSON correcto

**Buscar estas claves:**
```
✓ "recibos_por_pagina": [número]  ← Este debe ser 2
✓ "gap_vertical_mm": [número]      ← Este debe ser 6
✓ "margen_superior_mm": [número]   ← Este debe ser 10
✓ "margen_inferior_mm": [número]   ← Este debe ser 10
✓ "margen_izquierdo_mm": [número]  ← Este debe ser 10
✓ "margen_derecho_mm": [número]    ← Este debe ser 10
✓ "tamaño": "A4"
✓ "orientacion": "portrait"
```

---

## FASE 2: Instrumentar Código (Agregar Logs)

### 2A. Abrir archivo: `recibosController.js`

**Ruta:** `backend/src/controllers/v1.0/recibosController.js`

Ir a línea 586 (función `generarPDF`)

### 2B. Agregar LOG de Lectura Inicial (IMPORTANTE)

**Buscar:** La línea que dice:
```javascript
let templateDB = await db.ReciboTemplate.findOne({
  where: { activo: true },
});
```

**Justo después de esa línea, agregar:**
```javascript
// === [DIAGNOSTICO] LOG RAW DE BD ===
console.log('[PDF-DIAG-1] templateDB encontrado:', {
  existe: !!templateDB,
  id: templateDB?.id,
  nombre: templateDB?.nombre,
  activo: templateDB?.activo,
});

console.log('[PDF-DIAG-1] bloque_pageconfig RAW (antes de parsear):', {
  tipo: typeof templateDB?.bloque_pageconfig,
  valor_truncado: String(templateDB?.bloque_pageconfig).substring(0, 200),
  es_null: templateDB?.bloque_pageconfig === null,
  es_undefined: templateDB?.bloque_pageconfig === undefined,
});
// === FIN DIAGNOSTICO 1 ===
```

**Verificar:** El código ahora debe verse así:
```javascript
let templateDB = await db.ReciboTemplate.findOne({
  where: { activo: true },
});

// === [DIAGNOSTICO] LOG RAW DE BD ===
console.log('[PDF-DIAG-1] templateDB encontrado:', {...});
...
// === FIN DIAGNOSTICO 1 ===

// Obtener recibos_por_pagina desde bloque_pageconfig
let pageConfig = templateDB?.bloque_pageconfig || {};
```

### 2C. Agregar LOG después de Procesar pageConfig

**Buscar:** Línea ~622 (después de la lógica de lectura compleja)

**Encontrarás algo como:**
```javascript
if (bloquePageConfig && Object.keys(bloquePageConfig).length > 0) {
  pageConfig.gap_vertical_mm = bloquePageConfig.gap_vertical_mm;
  pageConfig.recibos_por_pagina = bloquePageConfig.recibos_por_pagina;
  // ... más asignaciones
}
```

**Justo después de ese `if`, agregar:**
```javascript

// === [DIAGNOSTICO] LOG pageConfig PROCESADO ===
console.log('[PDF-DIAG-2] pageConfig después de procesamiento:', {
  recibos_por_pagina: pageConfig.recibos_por_pagina,
  gap_vertical_mm: pageConfig.gap_vertical_mm,
  margen_superior_mm: pageConfig.margen_superior_mm,
  margen_inferior_mm: pageConfig.margen_inferior_mm,
  margen_izquierdo_mm: pageConfig.margen_izquierdo_mm,
  margen_derecho_mm: pageConfig.margen_derecho_mm,
  tamaño: pageConfig.tamaño,
  orientacion: pageConfig.orientacion,
  keys_presentes: Object.keys(pageConfig),
});
// === FIN DIAGNOSTICO 2 ===
```

### 2D. Agregar LOG de Cálculo de Altura

**Buscar:** Línea ~643 (después de calcular `reciboHeight`)

**Encontrarás:**
```javascript
const reciboHeight = (availableHeight - (recibosPerPage - 1) * gapVertical - buffer) / recibosPerPage;
```

**Justo después, agregar:**
```javascript

// === [DIAGNOSTICO] LOG CÁLCULO ALTURA ===
console.log('[PDF-DIAG-3] Cálculo de altura:', {
  recibosPerPage,
  gapVertical,
  marginTop,
  marginBottom,
  pageHeight: 297,
  availableHeight,
  buffer,
  reciboHeight,
  formula: `(${availableHeight} - (${recibosPerPage}-1)*${gapVertical} - ${buffer}) / ${recibosPerPage}`,
});
// === FIN DIAGNOSTICO 3 ===
```

### 2E. Agregar LOG del HTML Generado

**Buscar:** Línea ~728 (antes de llamar a `generateMultiPagePDF`)

**Encontrarás:**
```javascript
console.log('[PDF] Generando PDF único con todas las páginas...');

// Generar PDF único con todas las páginas
try {
  const pdfBuffer = await generateMultiPagePDF(fullHTML, ...);
```

**Justo antes de `generateMultiPagePDF`, agregar:**
```javascript

// === [DIAGNOSTICO] LOG HTML ===
const htmlLines = fullHTML.split('\n');
console.log('[PDF-DIAG-4] HTML generado (primeras 100 líneas):');
console.log(htmlLines.slice(0, 100).join('\n'));
console.log('[PDF-DIAG-4] HTML generado (últimas 50 líneas):');
console.log(htmlLines.slice(-50).join('\n'));
console.log('[PDF-DIAG-4] Total de líneas HTML:', htmlLines.length);
console.log('[PDF-DIAG-4] Total de bytes HTML:', fullHTML.length);
// === FIN DIAGNOSTICO 4 ===
```

---

## FASE 3: Generar PDF con Logs

### 3A. Iniciar Servidor Backend

```bash
cd backend
npm run dev
```

**Esperar hasta ver:** `Server running on http://localhost:5000`

### 3B. Generar PDF (Frontend o Curl)

**Opción 1: Desde Frontend**
- Navegar a "Gestión de Recibos" → "Generar PDF"
- Seleccionar período con recibos
- Hacer click en "Descargar PDF"

**Opción 2: Desde Curl**
```bash
curl "http://localhost:5000/api/recibos/generar-pdf?periodo=2026-06" \
  -H "Authorization: Bearer [TU_JWT_TOKEN]" \
  -o recibos.pdf
```

### 3C. Capturar Logs

**Los logs aparecerán en terminal donde corre `npm run dev`**

**Buscar líneas que empiezan con:**
- `[PDF-DIAG-1]`
- `[PDF-DIAG-2]`
- `[PDF-DIAG-3]`
- `[PDF-DIAG-4]`

**Copiar TODO el output y pegarlo en:** `/DIAGNOSTICO_EVIDENCIA.txt`

---

## FASE 4: Analizar Evidencia

### 4A. Crear archivo de Evidencia

**Crear archivo:** `DIAGNOSTICO_EVIDENCIA.txt` en raíz del proyecto

**Estructura:**
```
===== FASE 1: CONSULTA BD =====
[Pega el resultado de la query aquí]

===== FASE 2: JSON VALIDADO =====
[Copia aquí el bloque_pageconfig parseado y validado]

===== FASE 3: LOGS DEL CONTROLLER =====
[Copia aquí todos los logs [PDF-DIAG-*]]

===== ANÁLISIS =====
[Rellena el template de análisis abajo]
```

### 4B. Template de Análisis

**Copiar este template en DIAGNOSTICO_EVIDENCIA.txt y completar:**

```
HALLAZGO 1: ¿BD tiene bloque_pageconfig?
[ ] SÍ: Contiene { recibos_por_pagina: 2, ... }
[ ] NO: NULL o campo vacío
[ ] INCIERTO: Parace corrupto

HALLAZGO 2: ¿Controller loga pageConfig.recibos_por_pagina = 2?
[ ] SÍ: Log [PDF-DIAG-2] muestra "recibos_por_pagina": 2
[ ] NO: Log muestra "recibos_por_pagina": 1 o undefined
[ ] NO HAY LOG: No se ejecutó [PDF-DIAG-2]

HALLAZGO 3: ¿reciboHeight se calcula correctamente?
[ ] SÍ: [PDF-DIAG-3] muestra reciboHeight ≈ 134.5 mm
[ ] NO: reciboHeight ≈ 270 mm (solo 1 recibo)
[ ] INCIERTO: Valor raro

HALLAZGO 4: ¿HTML tiene divs con height correcta?
[ ] SÍ: Hay divs con style="height: 134.5mm"
[ ] NO: Solo hay divs con style="height: 270mm"
[ ] INCIERTO: HTML truncado o ilegible

CONCLUSIÓN PRELIMINAR:
[ ] Causa 1: recibos_por_pagina no se lee (BD o getter)
[ ] Causa 2: HTML se genera mal (cálculo incorrecto)
[ ] Causa 3: html-pdf ignora alturas (librería limitación)
[ ] Desconocida: Necesita análisis más profundo
```

### 4C. Interpretar Resultados

**Escenario A: HALLAZGO 2 = NO**
```
Síntoma: recibos_por_pagina llega como 1 o undefined al controller
Causa probable: BD NULL o getter defectuoso
Acción: CORRECCIÓN A (líneas 586-622)
Tiempo: 5 minutos
```

**Escenario B: HALLAZGO 3 = NO**
```
Síntoma: reciboHeight ≈ 270 mm (no 134.5)
Causa probable: recibosPerPage está en 1, aunque se leyó correctamente
Causa raíz: Código de lectura redundante sobrescribe el valor
Acción: CORRECCIÓN A (limpiar código)
Tiempo: 5 minutos
```

**Escenario C: HALLAZGO 4 = NO**
```
Síntoma: HTML tiene divs de 270 mm en lugar de 134.5 mm
Causa probable: reciboHeight calculado como 270
Acción: Revisar HALLAZGO 3
Tiempo: Depende de hallazgo anterior
```

**Escenario D: HALLAZGO 4 = SÍ (pero PDF sigue siendo 1/página)**
```
Síntoma: HTML correcto pero PDF mal
Causa probable: html-pdf no respeta alturas en <div>
Acción: MIGRACIÓN DE LIBRERÍA PDF
Tiempo: 2-4 horas
```

---

## FASE 5: Aplicar Correcciones Rápidas

### 5A. CORRECCIÓN A: Simplificar Lectura de pageConfig

**Archivo:** `backend/src/controllers/v1.0/recibosController.js`

**Buscar líneas 586-622 (función generarPDF)**

**REEMPLAZAR TODO ESTE BLOQUE:**
```javascript
// Obtener template activo de la BD o usar template por defecto
let templateDB = await db.ReciboTemplate.findOne({
  where: { activo: true },
});

// Obtener recibos_por_pagina desde bloque_pageconfig
let pageConfig = templateDB?.bloque_pageconfig || {};
if (typeof pageConfig === 'string') {
  try {
    pageConfig = JSON.parse(pageConfig);
  } catch (e) {
    pageConfig = {};
  }
}
// Sobrescribir pageConfig con valores de templateDB.bloque_pageconfig si existen
let bloquePageConfig = templateDB.bloque_pageconfig || {};

// Si es string, parsear como JSON
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
  pageConfig.margen_superior_mm = bloquePageConfig.margen_superior_mm;
  pageConfig.margen_inferior_mm = bloquePageConfig.margen_inferior_mm;
  pageConfig.margen_izquierdo_mm = bloquePageConfig.margen_izquierdo_mm;
  pageConfig.margen_derecho_mm = bloquePageConfig.margen_derecho_mm;
  pageConfig.tamaño = bloquePageConfig.tamaño;
  pageConfig.orientacion = bloquePageConfig.orientacion;
}
```

**POR ESTE CÓDIGO SIMPLIFICADO:**
```javascript
// Obtener template activo de la BD o usar template por defecto
let templateDB = await db.ReciboTemplate.findOne({
  where: { activo: true },
});

// Leer pageConfig (el getter del modelo ya lo parsea)
const pageConfig = templateDB?.bloque_pageconfig || {};

// Validar que es objeto válido
if (!pageConfig || typeof pageConfig !== 'object' || Object.keys(pageConfig).length === 0) {
  console.warn('[PDF] Template sin pageConfig válido, usando defaults');
  Object.assign(pageConfig, {
    tamaño: 'A4',
    orientacion: 'portrait',
    recibos_por_pagina: 1,
    margen_superior_mm: 10,
    margen_inferior_mm: 10,
    margen_izquierdo_mm: 10,
    margen_derecho_mm: 10,
    gap_vertical_mm: 0,
  });
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

### 5B. CORRECCIÓN B: Validar recibosPerPage

**Buscar:** Línea 624
```javascript
const recibosPerPage = pageConfig.recibos_por_pagina || 1;
```

**REEMPLAZAR POR:**
```javascript
let recibosPerPage = pageConfig.recibos_por_pagina || 1;

// Validar que es número entero válido
if (!Number.isInteger(recibosPerPage) || recibosPerPage < 1 || recibosPerPage > 10) {
  console.warn(`[PDF] recibos_por_pagina inválido (${recibosPerPage}), usando 1`);
  recibosPerPage = 1;
}

console.log('[PDF] recibosPerPage validado:', recibosPerPage);
```

### 5C. Guardar y Probar

1. Guardar el archivo
2. Backend debe recargarse automáticamente (nodemon)
3. Generar PDF nuevamente
4. Revisar logs

---

## FASE 6: Validar Solución

### 6A. Expectativas Después de Correcciones

**Si el PDF ahora tiene 2 recibos/página:**
```
✅ ÉXITO
├─ Logs muestran recibos_por_pagina: 2
├─ reciboHeight ≈ 134.5 mm
├─ HTML tiene divs correctamente dimensionados
└─ PDF respeta el HTML
```

**Si el PDF SIGUE siendo 1 recibo/página:**
```
⚠️ Problema persiste
├─ Posibilidad 1: Cambios no guardaron bien
│  └─ Acción: Guardar archivo nuevamente, reiniciar server
│
├─ Posibilidad 2: html-pdf ignora alturas
│  └─ Acción: MIGRACIÓN A LIBRERÍA MODERNA
│
└─ Posibilidad 3: Otro punto de ruptura desconocido
   └─ Acción: Revisar logs [PDF-DIAG-4] en detalle
```

### 6B. Procedimiento de Validación Completa

```bash
# 1. Revisar logs en servidor
# (Debe ver [PDF-DIAG-*] logs)

# 2. Descargar PDF generado
# (Abrir en Adobe Reader o navegador)

# 3. Verificar:
# ✓ ¿Página 1 tiene 2 recibos?
# ✓ ¿Gap visible entre ellos?
# ✓ ¿Márgenes 10mm?
# ✓ ¿Página 2 también tiene 2 recibos?

# 4. Si TODO está bien:
# → Registrar causa en BUGS.md
# → Hacer commit
# → Cerrar diagnóstico
```

---

## Rollback (si algo se daña)

Si algo sale mal, descartar cambios:

```bash
cd backend
git checkout src/controllers/v1.0/recibosController.js
npm run dev
```

---

## Archivo Resultados Finales

**Crear:** `DIAGNOSTICO_RESULTADOS.md`

**Estructura:**
```markdown
# Resultados del Diagnóstico de PDF

**Fecha:** [HOY]
**Duración:** [MINUTOS]

## Causa Raíz Identificada

[Describe qué era el problema]

## Solución Aplicada

[Describe qué se corrigió]

## Evidencia

### Logs Relevantes
[Copia logs clave]

### PDF Generado
[Describe si funciona o no]

## Recomendaciones

[Qué hacer después]
```

---

## Contacto si Estancas

Si en algún punto se estanca:

1. Revisar `/DIAGNOSTICO_EVIDENCIA.txt` (¿Hay logs?)
2. Revisar `/PLAN_DIAGNOSTICO_RECIBOS_PDF.md` (¿Coincide síntoma?)
3. Revisar `/ARQUITECTURA_SOLUCION_RECIBOS_PDF.md` (¿Entiendes la arquitectura?)

