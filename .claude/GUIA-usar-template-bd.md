# Guía: Usar Template HTML en la BD

## ¿Por qué versión compatible con tablas?

El HTML con **Flexbox** que generé inicialmente no funciona bien en pdfkit porque:
- pdfkit tiene soporte limitado para CSS moderno
- No soporta `display: flex`, `gap`, `grid`, etc.
- El parser `parseHTMLSimple()` solo entiende tablas

La **versión con tablas** funciona porque:
- Las tablas son bien soportadas por pdfkit
- El parser las reconoce y renderiza correctamente
- Es compatible con el sistema actual

## Archivos disponibles

### 1. `backend/src/templates/recibo-tabla-compatible.html`
- HTML puro con estructura de tablas
- Compatible 100% con pdfkit
- Listo para copiar a la BD

### 2. `.claude/SQL-insertar-template-previsora.sql`
- SQL para insertar el template en la BD
- Incluye el HTML completo
- Listo para ejecutar en phpMyAdmin

## Pasos para usar el template

### Opción A: Insertar en phpMyAdmin

1. **Abre phpMyAdmin** → tu base de datos
2. **Sección SQL** → pega el contenido de `SQL-insertar-template-previsora.sql`
3. **Ejecuta** el SQL
4. **Verifica** en tabla `recibo_templates` que se creó el nuevo registro con `activo = 1`

### Opción B: Insertar por línea de comandos MySQL

```bash
mysql -u usuario -p nombre_base_datos < .claude/SQL-insertar-template-previsora.sql
```

### Opción C: Si ya tienes un template y quieres reemplazarlo

```sql
-- Primero, desactiva el anterior
UPDATE recibo_templates SET activo = 0 WHERE activo = 1;

-- Luego, ejecuta el INSERT del archivo SQL
```

## Generar PDF con el nuevo template

Una vez insertado en la BD, automáticamente usará el nuevo diseño cuando:

```bash
GET /api/recibos/generar-pdf?periodo=2026-05
```

## Resultado esperado

✅ PDF con estructura de Previsora del Norte:
- Header con logo, nombre, teléfono
- Tres columnas: afiliado | espacio foto | desglose
- Desglose de cuotas (Cuota Social, Arancel, Total)
- Sección mensaje
- Aviso sobre mora
- Talón para cobrador
- **2 recibos por página A4**

## Si necesitas cambios de diseño

El HTML en `recibo-tabla-compatible.html` es editable. Cambios comunes:

### Cambiar colores
```html
color: #d91e63;  /* Cambiar a otro color hex */
background: #f9f9f9;  /* Cambiar fondo */
```

### Cambiar tamaños de fuente
```html
font-size: 14px;  /* Cambiar tamaño */
```

### Cambiar estructura (agregar/quitar campos)
Edita la tabla del HTML y agrega placeholders como:
```html
<td>{{nombre_del_campo}}</td>
```

### Después de cambios
1. Copia el HTML modificado
2. Actualiza el SQL (reemplaza el contenido en el INSERT)
3. Ejecuta en BD (recuerda desactivar el anterior primero)

## Placeholders disponibles

Todos los datos que vienen del recibo pueden usarse con `{{placeholder}}`:

**Datos del afiliado:**
- `{{numero_afiliado}}`
- `{{numero_documento}}`
- `{{titular_apellido}}`
- `{{titular_nombre}}`
- `{{fecha_nacimiento}}`
- `{{fecha_cobertura}}`

**Datos de plan:**
- `{{tipo_plan_nombre}}`
- `{{tipo_de_grupo_nombre}}`
- `{{domicilio}}`
- `{{localidad_nombre}}`

**Datos del recibo:**
- `{{numero_recibo}}`
- `{{periodo}}`

**Desglose de cuotas:**
- `{{cuota_social}}` (ya formateado como $X.XX)
- `{{arancel_por_servicio}}` (ya formateado)
- `{{valor_cuota}}` (ya formateado)