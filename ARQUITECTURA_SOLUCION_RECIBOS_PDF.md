# Arquitectura de Solución: PDF con Múltiples Recibos por Página

**Estado:** Documento de referencia para el diagnóstico  
**Fecha:** 2026-06-18

---

## Diagrama: Cómo DEBERÍA Funcionar

```
USER: "Generar PDF con 2 recibos por página"
│
├─ Frontend: POST /api/recibos/generar-pdf?periodo=2026-06
│
└─► Backend Controller: generarPDF()
    │
    ├─ 1. LEER TEMPLATE
    │   ├─ BD: SELECT * FROM recibo_templates WHERE activo = true
    │   └─ Obtener: bloque_pageconfig = {
    │       recibos_por_pagina: 2,
    │       gap_vertical_mm: 6,
    │       margen_superior_mm: 10,
    │       margen_inferior_mm: 10,
    │       tamaño: "A4",
    │       orientacion: "portrait"
    │     }
    │
    ├─ 2. CALCULAR DIMENSIONES
    │   ├─ pageHeight = 297 mm (A4)
    │   ├─ verticalMargins = 10 + 10 = 20 mm
    │   ├─ availableHeight = 297 - 20 = 277 mm
    │   ├─ recibosPerPage = 2
    │   ├─ gapVertical = 6 mm
    │   │
    │   ├─ reciboHeight = (277 - (2-1)*6 - 2buffer) / 2
    │   │              = (277 - 6 - 2) / 2
    │   │              = 269 / 2
    │   │              = 134.5 mm  ◄─ CADA RECIBO
    │   │
    │   └─ VALIDAR:
    │       └─ Cada página: 134.5 + 6 + 134.5 = 275 mm ✓ (cabe en 277)
    │
    ├─ 3. OBTENER RECIBOS DE BD
    │   ├─ SELECT * FROM recibos WHERE periodo LIKE '2026-06%'
    │   └─ Resultado: 4 recibos (ejemplo)
    │       [Recibo 1, Recibo 2, Recibo 3, Recibo 4]
    │
    ├─ 4. AGRUPAR POR PÁGINA
    │   ├─ Página 1: [Recibo 1, Recibo 2]
    │   └─ Página 2: [Recibo 3, Recibo 4]
    │
    ├─ 5. GENERAR HTML
    │   └─ Para cada página:
    │       <div class="page" style="page-break-after: always; 
    │                                  padding: 10mm;">
    │         <div style="height: 275mm; page-break-inside: avoid;">
    │           <!-- Recibo 1: 134.5mm -->
    │           <div style="height: 134.5mm; overflow: hidden;">
    │             <table>...</table>
    │           </div>
    │
    │           <!-- Gap: 6mm -->
    │           <div style="height: 6mm;">&nbsp;</div>
    │
    │           <!-- Recibo 2: 134.5mm -->
    │           <div style="height: 134.5mm; overflow: hidden;">
    │             <table>...</table>
    │           </div>
    │         </div>
    │       </div>
    │
    ├─ 6. ENVOLVER EN DOCUMENTO HTML
    │   └─ <!DOCTYPE html>
    │       <html>
    │       <head>
    │         <style>
    │           .page { page-break-after: always; }
    │           .page:last-child { page-break-after: avoid; }
    │         </style>
    │       </head>
    │       <body>
    │         [PÁGINAS AQUÍ]
    │       </body>
    │       </html>
    │
    ├─ 7. CONVERTIR A PDF
    │   ├─ html-pdf.create(htmlCompleto, opciones)
    │   ├─ opciones: { format: 'A4', margin: '10mm' }
    │   └─ Retorna: Buffer PDF
    │
    └─► Cliente: Recibe PDF de 2 páginas
        ├─ Página 1: Recibos 1 y 2 (apilados, 6mm gap)
        └─ Página 2: Recibos 3 y 4 (apilados, 6mm gap)
```

---

## Especificación Técnica: Valores Esperados

### Ejemplo: Template Configurado como 2 Recibos/Página

**Entrada en BD:**
```json
{
  "id": "template-001",
  "nombre": "Recibo Estándar 2-per-page",
  "activo": true,
  "bloque_pageconfig": {
    "tamaño": "A4",
    "orientacion": "portrait",
    "recibos_por_pagina": 2,
    "margen_superior_mm": 10,
    "margen_inferior_mm": 10,
    "margen_izquierdo_mm": 10,
    "margen_derecho_mm": 10,
    "gap_vertical_mm": 6
  },
  "bloques": [
    {
      "type": "tabla",
      "filas": [
        { "altura": 15, "celdas": [...] },
        { "altura": 20, "celdas": [...] }
      ]
    }
  ]
}
```

**Proceso en Controller (líneas 586-751):**

