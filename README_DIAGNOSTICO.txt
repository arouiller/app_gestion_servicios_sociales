================================================================================
  PLAN DE DIAGNÓSTICO: PDF DE RECIBOS NO RESPETA VALORES DEL TEMPLATE
================================================================================

PROBLEMA:
  PDF se genera con 1 recibo/página en lugar de 2
  Template configurado: recibos_por_pagina=2, márgenes=10mm, gap=6mm

CAUSA PROBABLE:
  recibos_por_pagina no se lee correctamente desde el template en BD

DOCUMENTACIÓN GENERADA (5 archivos):
================================================================================

1. DIAGNOSTICO_RESUMEN.md (5 min de lectura)
   ├─ El problema en una oración
   ├─ Cadena de datos donde puede fallar
   ├─ 5 pasos simples de diagnóstico
   ├─ Causas probables por probabilidad
   └─ Tabla de decisión rápida

2. PLAN_DIAGNOSTICO_RECIBOS_PDF.md (20 min de lectura)
   ├─ Arquitectura de cadena de datos
   ├─ 5 puntos de ruptura específicos
   ├─ Problemas detectados en cada punto
   ├─ 5 pasos de diagnóstico detallado (15 min cada)
   ├─ Correcciones propuestas (A, B, C, D)
   ├─ Cronograma de ejecución
   └─ Matriz de riesgo

3. ARQUITECTURA_SOLUCION_RECIBOS_PDF.md (15 min de lectura)
   ├─ Diagrama de flujo: cómo debería funcionar
   ├─ Especificación técnica con ejemplo
   ├─ Diagrama de fallos (escenarios)
   ├─ Tabla síntomas vs causa
   ├─ Checklist de validación
   ├─ Fórmula de cálculo de altura
   └─ Valores aceptables por propiedad

4. EJECUTAR_DIAGNOSTICO.md (60 min de ejecución)
   ├─ Fase 1: Recopilación de evidencia (BD)
   ├─ Fase 2: Instrumentar código (agregar logs)
   ├─ Fase 3: Generar PDF con logs
   ├─ Fase 4: Analizar evidencia
   ├─ Fase 5: Aplicar correcciones rápidas
   ├─ Fase 6: Validar solución
   └─ Procedimiento de rollback

5. INDICE_DIAGNOSTICO_RECIBOS.md
   ├─ Índice completo de todos los archivos
   ├─ Flujo de lectura recomendado
   ├─ Mapa de puntos de ruptura
   ├─ Checklist de ejecución
   ├─ Archivos del proyecto a revisar
   └─ Preguntas frecuentes

================================================================================
CÓMO EMPEZAR (3 opciones):
================================================================================

OPCIÓN A: Entendimiento Rápido (10 minutos)
  1. Lee: DIAGNOSTICO_RESUMEN.md
  2. Observa: Diagrama cadena de datos
  3. Decide: Cuál es tu próximo paso

OPCIÓN B: Análisis Profundo (30 minutos)
  1. Lee: DIAGNOSTICO_RESUMEN.md (5 min)
  2. Lee: PLAN_DIAGNOSTICO_RECIBOS_PDF.md (20 min)
  3. Lee: ARQUITECTURA_SOLUCION_RECIBOS_PDF.md (15 min)
  4. Decide: Cómo ejecutar diagnóstico

OPCIÓN C: Ejecución Inmediata (75 minutos)
  1. Prepara: Base de datos, Node.js, acceso a código
  2. Sigue: EJECUTAR_DIAGNOSTICO.md (FASE 1-6)
  3. Crea: DIAGNOSTICO_EVIDENCIA.txt
  4. Aplica: Correcciones A/B/C/D

================================================================================
PUNTOS CRÍTICOS A MONITOREAR:
================================================================================

Variable 1: ¿Qué dice BD?
  Location: MySQL → recibo_templates.bloque_pageconfig
  What to find: { "recibos_por_pagina": 2, "gap_vertical_mm": 6, ... }
  Action: EJECUTAR_DIAGNOSTICO.md FASE 1

Variable 2: ¿Qué loga controller?
  Location: recibosController.js líneas 586-622
  What to find: [PDF-DIAG-2] muestra recibos_por_pagina: 2
  Action: EJECUTAR_DIAGNOSTICO.md FASE 2-3

