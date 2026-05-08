# 🔍 Guía de Uso - Diagrama de Dependencias Interactivo

## Cómo Abrir el Diagrama

1. Abre el archivo `ARCHITECTURE_DIAGRAM.html` en tu navegador
2. O accede directamente desde la raíz del proyecto

## 🎮 Controles de Zoom

### Botones de Control

| Botón | Acción | Atajo |
|-------|--------|-------|
| 🔍− Alejarse | Reduce el zoom un 10% | `Ctrl + -` |
| ⟲ Restablecer | Vuelve al 100% de zoom | `Ctrl + 0` |
| 🔍+ Acercarse | Aumenta el zoom un 10% | `Ctrl + +` |

### Rueda del Ratón

- **Ctrl + Rueda hacia arriba**: Acercarse (zoom in)
- **Ctrl + Rueda hacia abajo**: Alejarse (zoom out)

### Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl + +` | Acercarse |
| `Ctrl + -` | Alejarse |
| `Ctrl + 0` | Restablecer zoom |

## 🖱️ Paneo (Arrastrar)

### Con Ratón

1. **Click y arrastrar** en el diagrama para mover la vista
2. El cursor cambia de 👆 (grab) a ✊ (grabbing) mientras arrastras
3. Funciona independientemente del nivel de zoom

### Con Pantalla Táctil

1. **Arrastra con un dedo** para mover la vista
2. **Pellizca con dos dedos** para zoom (pinch to zoom)

## 📊 Vistas Disponibles

Usa los botones en la barra superior para cambiar entre vistas:

### 1. 📊 Diagrama Completo
**Mejor para**: Entender la arquitectura completa

Muestra:
- Modelos de BD con todas las asociaciones
- Endpoints API organizados por módulo
- Servicios Frontend
- Componentes React
- Todas las dependencias entre capas

**Usado para**: 
- Onboarding de nuevos desarrolladores
- Documentación arquitectónica
- Entender flujos de datos completos

### 2. 🗄️ Modelos de BD
**Mejor para**: Entender el esquema de la base de datos

Muestra:
- 21 modelos Sequelize
- 6 categorías de entidades
- Foreign keys y relaciones
- Campos principales de cada modelo

**Usado para**:
- Diseño de consultas
- Entender integridad referencial
- Planificar migraciones

### 3. 🔌 Endpoints API
**Mejor para**: Integración y consumo de APIs

Muestra:
- 40+ endpoints REST
- Métodos HTTP (GET, POST, PUT, PATCH, DELETE)
- Endpoints optimizados destacados
- Organizados por dominio de negocio

**Usado para**:
- Desarrollo frontend
- Testing de APIs
- Documentación para clientes

### 4. ⚛️ Componentes Frontend
**Mejor para**: Navegación del código React

Muestra:
- 30+ componentes React
- Organización por sección
- Relaciones padre-hijo
- Componentes genéricos y reutilizables

**Usado para**:
- Desarrollo de UI
- Refactoring de componentes
- Entender flujos de interacción

## 💾 Persistencia

El nivel de zoom se guarda automáticamente en el navegador:

- El zoom persiste entre sesiones
- Se reinicia al cambiar de vista
- Se almacena en `localStorage` con clave `diagramZoom`

Para limpiar: Abre la consola y ejecuta:
```javascript
localStorage.removeItem('diagramZoom');
location.reload();
```

## 🎯 Consejos de Uso

### Para Explorar el Diagrama Completo

1. Comienza con zoom al **100%**
2. **Alejate (70-80%)** para ver la estructura general
3. **Acércate (150%+)** para leer etiquetas específicas
4. Usa **arrastra** para navegar entre secciones

### Para Encontrar Dependencias

1. Abre el diagrama completo
2. Busca el componente/endpoint/modelo que te interesa
3. Sigue las flechas para ver qué depende de qué
4. Usa zoom para explorar en detalle

### Para Entender Flujos de Datos

1. Comienza en un **componente React**
2. Sigue hacia **servicios**
3. Luego a **endpoints API**
4. Finalmente a **modelos de BD**

Ejemplo: `GestionPlanesV1` → `planesService` → `GET /api/planes/filter` → `PlanV1`

## 🔗 Leyenda de Colores

| Color | Tipo | Significado |
|-------|------|-------------|
| 🔵 Azul | Modelos BD | Entidades Sequelize |
| 🟢 Verde | Endpoints API | Rutas Express |
| 🟡 Amarillo | Servicios | Clientes HTTP |
| 🔴 Rojo | Componentes | Componentes React |
| 🟣 Púrpura | Genéricos | Componentes Reutilizables |

## 📱 Dispositivos Móviles

El diagrama es responsivo:

- **Pantalla pequeña (< 768px)**: Interfaz simplificada
- **Zoom táctil**: Pellizca con dos dedos
- **Paneo**: Arrastra con un dedo

## 🐛 Solución de Problemas

### "El diagrama no carga"
1. Recarga la página (`F5` o `Ctrl+R`)
2. Limpia la caché del navegador
3. Verifica que JavaScript esté habilitado

### "El zoom no funciona"
1. Asegúrate de usar `Ctrl` + rueda (no solo rueda)
2. Intenta con los botones manualmente
3. Recarga la página

### "El diagrama se ve pequeño/grande"
1. Haz click en "⟲ Restablecer" para volver a 100%
2. Usa los botones o teclado para ajustar
3. Usa zoom táctil en móviles (pellizca)

## 📚 Documentación Relacionada

- `ARCHITECTURE.md` - Documentación técnica detallada
- `ARQUITECTURA.md` - Análisis de implementación
- `CLAUDE.md` - Instrucciones del proyecto

## 🚀 Próximas Mejoras

- [ ] Exportar diagrama como PNG/SVG
- [ ] Búsqueda dentro del diagrama
- [ ] Filtros de componentes por tipo
- [ ] Navegación con teclado (flechas)
- [ ] Modo oscuro

---

**Última actualización**: 2026-05-08  
**Versión del diagrama**: 1.1 (con zoom)
