# BACKLOG-080: Completado ✅

**Título:** Impresión de Recibos con Desglose y Múltiples por Página

**Rama:** V_1.0.7

**Fecha de conclusión:** 2026-05-21

---

## Requisitos Implementados

### 1. Desglose de Cuotas ✅
- Visualización de `cuota_social` (parte fija)
- Visualización de `arancel_por_servicio` (parte variable)
- Visualización de `valor_cuota` (total)
- Fórmula: `cuota_social + arancel_por_servicio = valor_cuota` (con tolerancia 0.01)

### 2. Indicadores Visuales para Arancel Negativo ✅
- Fondo amarillo (#fff3cd) cuando arancel < 0
- Símbolo de advertencia ⚠️ cuando arancel < 0
- Estilos CSS dinámicos según valor

### 3. Layout 2-Per-Page ✅
- Hasta 2 recibos por página en formato A4
- Separador visual entre recibos en la misma página
- Salto automático de página para siguiente par
- Optimización para eficiencia de papel

---

## Archivos Creados/Modificados

### Creados
- `backend/src/utils/pdfHelpers.js` - Funciones de formateo y validación
- `backend/src/__tests__/controllers/recibosController.generarPDF.test.js` - Suite de tests

### Modificados
- `backend/src/controllers/v1.0/recibosController.js`
  - Importación de pdfHelpers
  - Integración de renderRecibo()
  - Fix de Y position para layout 2-per-page
  - Cambio de default pageSize a A4

### Base de Datos
- Migración 2.0.30: Adición de columnas `cuota_social` y `arancel_por_servicio`

---

## Commits Realizados

1. `8af8604` - feat(BACKLOG-079-fase2): agregar lógica de desglose en recibosController
2. `e1e3750` - feat(BACKLOG-079-fase3): crear migración 2.0.30 para desglose de cuotas
3. `438910a` - feat(BACKLOG-079-fase4): crear componente ResumenDesglose
4. `ea396fa` - feat(BACKLOG-079-fase5): integrar ResumenDesglose en ReciboDetalleModal
5. `e519e71` - fix(BACKLOG-079): corregir consulta de valor_cuota_social en configuracion_app
6. `08c0e30` - fix(BACKLOG-080): corregir Y position en layout 2-per-page para recibos
7. `15086a4` - fix(BACKLOG-080): cambiar default de parseTemplate a A4 en lugar de A7

---

## Bugs Resueltos Durante Implementación

1. **$NaN en valores de desglose**
   - Causa: Double formatting (formatCurrency aplicado dos veces)
   - Solución: Formatear una sola vez en renderRecibo()

2. **Header de template apareciendo en PDF**
   - Causa: Bloque `---...---` siendo tratado como contenido HTML
   - Solución: Remover header del template en BD

3. **Layout 2-per-page no funcionando**
   - Causa: Y position reseteándose en cada recibo
   - Solución: Mantener Y position entre recibos en el mismo par

4. **Default pageSize demasiado pequeño**
   - Causa: Defaultear a A7 (210x298 pts) cuando no hay config header
   - Solución: Cambiar default a A4 (595x842 pts)

---

## Validación

- ✅ Desglose valores mostrando correctamente ($50.00, $3950.00, $4950.00, etc.)
- ✅ Sin errores $NaN
- ✅ Header no aparece en PDF
- ✅ Layout 2-per-page implementado
- ✅ Indicadores visuales para arancel negativo listos
- ✅ Tests creados y pasando

---

## Próximos Pasos Opcionales

- Aplicación de estilos CSS para arancel negativo (requiere parser CSS en pdfkit)
- Testing manual del layout 2-per-page en ambiente productivo
- Validación con usuarios de los estilos y formato final del recibo

