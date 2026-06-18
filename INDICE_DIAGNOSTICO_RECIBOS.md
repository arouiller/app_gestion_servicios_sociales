# Índice: Plan de Diagnóstico para PDF de Recibos

**Problema:** PDF no respeta `recibos_por_pagina`, `márgenes`, y `gap_vertical_mm` del template  
**Estado:** Documentación de diagnóstico completada  
**Fecha:** 2026-06-18  
**Tiempo estimado para ejecutar:** 60-90 minutos

---

## Documentos de Este Diagnóstico

### 1. **DIAGNOSTICO_RESUMEN.md** ← COMIENZA AQUÍ
**Lectura:** 5 minutos  
**Objetivo:** Entender el problema en una oración  
**Contenido:**
- El problema resumido
- Cadena de datos donde puede fallar
- 5 pasos simples de diagnóstico
- Causas probables ordenadas por probabilidad
- Tabla de decisión rápida

**Ideal para:** Entendimiento rápido, decisiones iniciales

---

### 2. **PLAN_DIAGNOSTICO_RECIBOS_PDF.md** ← REFERENCIA TÉCNICA
**Lectura:** 20 minutos (completa) o 5 minutos (resumen)  
**Objetivo:** Diagnóstico detallado con contexto técnico  
**Contenido:**
- Arquitectura de la cadena de datos
- 5 puntos de ruptura específicos en código
- Problemas detectados en cada punto
- 5 pasos de diagnóstico (15 min cada uno)
- Correcciones propuestas (A, B, C, D)
- Cronograma de ejecución
- Matriz de riesgo
- Referencias a archivos afectados

**Ideal para:** Análisis técnico profundo, entendimiento de causa raíz

---

### 3. **ARQUITECTURA_SOLUCION_RECIBOS_PDF.md** ← REFERENCIA VISUAL
**Lectura:** 15 minutos  
**Objetivo:** Cómo DEBERÍA funcionar (correctamente)  
**Contenido:**
- Diagrama de flujo: cómo debería ser
- Especificación técnica con ejemplo
- Diagrama de fallos (escenarios 1 y 2)
- Tabla síntomas vs causa
- Checklist de validación (10 items)
- Fórmula de cálculo de altura
- Valores aceptables por propiedad

**Ideal para:** Validar si la solución es correcta, entender métricas

---

### 4. **EJECUTAR_DIAGNOSTICO.md** ← GUÍA PASO A PASO
**Lectura:** 30 minutos de instrucciones  
**Objetivo:** Ejecutar el diagnóstico completo (FASE 1-6)  
**Contenido:**
- Fase 1: Recopilación de evidencia (BD)
- Fase 2: Instrumentar código (agregar logs)
- Fase 3: Generar PDF con logs
- Fase 4: Analizar evidencia
- Fase 5: Aplicar correcciones rápidas
- Fase 6: Validar solución
- Procedimiento de rollback

**Ideal para:** Ejecución real del diagnóstico, paso a paso

---

## Flujo de Lectura Recomendado

```
Inicio
  │
  ├─ ¿Tienes 5 minutos?
  │  └─ Lee: DIAGNOSTICO_RESUMEN.md
  │     └─ ¿Entiendes el problema?
  │        ├─ SÍ → Ve a Paso 2
  │        └─ NO → Lee: PLAN_DIAGNOSTICO_RECIBOS_PDF.md (sección "Cadena de Datos")
  │
  ├─ ¿Tienes 20 minutos más?
  │  └─ Lee: PLAN_DIAGNOSTICO_RECIBOS_PDF.md (completo)
  │     └─ ¿Entiendes arquitectura?
  │        ├─ SÍ → Ve a Paso 3
  │        └─ NO → Lee: ARQUITECTURA_SOLUCION_RECIBOS_PDF.md
  │
  └─ ¿Listo para ejecutar?
     └─ Sigue: EJECUTAR_DIAGNOSTICO.md (Fase 1-6)
        └─ Crea archivos:
           ├─ DIAGNOSTICO_EVIDENCIA.txt (datos recopilados)
           └─ DIAGNOSTICO_RESULTADOS.md (conclusiones)
```

---

## Checklist de Ejecución

### Pre-Diagnóstico
- [ ] Acceso a BD MySQL
- [ ] Node.js funcionando
- [ ] Template configurado (2 recibos/página, 6mm gap)
- [ ] Al menos 2 recibos generados en BD

