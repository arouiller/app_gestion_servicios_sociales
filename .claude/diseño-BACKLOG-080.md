# BACKLOG-080: Impresión de Recibos con Desglose y Múltiples por Página

**Fecha**: 2026-05-20  
**Requerimiento**: Mejorar template de PDF de recibos para incluir desglose de cuotas y soporte de 2 recibos por página  
**Estado**: Análisis y Diseño

---

## Descripción Ejecutiva

Expandir la funcionalidad de generación de PDF de recibos (BACKLOG-065 / especificación existente) para:
1. **Incluir desglose de cuotas** en cada recibo: cuota_social, arancel_por_servicio, valor_total_cuota
2. **Optimizar layout**: soportar hasta 2 recibos diferentes (no duplicados) por página física
3. **Mejorar presentación**: campos del desglose con alineación y formato visual consistente con ReciboDetalleModal del frontend

---

## Análisis del Estado Actual

### Especificación Existente (BACKLOG-065)

Existe documento de diseño: `docs/superpowers/specs/2026-05-09-impresion-recibos-pdf-design.md`

**Implementación actual prevista**:
- Template HTML almacenado en tabla `recibo_templates`
- Placeholders: `{{numero_recibo}}`, `{{numero_afiliado}}`, `{{titular_nombre}}`, `{{obra_social_nombre}}`, `{{valor_cuota}}`, etc.
- Pdfkit como motor de generación
- Endpoint: `POST /api/recibos/generar-pdf?periodo=YYYY-MM`
- Frontend: botón "Imprimir" en GenerarRecibosModal paso 4

**Limitaciones actuales**:
- Template por defecto no incluye desglose (cuota_social, arancel_por_servicio)
- Layout asume 1 recibo por página (no optimiza espacio)
- Placeholders no contemplan campos de desglose

### Datos Disponibles (BACKLOG-079)

A partir de BACKLOG-079 (implementado), cada recibo en BD contiene:
- `cuota_social`: DECIMAL(10,2) — valor de cuota social al momento de generación
- `arancel_por_servicio`: DECIMAL(10,2) — diferencia entre valor_cuota y cuota_social
- `valor_cuota`: DECIMAL(10,2) — valor total (ya existente)

Estos datos están disponibles en endpoint `/api/recibos/generar-pdf` sin cambios.

---

## Requerimientos Funcionales (RF)

### RF-1: Campos de Desglose en PDF

**Descripción**: Cada recibo en el PDF debe mostrar:
- Cuota Social: valor con 2 decimales, prefijo $
- Arancel por Servicio: valor con 2 decimales, prefijo $, **alerta visual si negativo**
- Valor Total Cuota: resumen, valor con 2 decimales, prefijo $

**Ubicación**: Tabla adicional debajo de datos principales del recibo (similar a ResumenDesglose en frontend)