Variable 3: ¿Qué altura calcula?
  Location: recibosController.js línea 643
  What to find: [PDF-DIAG-3] reciboHeight ≈ 134.5 mm (no 270 mm)
  Action: EJECUTAR_DIAGNOSTICO.md FASE 4

Variable 4: ¿Qué HTML genera?
  Location: recibosController.js línea 728
  What to find: <div style="height: 134.5mm"> (dos divs por página)
  Action: EJECUTAR_DIAGNOSTICO.md FASE 4

Variable 5: ¿PDF respeta HTML?
  Location: Visor PDF
  What to find: 2 recibos por página (no 1)
  Action: EJECUTAR_DIAGNOSTICO.md FASE 6

================================================================================
CAUSAS PROBABLES (por orden de probabilidad):
================================================================================

Causa 1: recibos_por_pagina llega como 1 o undefined
  Probability: 40%
  Location: recibosController.js líneas 586-622
  Fix: CORRECCIÓN A (5 minutos)
  Evidence: [PDF-DIAG-2] recibos_por_pagina: 1

Causa 2: BD contiene NULL o JSON inválido
  Probability: 25%
  Location: MySQL recibo_templates.bloque_pageconfig
  Fix: Repoblar BD correctamente
  Evidence: SELECT devuelve NULL o string roto

Causa 3: html-pdf ignora alturas en divs (limitación librería)
  Probability: 25%
  Location: pdfHelpers.js generateMultiPagePDF()
  Fix: Migrar a librería moderna (2-4 horas)
  Evidence: HTML correcto pero PDF sigue siendo 1/página

Causa 4: Getter modelo devuelve string
  Probability: 10%
  Location: ReciboTemplate.js líneas 71-89
  Fix: CORRECCIÓN D (revisar/corregir getter)
  Evidence: [PDF-DIAG-1] bloque_pageconfig_type: "string"

================================================================================
ARCHIVOS A MODIFICAR (si es necesario):
================================================================================

Crítico:
  backend/src/controllers/v1.0/recibosController.js (líneas 586-622)
    └─ Código de lectura de pageConfig confuso

Importante:
  backend/src/models/ReciboTemplate.js (líneas 71-97)
    └─ Getter/Setter de bloque_pageconfig

Menos crítico:
  backend/src/utils/pdfHelpers.js (generateMultiPagePDF)
    └─ Solo si html-pdf es limitación

================================================================================
DURACIÓN ESTIMADA:
================================================================================

Diagnóstico completo:      60 minutos
  ├─ FASE 1 (BD):          15 minutos
  ├─ FASE 2 (Logs):        10 minutos
  ├─ FASE 3 (Generar):     10 minutos
  ├─ FASE 4 (Analizar):    15 minutos
  ├─ FASE 5 (Corregir):    10 minutos
  └─ FASE 6 (Validar):     10 minutos

Correcciones A/B/C:        10 minutos (si es necesario)
Validación final:          15 minutos

Total: 85 minutos (1.5 horas)

Si html-pdf es limitación: 2-4 horas adicionales (refactor librería)

================================================================================
ESTADO DE RIESGO:
================================================================================

BAJO RIESGO (cambios simples, revertibles):
  ✓ Agregar logs (FASE 2)
  ✓ Simplificar código (CORRECCIÓN A)
  ✓ Validar variables (CORRECCIÓN B)

MEDIO RIESGO (refactor puro, sin cambio de comportamiento):
  ⚠ Limpiar lectura pageConfig
  ⚠ Revisar setter de modelo

ALTO RIESGO (cambio arquitectura librería):
  ✗ Migrar de html-pdf a puppeteer/htmlkit
  ✗ Requiere tests y validación completa

================================================================================
SIGUIENTE PASO:
================================================================================

Lee: DIAGNOSTICO_RESUMEN.md (5 minutos)
Entiende: Diagrama cadena de datos
Decide: Ejecutas diagnóstico completo o análisis profundo primero

Recomendación: Ejecuta DIAGNOSTICO_RESUMEN.md ahora, luego decide.

================================================================================
