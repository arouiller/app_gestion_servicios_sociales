# BUG-052: Generación de PDF — Código HTML/CSS Aparece en Primeras Páginas

## Descripción del Problema

Al generar un PDF de recibos, el código HTML/CSS de la plantilla aparece literalmente impreso en las primeras páginas del PDF, en lugar de ser procesado y renderizado. Solo los recibos finales (página 3 en adelante) se renderizan correctamente.

**Síntomas observados en capturas de pantalla:**
- Página 1: `<style> body { font-family: Arial... } table { width: 100%... } ...</style>`
- Página 2: `<td [... padding... ]> <seccion-izquierda [...]`
- Página 3+: Recibos correctamente renderizados (García, Juan - Recibo "C")

**Severidad:** 🔴 CRÍTICO
- PDFs generados son inutilizables — contienen código fuente
- Funcionalidad de descarga de recibos completamente rota
- Bloquea caso de uso: usuarios no pueden obtener recibos en PDF

**Reportado:** 2026-05-21

---

## Análisis Técnico

### Arquitectura Actual de Generación de PDF

**Flujo:**
1. `GET /api/recibos/generar-pdf?periodo=YYYY-MM` (recibosController.js:541)
2. Obtiene recibos de BD con `sequelize.query()`
3. Obtiene template de `ReciboTemplate` o usa `getDefaultTemplateString()` (pdfHelpers.js)
4. Parsea template con `parseTemplate()` (divide config y contenido HTML)
5. Crea documento PDFKit: `createConfiguredPDFDoc(config)`
6. Para cada recibo:
   - Renderiza con `renderRecibo()` (reemplaza placeholders)
   - Convierte HTML a PDF con `renderHTMLtoPDF()`
7. Devuelve como `application/pdf`

### Root Cause (Causa Raíz)

**Ubicación:** `recibosController.js` línea 785-806 (función `renderHTMLtoPDF`)

El problema está en cómo se parsea y procesa el HTML:

```javascript
// Línea 809: parseHTMLSimple(html)
const elements = parseHTMLSimple(html);

elements.forEach((element) => {
  if (element.type === 'table') {
    // Procesar tabla
  } else if (element.type === 'text') {
    // ❌ PROBLEMA: Imprime todo como texto plano, incluyendo <style>
  }
});
```

**Análisis detallado:**

1. **El template usa divs + CSS, no tablas:**
   - Template en `pdfHelpers.js` línea 354-466 usa: `<div class="recibo-container">`, `<div class="header">`, etc.
   - Tiene bloque `<style>` completo (líneas 92-352)
   - Usa flexbox y CSS modern para layout

2. **parseHTMLSimple solo busca tablas:**
   - Regex en línea 813: `/<table[^>]*>([\s\S]*?)<\/table>/gi`
   - Si no encuentra `<table>`, trata TODO como "text"
   - Línea 859: `elements.push({ type: 'text', content: textAfter })`
   - El contenido incluye TODO el HTML sin procesar: `<style>`, `<div>`, etc.

3. **Cuando se renderiza como text:**
   - Línea 798-801: `doc.text(element.content, ...)`
   - PDFKit interpreta `.text()` como texto plano, no HTML
   - Resultado: Imprime literalmente `<style>body{...}</style><div class="recibo-container">`

4. **stripHTML es insuficiente:**
   - Línea 961: `return html.replace(/<[^>]*>/g, '').trim();`
   - Solo se usa en celdas de tabla (línea 839)
   - NO se aplica al contenido general antes de detectar tipo de elemento

### Por Qué Solo Primeras Páginas

- La concatenación de múltiples recibos genera HTML largo
- `parseHTMLSimple` procesa el HTML completo como un bloque de "text"
- Las primeras páginas contienen este bloque "text" gigante
- A partir de cierto punto, el contenido se renderiza en nuevas páginas
- Esto es un artefacto del paginado de PDFKit, no una solución

---

## Soluciones Evaluadas

### Opción 1: Parsear HTML Mejor (No Viable)
**Mejorar `parseHTMLSimple` para soportar divs con CSS**
- Requeriría reescribir parser HTML completo
- Sería frágil y mantenible solo para este template
- No escalaría si templates cambian
- **Descartada: Demasiada complejidad, ROI bajo**

### Opción 2: Usar Librería HTML-to-PDF (Recomendada ✅)
**Reemplazar parseHTMLSimple + renderHTMLtoPDF con librería real**

Opciones disponibles:
- **Puppeteer**: Renderiza HTML via Chromium (pesado, pero perfecto)
- **html2pdf**: Librería lightweight para HTML → PDF (buena opción)
- **htmltopdf**: Wrapper de wkhtmltopdf (requiere sistema)

**Ventajas:**
- Soporta CSS completo, flexbox, grid, media queries
- Maneja placeholders HTML como texto
- Rendeorización idéntica a browser
- Escalable para templates futuros

**Desventajas:**
- Requiere dependencia nueva (`html2pdf` o `puppeteer`)
- Slight overhead de performance vs parser manual
- Puppeteer requiere recursos más altos

**Recomendación:** `html2pdf` (ligero, suficiente para nuestro caso)

---

## Solución Propuesta (Opción 2)

### Paso 1: Instalar Dependencia

```bash
npm install html2pdf.js --save
```

Alternativa más ligera:
```bash
npm install node-html-pdf --save
# O si la anterior no funciona bien:
npm install phantom --save  # Para wkhtmltopdf wrapper
```

### Paso 2: Refactorizar recibosController.js

**Cambio en función `generarPDF` (línea 541-639):**