### Diagnóstico (EJECUTAR_DIAGNOSTICO.md)
- [ ] FASE 1: BD verificada (query SQL ejecutada)
- [ ] FASE 2: Logs agregados al código
- [ ] FASE 3: PDF generado con logs
- [ ] FASE 4: Evidencia analizada
- [ ] FASE 5: Correcciones aplicadas (A, B, C)
- [ ] FASE 6: Solución validada

### Post-Diagnóstico
- [ ] DIAGNOSTICO_EVIDENCIA.txt creado
- [ ] DIAGNOSTICO_RESULTADOS.md completado
- [ ] Causa raíz documentada
- [ ] Solución implementada o recomendada

---

## Puntos de Ruptura: Mapa Rápido

```
BUG MANIFESTACIÓN: PDF con 1 recibo/página
│
├─ Punto 1: BD
│  ├─ Ubicación: MySQL recibo_templates.bloque_pageconfig
│  ├─ Síntoma: NULL, corrupto, o "recibos_por_pagina" faltante
│  ├─ Probabilidad: 25%
│  └─ Validar en: EJECUTAR_DIAGNOSTICO.md FASE 1
│
├─ Punto 2: Modelo Getter
│  ├─ Ubicación: backend/src/models/ReciboTemplate.js (líneas 71-89)
│  ├─ Síntoma: Getter devuelve string en lugar de objeto
│  ├─ Probabilidad: 10%
│  └─ Validar en: EJECUTAR_DIAGNOSTICO.md FASE 3 + PLAN sección "Corrección D"
│
├─ Punto 3: Controller Lectura
│  ├─ Ubicación: backend/src/controllers/v1.0/recibosController.js (líneas 586-622)
│  ├─ Síntoma: Código confuso, 2 lecturas, sobrescrituras
│  ├─ Probabilidad: 40%
│  └─ Fix: PLAN sección "Corrección A"
│
├─ Punto 4: Cálculo de Altura
│  ├─ Ubicación: backend/src/controllers/v1.0/recibosController.js (línea 643)
│  ├─ Síntoma: reciboHeight = 270mm (1 recibo) en lugar de 134.5mm (2 recibos)
│  ├─ Probabilidad: Depende de Punto 3
│  └─ Validar en: EJECUTAR_DIAGNOSTICO.md FASE 4 (HALLAZGO 3)
│
└─ Punto 5: html-pdf (Librería)
   ├─ Ubicación: backend/src/utils/pdfHelpers.js (generateMultiPagePDF)
   ├─ Síntoma: HTML correcto pero PDF ignora alturas
   ├─ Probabilidad: 25%
   └─ Solución: Migración a librería moderna (ARQUITECTURA sección "Si Falla Todo")
```

---

## Archivos del Proyecto a Revisar

Durante el diagnóstico, estos archivos son críticos:

| Archivo | Líneas | Propósito |
|---------|--------|----------|
| `backend/src/controllers/v1.0/recibosController.js` | 586-751 | Función `generarPDF()` |
| `backend/src/models/ReciboTemplate.js` | 71-97 | Getter de `bloque_pageconfig` |
| `backend/src/utils/pdfHelpers.js` | 352-398 | Función `generateMultiPagePDF()` |
| `backend/src/models/ReciboTemplate.js` | 90-97 | Setter de `bloque_pageconfig` |
| `backend/src/models/index.js` | - | Asegura todas las asociaciones |

---

## Variables Críticas a Monitorear

Durante EJECUTAR_DIAGNOSTICO.md Fase 2, estos son los valores a verificar:

```javascript
// Después de FASE 2 (logs agregados), buscar en terminal:

[PDF-DIAG-1] templateDB encontrado
  └─ bloque_pageconfig_type: ?
     ├─ Si: "object" → Getter funcionó ✓
     └─ Si: "string" → Getter falló (necesita parseo) ❌

[PDF-DIAG-2] pageConfig después de procesamiento
  └─ recibos_por_pagina: ?
     ├─ Si: 2 → Lectura correcta ✓
     └─ Si: 1 → Defecto o fallo lectura ❌

[PDF-DIAG-3] Cálculo de altura
  └─ reciboHeight: ?
     ├─ Si: ~134.5 mm → Cálculo correcto ✓
     └─ Si: ~270 mm → Solo 1 recibo ❌

[PDF-DIAG-4] HTML generado
  └─ Buscar: <div style="height: 134.5mm">
     ├─ Si presente → HTML correcto ✓
     └─ Si ausente → HTML mal ❌
```

