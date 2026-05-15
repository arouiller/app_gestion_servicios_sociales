# Impresión de Recibos en PDF — Design Specification

**Date**: 2026-05-09  
**Feature**: PDF generation for receipts with template-based customization  
**Status**: Design Complete

---

## Overview

Add PDF export capability to GenerarRecibosModal (step 4: success state). Users click "Imprimir" button to generate a PDF containing all receipts from the generated period. PDF generation uses a template system stored in the database, allowing future customization without code changes.

---

## Goals

- ✅ Generate PDF from receipt data with minimal UI changes
- ✅ Support template customization (future: admin panel)
- ✅ Provide sensible default template (simple table)
- ✅ Architecture scales to support rich templates later

---

## Architecture

### Data Layer: `recibo_templates` Table

**Purpose**: Store HTML templates for receipt PDF generation with versioning support.

**Schema**:
```sql
CREATE TABLE recibo_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  html LONGTEXT NOT NULL,
  version INT DEFAULT 1,
  activo BOOLEAN DEFAULT false,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  usuario_id INT NOT NULL,
  descripcion TEXT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_activo (activo),
  INDEX idx_usuario_id (usuario_id)
);
```

**Fields**:
- `id`: Unique identifier
- `nombre`: Template name (e.g., "Recibo Estándar 2026")
- `html`: Full HTML template with placeholders
- `version`: Version number for tracking changes
- `activo`: Boolean flag indicating active template (only one should be true)
- `fecha_creacion`: Timestamp of creation
- `usuario_id`: User who created the template
- `descripcion`: Optional notes on template changes

**Initial data**: Insert one default template with basic table layout.

---

### Backend: PDF Generation Endpoint

**Route**: `POST /api/recibos/generar-pdf`

**Authentication**: Required (verifyToken middleware)

**Query Parameters**:
- `periodo` (string, format: YYYY-MM): Period to fetch receipts from
- `recibos_ids` (optional, comma-separated integers): Specific receipt IDs; if omitted, all receipts for the period

**Request Body**: Empty (parameters in query string)

**Response**:
- Success (200): PDF binary stream
  - Header: `Content-Type: application/pdf`
  - Header: `Content-Disposition: attachment; filename="recibos_YYYY-MM.pdf"`
- Error (400): `{ error: "Invalid period format" }`
- Error (404): `{ error: "No receipts found for this period" }`
- Error (500): `{ error: "PDF generation failed" }`

**Implementation Logic**:
1. Validate `periodo` format (YYYY-MM)
2. Query all receipts matching period (or recibos_ids if provided)
3. If no receipts found, return 404 error
4. Fetch active template from `recibo_templates` WHERE `activo=true`
5. If no active template, use hardcoded default template
6. For each receipt:
   - Replace all placeholders in template HTML with receipt data
   - Validate all required fields present (non-null replacements)
7. Concatenate all receipt HTML into single document
8. Convert HTML to PDF using `pdfkit`
9. Return PDF with appropriate headers

**Supported Placeholders**:
- `{{numero_recibo}}` — Receipt number
- `{{numero_afiliado}}` — Affiliate number (5-digit padded)
- `{{zona_codigo}}` — Zone code (if available)
- `{{titular_apellido}}` — Holder surname
- `{{titular_nombre}}` — Holder given name
- `{{obra_social_nombre}}` — Health insurance name
- `{{valor_cuota}}` — Quota value (decimal, 2 places)
- `{{tipo_plan_nombre}}` — Plan type name
- `{{tipo_de_grupo_nombre}}` — Group type name
- `{{cobrador_apellido}}` — Collector surname
- `{{cobrador_nombre}}` — Collector given name
- `{{periodo}}` — Period (YYYY-MM)

---

### Frontend: UI Integration

**Component**: `GenerarRecibosModal.jsx`

**Changes**:
1. Step 4 (success state): Modify "Imprimir" button
   - Current: `onClick={handleClose}`
   - New: `onClick={handleGenerarPDF}`

2. New handler `handleGenerarPDF()`:
   ```javascript
   const handleGenerarPDF = async () => {
     setLoading(true);
     try {
       await recibosService.generarPDF(periodo, recibosGenerados.map(r => r.id));
       // Browser auto-downloads PDF
       // Show success toast
     } catch (err) {
       // Show error toast
     } finally {
       setLoading(false);
     }
   };
   ```

3. Button state:
   - Disabled during loading
   - Text changes to "Generando PDF..." during loading

**Service**: Add `generarPDF(periodo, recibos_ids)` to `recibosService.js`:
```javascript
generarPDF: async (periodo, recibos_ids) => {
  try {
    const params = new URLSearchParams();
    params.append('periodo', periodo);
    if (recibos_ids && recibos_ids.length > 0) {
      params.append('recibos_ids', recibos_ids.join(','));
    }
    const response = await api.get(`/recibos/generar-pdf?${params}`, {
      responseType: 'blob'
    });
    // Trigger download
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `recibos_${periodo}.pdf`);
    link.click();
  } catch (error) {
    throw error;
  }
};
```