```javascript
// 1. Leer template
const templateDB = await db.ReciboTemplate.findOne({
  where: { activo: true }
});

// 2. Extraer pageConfig
const pageConfig = templateDB.bloque_pageconfig;
// Resultado esperado: { tamaño: 'A4', orientacion: 'portrait', ... }

// 3. Extraer valores
const recibosPerPage = pageConfig.recibos_por_pagina;  // 2
const gapVertical = pageConfig.gap_vertical_mm;        // 6
const marginTop = pageConfig.margen_superior_mm;       // 10
const marginBottom = pageConfig.margen_inferior_mm;    // 10

// 4. Calcular altura
const pageHeight = 297;  // A4 en mm
const availableHeight = pageHeight - marginTop - marginBottom;  // 277
const reciboHeight = (availableHeight - (2-1)*6 - 2) / 2;  // 134.5

// 5. Generar HTML (pseudocódigo)
for (let i = 0; i < recibos.length; i += 2) {
  let pageHTML = `<div class="page">
    <div style="height: ${134.5 + 6 + 134.5}mm; page-break-inside: avoid;">`;
  
  // Recibo i
  pageHTML += `<div style="height: 134.5mm;">...</div>`;
  pageHTML += `<div style="height: 6mm;">&nbsp;</div>`;
  
  // Recibo i+1
  pageHTML += `<div style="height: 134.5mm;">...</div>`;
  
  pageHTML += `</div></div>`;
}

// 6. Generar PDF
const pdfBuffer = await generateMultiPagePDF(htmlCompleto, 'A4', 'portrait', 0);
```

**Salida esperada en logs:**
```
[PDF] pageConfig: {
  tamaño: 'A4',
  orientacion: 'portrait',
  recibos_por_pagina: 2,
  gap_vertical_mm: 6,
  margen_superior_mm: 10,
  margen_inferior_mm: 10,
  margen_izquierdo_mm: 10,
  margen_derecho_mm: 10
}
[PDF] Recibos por página: 2
[PDF] Gap vertical: 6 mm
[PDF] Márgenes: 10 10 10 10
[PDF] Available height: 277 mm
[PDF] Altura de cada recibo: 134.5 mm
[PDF] Total de recibos: 4
[PDF] Agregada página (tabla) 1 con 2 recibos
[PDF] Agregada página (tabla) 2 con 2 recibos
[PDF] PDF generado correctamente
```

---

## Diagrama: Puntos de Fallo (Estado Actual)

```
ESCENARIO 1: recibos_por_pagina no se lee correctamente
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BD: bloque_pageconfig = { recibos_por_pagina: 2, ... }
                         ✓ CORRECTO
                         │
                         ▼
ReciboTemplate.bloque_pageconfig getter
                         │
                         ? ¿Devuelve objeto o string?
                         │
                         ▼
recibosController.js (líneas 586-622)
  const pageConfig = templateDB?.bloque_pageconfig || {};
                         │
                         ? ¿Es NULL? ¿Es string?
                         │
                         ├─ SI es NULL → usa {} (vacío) → recibosPerPage = 1 ❌
                         └─ NO parseado → intenta parsear → resultado incierto ❌
                         │
                         ▼
  const recibosPerPage = pageConfig.recibos_por_pagina || 1;
                         │
                         ├─ SI fue NULL → recibosPerPage = 1 ❌
                         └─ SI parseó bien → recibosPerPage = 2 ✓
                         │
                         ▼
HTML: <div style="height: Xmm"> (X = 270mm si recibosPerPage=1, 134.5mm si =2)
                         │
                         ├─ X=270mm → 1 recibo por página ❌
                         └─ X=134.5mm → 2 recibos por página ✓
                         │
                         ▼
PDF generado


ESCENARIO 2: html-pdf ignora alturas en divs (Limitación librería)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HTML: <div style="height: 134.5mm;">Recibo 1</div>
      <div style="height: 6mm;">&nbsp;</div>
      <div style="height: 134.5mm;">Recibo 2</div>
                         ✓ CORRECTO
                         │
                         ▼
html-pdf: Procesa HTML
                         │
                         ? ¿Respeta <div style="height: Xmm">?
                         │
                         ├─ SÍ → PDF tiene 2 recibos per page ✓
                         └─ NO (BUG html-pdf) → cada recibo toma espacio natural ❌
                         │
                         ▼
PDF: 1 recibo por página ❌
(Incluso si HTML es correcto)
```

---

## Tabla: Síntomas vs Causa