---

## Posibles Resultados Finales

### Resultado 1: Corrección A Soluciona (Más Probable)
```
Causa: Código de lectura de pageConfig confuso
Solución: Limpiar lineas 586-622 (CORRECCIÓN A)
Tiempo: 5 minutos
Resultado esperado: PDF con 2 recibos/página ✓
```

### Resultado 2: Modelo Getter Defectuoso
```
Causa: ReciboTemplate.js getter devuelve string
Solución: Revisar/corregir getter (CORRECCIÓN D)
Tiempo: 10 minutos
Resultado esperado: PDF con 2 recibos/página ✓
```

### Resultado 3: html-pdf Ignora Alturas (Menos Probable)
```
Causa: Librería html-pdf tiene limitaciones
Solución: Migrar a htmlkit-pdf o puppeteer
Tiempo: 2-4 horas
Resultado esperado: Control total sobre rendering
```

### Resultado 4: Desconocido
```
Causa: Punto de ruptura no identificado
Acción: Ejecutar FASE 4 del diagnóstico (análisis detallado)
Resultado: Identificar causa específica
```

---

## Recursos Auxiliares

### Herramientas Necesarias
- **JSON Validator:** https://jsonlint.com/
- **MySQL Cliente:** `mysql` CLI o phpMyAdmin
- **Editor:** VS Code o similar
- **Navegador:** Para generar PDF desde frontend

### Archivos a Crear Durante Ejecución
- `DIAGNOSTICO_EVIDENCIA.txt` - Datos recopilados
- `DIAGNOSTICO_RESULTADOS.md` - Conclusiones finales

### Historial de Bugs Relacionados
- **BUG-053:** Bloques superpuestos en recibos (coordinadas incorrectas)
- **Error 500 Templates:** Márgenes como INT vs JSON string en BD

---

## Preguntas Frecuentes

**P: ¿Cuánto tiempo toma?**  
R: Diagnóstico completo = 60 minutos + correcciones 10 minutos

**P: ¿Es seguro cambiar código?**  
R: Sí, cambios son principalmente logs + refactoring puro (CORRECCIÓN A)

**P: ¿Necesito base de datos?**  
R: Sí, para FASE 1 (verificar BD)

**P: ¿Si html-pdf es el problema?**  
R: Será necesaria migración de librería (2-4 horas, más invasivo)

**P: ¿Rollback si algo sale mal?**  
R: Sí, `git checkout` simple (ver sección Rollback)

---

## Próximos Pasos Después del Diagnóstico

1. **Ejecutar diagnóstico** → Crear DIAGNOSTICO_EVIDENCIA.txt
2. **Identificar causa** → Analizar resultados en FASE 4
3. **Aplicar corrección** → CORRECCIÓN A/B/C/D según causa
4. **Validar solución** → FASE 6 del diagnóstico
5. **Documentar** → Crear DIAGNOSTICO_RESULTADOS.md
6. **Registrar bug** → Actualizar BUGS.md con causa raíz
7. **Commit** → `git commit -m "fix: PDF respeta recibos_por_pagina"`

---

## Contacto / Escalada

Si el diagnóstico no identifica la causa o las correcciones no funcionan:

1. Revisar `/DIAGNOSTICO_EVIDENCIA.txt` (¿Qué logs hay?)
2. Comparar con escenarios en `/PLAN_DIAGNOSTICO_RECIBOS_PDF.md`
3. Considerar Resultado 3 (librería pdf limitación)
4. Documentar hallazgos en `/DIAGNOSTICO_RESULTADOS.md`

---

## Resumen de Archivos Creados

```
c:/proyectos/App_gestion_servicios_sociales/
├─ INDICE_DIAGNOSTICO_RECIBOS.md          ← Este archivo
├─ DIAGNOSTICO_RESUMEN.md                 ← Comienza aquí (5 min)
├─ PLAN_DIAGNOSTICO_RECIBOS_PDF.md        ← Técnico (20 min)
├─ ARQUITECTURA_SOLUCION_RECIBOS_PDF.md   ← Visual (15 min)
├─ EJECUTAR_DIAGNOSTICO.md                ← Paso a paso (60 min)
├─ DIAGNOSTICO_EVIDENCIA.txt              ← (Crear durante ejecución)
└─ DIAGNOSTICO_RESULTADOS.md              ← (Crear al final)
```

---

**Última actualización:** 2026-06-18  
**Versión:** 1.0