**Formato visual**:
- Tabla interna de 2 columnas (concepto | monto)
- Fondo gris claro (#f9f9f9) para diferenciar de datos principales
- Borde izquierdo en color primario (consistente con ResumenDesglose.scss)
- Si `arancel_por_servicio < 0`: fondo amarillo (#fff3cd), símbolo ⚠️

### RF-2: Layout de 2 Recibos por Página

**Descripción**: Template debe ser capaz de organizar hasta 2 recibos diferentes (consecutivos, no duplicados) en una página A4 física.

**Criterios**:
- Cada recibo ocupa ~50% del alto disponible
- Ambos separados por línea divisoria (page-break visual sin salto de página real)
- Si número impar de recibos (ej: 5), última página tiene 1 recibo
- Impresión optimiza papel: menor desperdicio que 1 recibo/página

**Datos de layout**:
- Margenes: 20px arriba/abajo/izquierda/derecha
- Alto disponible en A4: ~250mm - 40mm margenes = ~210mm
- Altura por recibo: ~100mm
- Separador: 10mm de espacio vertical + línea

### RF-3: Placeholders Adicionales

Extender lista de placeholders en template para soportar:
- `{{cuota_social}}` — Cuota social formateada ($X.XX)
- `{{arancel_por_servicio}}` — Arancel por servicio formateada ($X.XX)
- `{{valor_cuota}}` — Valor total cuota (ya existente, pero aclarar en contexto de desglose)

---

## Diseño Técnico

### 1. Template HTML Actualizado

**Archivo**: `recibo_templates` tabla en BD o constante en controller

**Cambios**:
- Extender template por defecto para incluir tabla de desglose
- Agregar atributo `data-layout="2-per-page"` o similar a body para CSS
- CSS media queries para optimizar 2 recibos/página en A4

**Estructura de cada recibo**:
```html
<div class="recibo-item">
  <!-- Datos principales existentes -->
  <h3>Recibo {{numero_recibo}}</h3>
  <table class="recibo-principal">
    <tr><td>Afiliado:</td><td>{{numero_afiliado}}</td></tr>
    <tr><td>Titular:</td><td>{{titular_apellido}}, {{titular_nombre}}</td></tr>
    <tr><td>Obra Social:</td><td>{{obra_social_nombre}}</td></tr>
    <tr><td>Tipo Plan:</td><td>{{tipo_plan_nombre}}</td></tr>
  </table>

  <!-- NUEVO: Tabla de desglose -->
  <table class="recibo-desglose">
    <tr>
      <td class="desglose-label">Cuota Social</td>
      <td class="desglose-value">${{cuota_social}}</td>
    </tr>
    <tr class="desglose-arancel {{arancel_negativo_class}}">
      <td class="desglose-label">Arancel por Servicio</td>
      <td class="desglose-value">${{arancel_por_servicio}}{{arancel_warning_icon}}</td>
    </tr>
    <tr class="desglose-total">
      <td class="desglose-label"><strong>Valor Total Cuota</strong></td>
      <td class="desglose-value"><strong>${{valor_cuota}}</strong></td>
    </tr>
  </table>
</div>
```

**CSS para desglose**:
```css
.recibo-desglose {
  width: 100%;
  margin-top: 15px;
  padding: 12px;
  background: #f9f9f9;
  border-left: 4px solid #2c3e50;
  border-collapse: collapse;
  font-size: 12px;
}

.recibo-desglose tr {
  border-bottom: 1px solid #e0e0e0;
}

.recibo-desglose td {
  padding: 8px 10px;
}

.desglose-label {
  text-align: left;
  font-weight: 500;
  width: 70%;
}

.desglose-value {
  text-align: right;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  color: #27ae60;
}

.desglose-arancel.negativo {
  background: #fff3cd;
  color: #856404;
}

.desglose-arancel.negativo .desglose-value {
  color: #856404;
}

.desglose-total {
  border-top: 2px solid #2c3e50;
  background: #f0f7ff;
}

.desglose-total .desglose-value {
  color: #2c3e50;
  font-size: 13px;
}
```

**CSS para layout 2-per-page**:
```css
body[data-layout="2-per-page"] {
  column-count: 1; /* Mantener 1 columna (no multi-column layout) */
}

.recibo-item {
  page-break-inside: avoid; /* Evitar romper recibo entre páginas */
  height: ~210mm; /* ~100mm recibo + 10mm separador */
  display: block;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #ccc;
}

/* Implementar en pdfkit: concatenar recibos de 2 en 2 con separador interno */
```

**Detalle**: Pdfkit no soporta CSS media queries de forma completa. La lógica de "2 recibos por página" se implementa en backend: concatenar HTML de 2 recibos consecutivos, agregar separador, luego salto de página.

### 2. Cambios en Backend

#### Archivo: `recibosController.js` (método `generarPDF`)

**Lógica actualizada**:
```javascript
async generarPDF(req, res) {
  const { periodo, recibos_ids } = req.query;

  // 1. Validar periodo
  // 2. Obtener recibos (con cuota_social, arancel_por_servicio)
  const recibos = await db.Recibo.findAll({
    where: { /* periodo filter */ },
    attributes: [
      'id', 'numero_recibo', 'numero_afiliado', 'zona_codigo',
      'titular_apellido', 'titular_nombre', 'obra_social_nombre',
      'valor_cuota', 'tipo_plan_nombre', 'cuota_social', 'arancel_por_servicio'
    ]
  });

  // 3. Obtener template (existente)
  const template = await db.ReciboTemplate.findOne({
    where: { activo: true }
  });

  // 4. Procesar recibos en pares para layout 2-per-page
  let htmlPdf = '<html><head><style>/* ... */</style></head><body>';
  
  for (let i = 0; i < recibos.length; i += 2) {
    // Recibo 1
    const recibo1 = recibos[i];
    let recibo1Html = template.html;
    
    // Reemplazar placeholders (existente + NUEVOS)
    recibo1Html = replaceAllPlaceholders(recibo1Html, {
      ...recibo1Data,
      cuota_social: parseFloat(recibo1.cuota_social).toFixed(2),
      arancel_por_servicio: parseFloat(recibo1.arancel_por_servicio).toFixed(2),
      arancel_negativo_class: recibo1.arancel_por_servicio < 0 ? 'negativo' : '',
      arancel_warning_icon: recibo1.arancel_por_servicio < 0 ? '⚠️' : ''
    });
    
    htmlPdf += recibo1Html;

    // Recibo 2 (si existe)
    if (i + 1 < recibos.length) {
      const recibo2 = recibos[i + 1];
      let recibo2Html = template.html;
      // Idem reemplazos
      htmlPdf += '<div class="page-break-internal"></div>';
      htmlPdf += recibo2Html;
      htmlPdf += '<div class="page-break"></div>'; // Salto de página
    } else {
      htmlPdf += '<div class="page-break"></div>';
    }
  }
  
  htmlPdf += '</body></html>';

  // 5. Generar PDF con pdfkit
  // 6. Retornar descarga
}
```

**CSS para separadores**:
```css
.page-break-internal {
  height: 10px;
  border-bottom: 1px dashed #ccc;
  margin: 10px 0;
  page-break-after: avoid;
}

.page-break {
  page-break-after: always;
  margin: 20px 0;
}
```

#### Archivo: `recibosService.js` (frontend)

**Sin cambios**: El servicio `generarPDF()` ya existe y es agnóstico al contenido del template. Solo backend modifica template.

### 3. Cambios en Base de Datos (Migraciones)

**Acción**: La tabla `recibo_templates` se crea en BACKLOG-065 (migración 2.0.28 existente).

**Para BACKLOG-080**:
- Actualizar template por defecto en seed o en migración 2.0.29+
- Insertar nuevo template que incluya desglose

**SQL para actualizar template por defecto** (en nueva migración, ej: 2.0.31):
```sql
-- Actualizar template existente para incluir desglose
UPDATE recibo_templates
SET html = '[HTML COMPLETO CON DESGLOSE]',
    version = 2,
    descripcion = 'Template 2.0.31: incluye desglose de cuotas y layout 2-per-page'
WHERE nombre = 'Recibo Estándar 2026';
```

O crear nuevo template sin eliminar antiguo:
```sql
INSERT INTO recibo_templates (nombre, version, activo, usuario_id, descripcion, html)
VALUES (
  'Recibo Estándar 2026 v2',
  1,
  true,
  1,
  'Template con desglose y 2-per-page',
  '[HTML COMPLETO]'
);

-- Desactivar template anterior
UPDATE recibo_templates
SET activo = false
WHERE nombre = 'Recibo Estándar 2026' AND version = 1;
```

### 4. Cambios en Frontend

**Archivo**: `GenerarRecibosModal.jsx`

**Sin cambios directos**: El botón "Imprimir" ya existe y llamará a `recibosService.generarPDF()` que usa el template del backend. No hay cambios en la lógica del frontend.

**Contexto**: Cambios se limitan a backend (template actualizado, lógica de pares de recibos).

---

## Data Flow

```
1. Usuario en GenerarRecibosModal
2. Recibos generados exitosamente (paso 4)
3. Hace click "Imprimir"
4. Frontend: handleGenerarPDF() → recibosService.generarPDF(periodo, recibos_ids)
5. Backend: POST /api/recibos/generar-pdf
   a. Valida periodo
   b. Obtiene todos los recibos del período (con cuota_social, arancel_por_servicio)
   c. Obtiene template activo (incluye desglose)
   d. Por cada PAREJA de recibos:
      - Reemplaza placeholders (incluye {{cuota_social}}, {{arancel_por_servicio}})
      - Concatena HTML de 2 recibos + separador
      - Agrega page-break
   e. Si recibos impares, último recibo solo en página
   f. Genera PDF con pdfkit
   g. Retorna PDF binary con headers de descarga
6. Frontend: Descarga automática "recibos_YYYY-MM.pdf"
```

---

## Archivos Afectados

### Backend
| Archivo | Cambios |
|---------|---------|
| `recibosController.js` | Método `generarPDF()`: agregar lógica de pares + placeholders desglose |
| `migrations/2.0.31/upgrade.sql` | Actualizar template en `recibo_templates` |
| `migrations/2.0.31/downgrade.sql` | Revertir template (u otro mecanismo de versionado) |

### Frontend
| Archivo | Cambios |
|---------|---------|
| (ninguno directo) | El cambio es en template backend, agnóstico al frontend |

### Database
| Tabla | Cambios |
|-------|---------|
| `recibo_templates` | Actualizar template existente o insertar nuevo (v2) |

---

## Consideraciones de Implementación

### 1. Placeholders Condicionales

En pdfkit, no hay soporte nativo para condicionales en HTML. Solución:
- Backend calcula condición (`arancel_negativo_class`)
- Reemplaza `{{arancel_negativo_class}}` con "negativo" o ""
- HTML: `<tr class="desglose-arancel {{arancel_negativo_class}}">`
- Resultado: `<tr class="desglose-arancel negativo">` (si aplica)

### 2. Formateo de Decimales

`cuota_social` y `arancel_por_servicio` vienen de BD como DECIMAL(10,2). En backend:
```javascript
cuota_social: parseFloat(recibo.cuota_social).toFixed(2)  // "12.50"
arancel_por_servicio: parseFloat(recibo.arancel_por_servicio).toFixed(2)  // "-1.25"
```

### 3. CSS en Pdfkit

Pdfkit tiene limitaciones con CSS:
- ✅ Soporta: estilos inline, colores, bordes, padding, margin, font-weight
- ❌ No soporta: media queries, flexbox, grid, pseudo-elementos
- ✅ Workaround: Usar tabla HTML + estilos inline para layout

### 4. Validación de Campos

Asegurarse de que todos los campos del desglose existan en DB:
- Si `cuota_social` es NULL → mostrar 0.00
- Si `arancel_por_servicio` es NULL → mostrar 0.00

Backend:
```javascript
const cuotaSocial = parseFloat(recibo.cuota_social || 0).toFixed(2);
const arancelPorServicio = parseFloat(recibo.arancel_por_servicio || 0).toFixed(2);
```

### 5. Invariante: Suma de Desglose

Considerar validación en PDF (como se hace en backend al generar):
- `cuota_social + arancel_por_servicio ≈ valor_cuota` (tolerancia 0.01)
- Si no se cumple, agregar nota al recibo: "⚠️ Inconsistencia detectada"

---

## Testing Strategy

### Pruebas Unitarias
- Placeholder replacement: verificar `{{cuota_social}}` → "12.50"
- Detección de arancel negativo: `arancel_por_servicio < 0` → clase "negativo"
- Formateo decimal: valores con 2 decimales

### Pruebas de Integración
- Endpoint `/api/recibos/generar-pdf`:
  - Período válido → PDF generado exitosamente
  - Múltiples recibos (impar) → layout 2-per-page correcto
  - Headers de descarga correctos: `Content-Disposition: attachment; filename="recibos_YYYY-MM.pdf"`

### Pruebas E2E (Manual en navegador)
1. Generar recibos (BACKLOG-079 completado)
2. Click "Imprimir" en GenerarRecibosModal
3. PDF descargas automáticamente
4. Abrir PDF: verificar
   - Todos los recibos están presentes
   - Cada recibo muestra desglose (Cuota Social, Arancel, Total)
   - Arancel negativo: fondo amarillo + ⚠️
   - Layout: máximo 2 recibos por página
   - Último recibo (si impar) ocupa solo media página

---

## Dependencias Externas

**Backend**:
- `pdfkit` (ya requerido para BACKLOG-065)
- Sin nuevas dependencias

**Frontend**:
- Sin cambios

---

## Timeline y Secuencia

1. **Fase 1**: Actualizar template HTML en `recibo_templates`
   - Crear HTML completo con desglose
   - Versionar como v2
   - Insertar en BD via migración

2. **Fase 2**: Modificar `generarPDF()` en recibosController
   - Agregar lógica de procesamiento en pares
   - Agregar reemplazos de placeholders (desglose)
   - Verificar detección de arancel negativo

3. **Fase 3**: Testing
   - Tests unitarios de placeholder replacement
   - Test de integración del endpoint
   - E2E en navegador con PDF real

4. **Fase 4**: Deploy y validación
   - Deploy a Hostinger
   - Generar recibos reales
   - Verificar PDF con usuario

---

## Criterios de Aceptación

- ✅ PDF contiene desglose de cuotas en cada recibo
- ✅ PDF muestra hasta 2 recibos diferentes por página A4
- ✅ Arancel negativo es detectado visualmente en PDF
- ✅ Descarga funciona sin errores
- ✅ PDF abre en visualizadores estándar (Adobe Reader, etc.)
- ✅ No regresiones en funcionalidad existente (BACKLOG-065)

---

## Notas Adicionales

### Diferencia con ReciboDetalleModal

El desglose en PDF debe asemejarse al componente frontend `ResumenDesglose.jsx`:
- Mismos colores ($color-primary, $color-success, $color-text)
- Mismo layout: tabla de 2 columnas
- Misma lógica de detección arancel negativo

Esto asegura consistencia visual en toda la aplicación.

### Escalabilidad Futura

El sistema de templates en DB permite:
- Agregar nueva columna `max_recibos_per_page` (actualmente hardcodeado a 2)
- Admin panel para crear templates personalizados
- Versioning de templates sin pérdida de datos

---