| Síntoma Observado | Posible Causa | Validación |
|---|---|---|
| PDF tiene 1 recibo/página | recibosPerPage=1 en controller | Agregar log en línea 624 |
| PDF tiene 1 recibo/página | recibosPerPage=2 pero HTML mal | Agregar log en línea 728 |
| PDF tiene 1 recibo/página | recibosPerPage=2, HTML correcto | html-pdf no respeta alturas |
| PDF tiene 2 recibos/página (100%) | **SOLUCIÓN CORRECTA** | ✓ Listo |
| PDF tiene bloques superpuestos | Escalafactor incorrecto | BUG-053 (ya fijo) |
| Márgenes PDF ≠ template | generateMultiPagePDF() ignora margins | Revisar línea 732 |

---

## Checklist de Validación

Después del diagnóstico, validar con este checklist:

```
PASO 1: BD
[ ] SELECT bloque_pageconfig FROM recibo_templates WHERE activo = true;
[ ] ¿Contiene "recibos_por_pagina": 2? 
[ ] ¿Formato JSON válido?

PASO 2: Controller Lee Correctamente
[ ] Agregar log de pageConfig en línea 600
[ ] Generar PDF
[ ] ¿Log muestra recibos_por_pagina: 2?
[ ] ¿Log muestra gap_vertical_mm: 6?

PASO 3: Modelo Getter Funciona
[ ] ¿Getter devuelve objeto? (no string)
[ ] ¿Propiedades están presentes?

PASO 4: HTML Generado Correctamente
[ ] Agregar log de HTML en línea 728
[ ] ¿HTML contiene <div style="height: 134.5mm">?
[ ] ¿HTML tiene 2 bloques de 134.5mm por página?
[ ] ¿Hay gap de 6mm entre ellos?

PASO 5: PDF Respeta HTML
[ ] ¿PDF tiene 2 páginas? (4 recibos = 2 por página)
[ ] ¿Cada página tiene 2 recibos?
[ ] ¿Gap vertical es visible entre recibos?
[ ] ¿Márgenes son 10mm?

FIN
[ ] ✓ TODO CORRECTO: Solución implementada
[ ] ❌ HTML correcto pero PDF mal: Migrar librería PDF
```

---

## Fórmula de Cálculo de Altura

**Entrada:**
- `pageHeight` = altura página en mm (297 para A4)
- `marginTop`, `marginBottom` = márgenes superior/inferior
- `recibosPerPage` = cantidad de recibos por página
- `gapVertical` = espaciado vertical entre recibos

**Fórmula:**
```
availableHeight = pageHeight - marginTop - marginBottom
reciboHeight = (availableHeight - (recibosPerPage - 1) * gapVertical - buffer) / recibosPerPage
```

**Ejemplo con 2 recibos/página:**
```
pageHeight = 297 mm
marginTop = 10 mm
marginBottom = 10 mm
recibosPerPage = 2
gapVertical = 6 mm
buffer = 2 mm (seguridad html-pdf)

availableHeight = 297 - 10 - 10 = 277 mm
reciboHeight = (277 - (2 - 1) * 6 - 2) / 2
            = (277 - 6 - 2) / 2
            = 269 / 2
            = 134.5 mm
```

**Validación (sumar y verificar cabe):**
```
totalAltura = reciboHeight * recibosPerPage + gapVertical * (recibosPerPage - 1)
            = 134.5 * 2 + 6 * 1
            = 269 + 6
            = 275 mm

¿275 <= 277? SÍ ✓
```

---

## Valores Aceptables

| Propiedad | Mín | Máx | Unidad | Default |
|---|---|---|---|---|
| `recibos_por_pagina` | 1 | 10 | entero | 1 |
| `gap_vertical_mm` | 0 | 50 | mm | 0 |
| `margen_superior_mm` | 0 | 50 | mm | 10 |
| `margen_inferior_mm` | 0 | 50 | mm | 10 |
| `margen_izquierdo_mm` | 0 | 50 | mm | 10 |
| `margen_derecho_mm` | 0 | 50 | mm | 10 |
| `reciboHeight` (calculado) | 10 | 270 | mm | auto |

---

## Próximos Pasos Después del Diagnóstico

**Si recibos_por_pagina = 1 (incorrecto):**
```
├─ Causa: BD tiene NULL o getter defectuoso
├─ Acción: Ejecutar CORRECCIÓN A (limpiar código)
├─ Validar: Logs muestran recibos_por_pagina = 2
└─ Resultado: PDF genera con 2 recibos/página ✓
```

**Si recibos_por_pagina = 2 pero PDF = 1 recibo/página:**
```
├─ Causa: html-pdf no respeta alturas
├─ Acción: Migrar a htmlkit-pdf o puppeteer
├─ Tiempo: 2-4 horas (refactor + tests)
└─ Ganancia: Control total sobre rendering PDF
```

**Si recibos_por_pagina = 2 y PDF = 2 recibos/página:**
```
├─ Resultado: ✅ ÉXITO
├─ Acción: Registrar causa root en BUGS.md
├─ Validar: gap, márgenes, tamaño
└─ Documentar: Solución en CHANGELOG
```

