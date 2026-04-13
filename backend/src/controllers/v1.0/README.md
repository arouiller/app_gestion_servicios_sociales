# Controllers v1.0

Controladores para modelo de BD 1.0.x (personas, plan_integrantes, historial_cuota, recibos).

Estos controllers coexisten con controllers 2.0.x durante el refactor incremental.

## Archivos

- `personasController.js` — Búsqueda de personas (GET /api/personas?search=...)
- `recibosController.js` — Generación y consulta de recibos
- `planesController.js` — CRUD de planes (modelo 1.0.x)
