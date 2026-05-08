# Patrón de Paginación Backend + Ordenamiento + Items por Página

**Versión:** 1.0  
**Fecha:** 2026-05-08  
**Responsable:** Implementación progresiva en todos endpoints de listado

## Resumen

Patrón estándar para integrar paginación en el backend de todos los endpoints de listado, coordinado con:
- **Ordenamiento dinámico** (sortBy, order desde `useSortable`)
- **Limit configurable** (items_per_page desde `ConfigContext`)
- **Número de página** (estado local en frontend, no en URL)

---

## Parámetros Query

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `page` | number | Sí | Número de página (1-based). Default: 1 |
| `limit` | number | Sí | Items por página. Default: 15 (o desde `config.items_per_page`) |
| `sortBy` | string | No | Columna a ordenar |
| `order` | string | No | ASC \| DESC |
| ...otros | - | Según filtro | Parámetros específicos del filtro (tipo_plan, cobrador, etc.) |

## Respuesta Backend

```json
{
  "success": true,
  "data": [...],          // Array de items para la página actual
  "count": 50,            // Total de items (sin paginar)
  "page": 1,              // Página actual (1-based)
  "limit": 15,            // Items por página
  "totalPages": 4,        // Número total de páginas
  "offset": 0             // Offset aplicado (page-1)*limit
}
```

---

## Implementación Backend

### 1. Controller

Usar `findAndCountAll()` en lugar de `findAll()`:

```javascript
exports.filter = async (req, res, next) => {
  try {
    const { filtro } = req.params;
    const { page = 1, limit = 15, sortBy, order, ...filterParams } = req.query;
    
    // Construir WHERE según filtro
    let where = {};
    if (filtro === 'tipo_plan' && filterParams.tipo_plan_numero) {
      where.tipo_plan_numero = parseInt(filterParams.tipo_plan_numero);
    }
    // ... más lógica de filtro

    // Construir ORDER BY
    const columnMap = { /* mapping de columnas */ };
    let orderBy = [['id', 'ASC']]; // default
    if (sortBy) {
      orderBy = buildOrderByClause(sortBy, order, columnMap);
    }

    // Calcular offset
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 15);
    const offset = (pageNum - 1) * limitNum;

    // Usar findAndCountAll()
    const { count, rows } = await db.Model.findAndCountAll({
      where,
      order: orderBy,
      limit: limitNum,
      offset: offset,
      include: [...],
    });

    const totalPages = Math.ceil(count / limitNum);

    res.json({
      success: true,
      data: rows,
      count,
      page: pageNum,
      limit: limitNum,
      totalPages,
      offset,
    });
  } catch (err) {
    next(err);
  }
};
```

### 2. Service (Frontend)

Pasar los parámetros de paginación al API:

```javascript
getByFilter: async (filtro, params = {}) => {
  const { page = 1, limit = 15, sortBy, order, ...otherParams } = params;
  const queryParams = {
    page,
    limit,
    ...otherParams,
    ...(sortBy && { sortBy }),
    ...(order && { order }),
  };
  const response = await api.get(`/path/filter/${filtro}`, { params: queryParams });
  return response.data;
}
```

---

## Implementación Frontend

### 1. Estado Local

```javascript
const [page, setPage] = useState(1);
const configItemsPerPage = config?.items_per_page || 15;

// Hooks existentes
const { sortBy, order } = useSortable(...);
const [filtroEstado, setFiltroEstado] = useState('');
```

### 2. Función cargar()

```javascript
const cargar = useCallback(async () => {
  setLoading(true);
  try {
    const result = await service.getByFilter(filtro, {
      page,
      limit: configItemsPerPage,
      sortBy,
      order,
      estado: filtroEstado,
      // ... otros filtros
    });
    setData(result.data || []);
    setTotalCount(result.count);
    setTotalPages(result.totalPages);
  } catch (err) {
    // ...
  } finally {
    setLoading(false);
  }
}, [page, configItemsPerPage, sortBy, order, filtroEstado]);
```

### 3. Reseteo de Página

**Importante:** Resetear `page` a 1 cuando cambian filtros, ordenamiento o limit:

```javascript
// Resetear página cuando cambia sortBy/order/filtros
useEffect(() => {
  setPage(1);
}, [sortBy, order, filtroEstado, configItemsPerPage]);

// Cargar cuando cambia cualquier parámetro
useEffect(() => {
  cargar();
}, [cargar]);
```

### 4. Renderizar

Mostrar solo los items de la página actual (ya vienen del backend):

```javascript
{data.map(item => (
  <tr key={item.id}>
    {/* columnas */}
  </tr>
))}

{totalPages > 1 && (
  <Pagination
    currentPage={page}
    totalPages={totalPages}
    totalItems={totalCount}
    itemsPerPage={configItemsPerPage}
    onPageChange={setPage}
    onItemsPerPageChange={(newLimit) => {
      setPage(1); // Reset a página 1 cuando cambia limit
      // actualizar config si es necesario
    }}
  />
)}
```

---

## Endpoints a Implementar (Orden)

| # | Endpoint | Descripción | Estado |
|---|----------|-------------|--------|
| 1 | `GET /api/planes/filter/:filtro` | Filtración de planes | 🔄 En desarrollo |
| 2 | `GET /api/lookup/:entidad` | Lookup tables (cobrador, os, zona, etc.) | ⬜ Pendiente |
| 3 | `GET /api/personas/search` | Búsqueda de personas | ⬜ Pendiente |
| 4 | `GET /api/provincias` | Listado de provincias | ⬜ Pendiente |
| 5 | `GET /api/localidades` | Listado de localidades | ⬜ Pendiente |
| 6 | `GET /api/audit` | Auditoría del sistema | ⬜ Pendiente |
| 7 | `GET /api/bugs` | Gestión de bugs | ⬜ Pendiente |

---

## Notas Importantes

1. **Cálculo de offset:** `offset = (page - 1) * limit`
2. **Totalización:** Usar `findAndCountAll()` para obtener count sin paginar
3. **Reset de página:** Siempre resetear a página 1 cuando cambian filtros, ordenamiento o limit
4. **Coordinación:** Los 3 parámetros (page, limit, sortBy/order) deben ser independientes pero trabajar juntos
5. **Configuración:** `limit` por defecto viene de `config.items_per_page` (ConfigContext), no hardcodeado
6. **Estado local:** El número de página es estado local en el componente, NOT en la URL

---

## Testing

- [ ] Backend retorna count, totalPages, offset correctos
- [ ] Frontend pasa todos los parámetros (page, limit, sortBy, order, filtros)
- [ ] Página se resetea a 1 cuando cambia filtro
- [ ] Página se resetea a 1 cuando cambia ordenamiento
- [ ] Página se resetea a 1 cuando cambia limit
- [ ] Paginación funciona con datos ordenados
- [ ] Tabla muestra solo items de página actual (no todos)
- [ ] Componente Pagination funciona correctamente

---

## Referencias

- Spec: `docs/superpowers/specs/` (ver requerimientos de paginación)
- Hooks: `useSortable`, `usePagination`, `useConfig`
- Configuración: `ConfigContext.config.items_per_page`
- Util: `sortUtil.buildOrderByClause()`