Reemplazar la sección de renderizado (línea 595-629) con:

```javascript
// En lugar de:
// const pares = groupRecibosInPairs(recibos);
// pares.forEach((par) => { ... renderHTMLtoPDF(...) })

// Cambiar a:

// Construir HTML completo para todos los recibos
let fullHTML = '';
recibos.forEach((recibo, idx) => {
  const reciboHTML = renderRecibo(recibo, content);
  fullHTML += reciboHTML;
  
  // Agregar salto de página entre recibos (en pares)
  if ((idx + 1) % 2 === 0 && idx < recibos.length - 1) {
    fullHTML += '<div style="page-break-after: always;"></div>';
  }
});

// Agregar estilos del template al HTML
const htmlConEstilos = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    ${extractStylesFromTemplate(content)}
  </style>
</head>
<body>
  ${fullHTML}
</body>
</html>
`;

// Generar PDF con html2pdf
const pdf = require('html2pdf');
const options = {
  margin: config.margins / 72, // Convertir puntos a pulgadas
  filename: `recibos_${periodo}.pdf`,
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: { scale: 2 },
  jsPDF: {
    orientation: config.orientation,
    unit: 'in',
    format: config.pageSize.toUpperCase(),
  },
};

// Piped output directo a response
await pdf.default(htmlConEstilos, options).then((pdf) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="recibos_${periodo}.pdf"`);
  res.send(pdf.output('arraybuffer'));
});
```

### Paso 3: Agregar Helpers

**Nueva función para extraer CSS del template:**

```javascript
function extractStylesFromTemplate(templateContent) {
  const styleMatch = templateContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  return styleMatch ? styleMatch[1] : '';
}
```

### Paso 4: Eliminar Código Antiguo

Remover funciones ahora innecesarias:
- `parseHTMLSimple()` (línea 809-864)
- `renderTable()` (línea 867-919)
- `calculateColumnWidths()` (línea 922-951)
- `renderParagraph()` (línea 954-958)
- `renderHTMLtoPDF()` (línea 785-806)
- `createConfiguredPDFDoc()` (línea 744-782) — reemplazado por jsPDF
- `stripHTML()` (línea 961-963)

**Beneficio:** Reducir ~200 líneas de código frágil de parsing manual

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `backend/src/controllers/v1.0/recibosController.js` | Refactorizar `generarPDF()`, agregar `extractStylesFromTemplate()`, remover helpers de parseo |
| `backend/package.json` | Agregar `html2pdf` o librería elegida |

---

## Verificación de la Solución

**Antes (problema actual):**
1. Generar PDF de recibos para período
2. Descargar PDF
3. Abrir en navegador/visor
4. **Resultado:** Primeras páginas contienen código HTML/CSS literal

**Después (post-fix):**
1. Generar PDF de recibos para período
2. Descargar PDF
3. Abrir en navegador/visor
4. **Resultado:** 
   - ✅ Recibos correctamente renderizados
   - ✅ CSS aplicado (colores, borders, layouts)
   - ✅ Sin código fuente visible
   - ✅ 2 recibos por página (layout 2-per-page funcional)

**Test cases:**
- [ ] Generar PDF con 1 recibo → 1 página correcta
- [ ] Generar PDF con 2 recibos → 1 página con 2 recibos (layout 2-per-page)
- [ ] Generar PDF con 5 recibos → 3 páginas (2+2+1), separadores correctos
- [ ] Validar CSS renderizado: bordes, colores, fuentes
- [ ] Placeholders reemplazados correctamente (montos, nombres, etc.)
- [ ] Arancel negativo muestra color de advertencia (si aplica)

---

## Alternativas Consideradas

### Alternativa A: Usar Puppeteer
```javascript
const puppeteer = require('puppeteer');
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setContent(htmlConEstilos);
const pdf = await page.pdf({ format: config.pageSize });
```
**Pros:** Perfect rendering, CSS support  
**Cons:** Requiere Chromium en el servidor, overhead mayor  
**Decisión:** Descartar para Hostinger shared hosting (no hay recursos)

### Alternativa B: Cambiar Template a Usar Tablas
```html
<table>
  <tr><td>...</td></tr>
  ...
</table>
```
**Pros:** Funcion con parser actual  
**Cons:** Diseño menos flexible, mantenibilidad peor  
**Decisión:** Descartar - compromete UX del template

---

## Impacto y Dependencias

**Impacto:**
- ✅ Bloquea BUG-052 (recibos PDF inutilizables)
- ✅ Habilita descarga de recibos funcional
- ✅ Permite escalar templates en el futuro
- ⚠️ Requiere testing en Hostinger (shared hosting tiene límites)

**Dependencias:**
- Nueva librería: `html2pdf` o `node-html-pdf` (verificar compatibilidad Hostinger)
- PDFKit se puede mantener o remover (depende de si se usa en otro lado)

**Rollback:**
- Si html2pdf no es compatible con Hostinger:
  - Revert commit
  - Volver a implementación con tablas simples
  - Redesign template a usar `<table>` en lugar de `<div>`

---

## Timeline Estimado

1. **Investigación + instalación:** 15 min
2. **Refactorización generarPDF():** 30 min
3. **Testing local:** 30 min
4. **Deployment + testing en Hostinger:** 20 min
5. **Buffer para issues:** 15 min

**Total:** ~2 horas

---

## Estado

- **Registrado:** 2026-05-21
- **Análisis:** ✅ Completado
- **Diseño:** ✅ Completado
- **Próximo paso:** Implementación (requiere aprobación del usuario)