---

### Default Template (Hardcoded Fallback)

Simple HTML table template included in controller as constant:

```html
<!DOCTYPE html>
<html lang="es-AR">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      color: #333;
    }
    h2 {
      text-align: center;
      color: #2c3e50;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th {
      background-color: #34495e;
      color: white;
      padding: 12px;
      text-align: left;
      border: 1px solid #2c3e50;
      font-weight: bold;
    }
    td {
      padding: 10px 12px;
      border: 1px solid #bdc3c7;
    }
    tr:nth-child(even) {
      background-color: #ecf0f1;
    }
    .page-break {
      page-break-after: always;
      margin: 20px 0;
      border-bottom: 1px dashed #ccc;
    }
  </style>
</head>
<body>
  <h2>Recibos — {{periodo}}</h2>
  <table>
    <thead>
      <tr>
        <th>N° Recibo</th>
        <th>Afiliado</th>
        <th>Titular</th>
        <th>Obra Social</th>
        <th>Valor Cuota</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{{numero_recibo}}</td>
        <td>{{numero_afiliado}}</td>
        <td>{{titular_apellido}}, {{titular_nombre}}</td>
        <td>{{obra_social_nombre}}</td>
        <td>${{valor_cuota}}</td>
      </tr>
    </tbody>
  </table>
</body>
</html>
```

---

### Database Migration

**Migration File**: `backend/src/migrations/versions/2.0.28/upgrade.sql`

**Upgrade SQL**:
```sql
-- Create recibo_templates table
CREATE TABLE recibo_templates (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  html LONGTEXT NOT NULL,
  version INT DEFAULT 1,
  activo BOOLEAN DEFAULT false,
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  usuario_id INT NOT NULL,
  descripcion TEXT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  INDEX idx_activo (activo),
  INDEX idx_usuario_id (usuario_id)
);

-- Insert default template
INSERT INTO recibo_templates (nombre, version, activo, usuario_id, descripcion, html)
VALUES ('Recibo Estándar 2026', 1, true, 1, 'Template por defecto', '[HTML content here]');
```

**Downgrade SQL**:
```sql
DROP TABLE IF EXISTS recibo_templates;
```

---

## Data Flow

1. **User generates receipts** → GenerarRecibosModal step 4 displays success message
2. **User clicks "Imprimir"** → `handleGenerarPDF()` triggered
3. **Frontend calls** `POST /api/recibos/generar-pdf?periodo=2026-04`
4. **Backend**:
   - Fetches all receipts for period 2026-04
   - Fetches active template (or uses hardcoded default)
   - Replaces placeholders for each receipt
   - Generates PDF with `pdfkit`
   - Returns PDF binary
5. **Frontend**: Auto-downloads `recibos_2026-04.pdf`

---

## Error Handling

| Error | Status | Response | User Experience |
|-------|--------|----------|-----------------|
| Invalid period format | 400 | `{ error: "Invalid period format" }` | Toast error message |
| No receipts found | 404 | `{ error: "No receipts found" }` | Toast error message |
| Template missing or corrupt | 500 | `{ error: "PDF generation failed" }` | Toast: falls back to default template automatically |
| Network error | - | - | Toast error, retry button |

---

## Future Extensibility

**Phase 2 (not in this release)**:
- Admin panel at `/admin/recibo-templates` for:
  - List active + archived templates
  - Create new template (paste HTML)
  - Edit template HTML
  - Preview template with sample data
  - Activate/deactivate templates
  - Validate template (check all required placeholders present)
  - Version history

**Phase 3**:
- Template builder UI (drag-drop fields instead of HTML editing)
- Conditional sections (show field only if not empty)
- Custom CSS per template

---

## Testing Strategy

- Unit tests: Template placeholder replacement (string matching)
- Integration tests: PDF generation endpoint with sample receipts
- E2E: GenerarRecibosModal → click Imprimir → PDF downloads

---

## Dependencies

**Backend**:
- `pdfkit` (PDF generation library)

**Frontend**:
- No new dependencies (uses Blob + download link)

---

## Files Modified/Created

**Backend**:
- `src/routes/recibos.js` — Add POST route `/generar-pdf`
- `src/controllers/v1.0/recibosController.js` — Add `generarPDF` handler
- `src/migrations/versions/2.0.28/upgrade.sql` — Create table + seed
- `src/migrations/versions/2.0.28/downgrade.sql` — Drop table

**Frontend**:
- `src/services/recibosService.js` — Add `generarPDF()` method
- `src/pages/DashboardPage/components/GestionPlanesV1/modals/GenerarRecibosModal.jsx` — Modify button handler

**Database**:
- New table: `recibo_templates`

---

## Success Criteria

- ✅ Clicking "Imprimir" generates and downloads PDF
- ✅ PDF contains all receipts from period
- ✅ PDF renders correctly in standard PDF viewers
- ✅ Template can be changed in DB without code deployment
- ✅ Error handling shows user-friendly messages
- ✅ No breaking changes to existing API

---
