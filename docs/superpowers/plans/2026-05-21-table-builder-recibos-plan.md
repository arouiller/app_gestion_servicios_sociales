# Table Builder para Templates de Recibos (BACKLOG-081) - Plan de Implementación

> **Para trabajadores agentes:** SUB-SKILL REQUERIDO: Usar `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para implementar este plan tarea por tarea. Los pasos usan sintaxis checkbox (`- [ ]`) para seguimiento.

**Objetivo:** Crear una herramienta visual que permita a administradores diseñar y personalizar templates HTML de recibos sin código, con vista previa en tiempo real y versionado automático.

**Arquitectura:** 
- **Backend:** Endpoints REST para cargar template activo, guardar cambios (sobrescribir o nueva versión), y listar placeholders disponibles
- **Frontend:** Componentes React organizados en: Store Zustand (state), Toolbar (herramientas), Editor (tabla interactiva), Preview (vista HTML viva)
- **BD:** Nueva tabla `recibo_templates` con versionado via `template_group_id` y `version_number`, donde solo un template por grupo tiene `activo = true`

**Tech Stack:**
- Frontend: React, Zustand, SCSS
- Backend: Express, Sequelize, MySQL
- Herramientas: DOMPurify (sanitización XSS), pdfHelpers.js (placeholders)

---

## Estructura de Archivos

### Backend
```
backend/src/
├── migrations/
│   └── versions/
│       └── [nueva carpeta de versión con upgrade.sql/downgrade.sql]
├── models/
│   └── ReciboTemplate.js (existente, modificar para versionado)
├── controllers/
│   └── v1.0/
│       └── adminController.js (crear/modificar endpoints)
├── routes/
│   └── v1.0/
│       └── admin.routes.js (crear rutas /recibos/*)
├── utils/
│   └── validators/
│       └── templateValidator.js (crear: validar HTML y placeholders)
└── middleware/
    └── (existente: auth.js, validate.js)
```

### Frontend
```
frontend/src/
├── pages/
│   └── AdminPanel/
│       └── ReciboDesignerPage.jsx (crear página principal)
├── components/
│   └── ReciboDesigner/
│       ├── ReciboDesignerToolbar.jsx (crear)
│       ├── StructureControls.jsx (crear: +Fila, -Fila, etc.)
│       ├── PlaceholderSelector.jsx (crear: desplegable placeholders)
│       ├── InlineEditor.jsx (crear: tabla editable)
│       ├── ReciboPreview.jsx (crear)
│       ├── PageControls.jsx (crear: tamaño, márgenes, orientación)
│       ├── SaveActions.jsx (crear: botones guardar/exportar)
│       └── ReciboDesigner.scss (crear estilos)
├── stores/
│   └── reciboDesigner.store.js (crear: Zustand store)
├── services/
│   └── reciboDesignerService.js (crear: API calls)
└── constants/
    └── placeholders.js (crear: lista de placeholders)
```

---

## Tareas de Implementación

### Task 1: Preparar Modelo de Datos

**Files:**
- Create: `backend/src/migrations/versions/XXX-add-recibo-templates-versioning/upgrade.sql`
- Create: `backend/src/migrations/versions/XXX-add-recibo-templates-versioning/downgrade.sql`
- Modify: `backend/src/models/ReciboTemplate.js`

#### **Paso 1.1: Crear migration upgrade.sql**

- [ ] Crear archivo `backend/src/migrations/versions/v1.0.8-add-recibo-templates-versioning/upgrade.sql`

```sql
-- Agregar columnas a tabla recibo_templates existente
ALTER TABLE recibo_templates 
ADD COLUMN template_group_id INT,
ADD COLUMN version_number INT DEFAULT 1,
ADD COLUMN created_by INT,
ADD COLUMN updated_by INT;

-- Crear índices para consultas de versiones y template activo
CREATE INDEX idx_template_group_id ON recibo_templates(template_group_id);
CREATE INDEX idx_activo ON recibo_templates(activo);
CREATE UNIQUE INDEX uk_template_group_version ON recibo_templates(template_group_id, version_number);

-- Agregar foreign keys
ALTER TABLE recibo_templates 
ADD CONSTRAINT fk_template_group FOREIGN KEY (template_group_id) 
  REFERENCES recibo_templates(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_created_by FOREIGN KEY (created_by) 
  REFERENCES usuarios(id),
ADD CONSTRAINT fk_updated_by FOREIGN KEY (updated_by) 
  REFERENCES usuarios(id);

-- Opcional: crear tabla de auditoría para historial completo
CREATE TABLE recibo_template_versions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  template_id INT NOT NULL,
  html_snapshot LONGTEXT,
  changed_by INT NOT NULL,
  change_description VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (template_id) REFERENCES recibo_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES usuarios(id),
  INDEX idx_template_id (template_id)
);
```

- [ ] Corroborar ruta y nombrado: el archivo debe estar en `backend/src/migrations/versions/v1.0.8-add-recibo-templates-versioning/`

#### **Paso 1.2: Crear migration downgrade.sql**

- [ ] Crear archivo `backend/src/migrations/versions/v1.0.8-add-recibo-templates-versioning/downgrade.sql`

```sql
-- Remover tabla de auditoría primero
DROP TABLE IF EXISTS recibo_template_versions;

-- Remover foreign keys
ALTER TABLE recibo_templates 
DROP CONSTRAINT IF EXISTS fk_template_group,
DROP CONSTRAINT IF EXISTS fk_created_by,
DROP CONSTRAINT IF EXISTS fk_updated_by;

-- Remover índices
DROP INDEX IF EXISTS idx_template_group_id ON recibo_templates;
DROP INDEX IF EXISTS idx_activo ON recibo_templates;
DROP INDEX IF EXISTS uk_template_group_version ON recibo_templates;

-- Remover columnas
ALTER TABLE recibo_templates 
DROP COLUMN template_group_id,
DROP COLUMN version_number,
DROP COLUMN created_by,
DROP COLUMN updated_by;
```

#### **Paso 1.3: Modificar modelo Sequelize**

- [ ] Abrir `backend/src/models/ReciboTemplate.js` y actualizar:

```javascript
module.exports = (sequelize, DataTypes) => {
  const ReciboTemplate = sequelize.define(
    'ReciboTemplate',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      html: {
        type: DataTypes.TEXT('long'),
        allowNull: false,
      },
      pageSize: {
        type: DataTypes.ENUM('A4', 'A5', 'Carta', 'Personalizado'),
        defaultValue: 'A4',
        field: 'page_size',
      },
      orientation: {
        type: DataTypes.ENUM('portrait', 'landscape'),
        defaultValue: 'portrait',
      },
      margins: {
        type: DataTypes.INTEGER,
        defaultValue: 8,
      },
      activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      templateGroupId: {
        type: DataTypes.INTEGER,
        field: 'template_group_id',
        allowNull: true,
        references: {
          model: 'recibo_templates',
          key: 'id',
        },
      },
      versionNumber: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        field: 'version_number',
      },
      createdBy: {
        type: DataTypes.INTEGER,
        field: 'created_by',
        allowNull: true,
      },
      updatedBy: {
        type: DataTypes.INTEGER,
        field: 'updated_by',
        allowNull: true,
      },
    },
    {
      tableName: 'recibo_templates',
      timestamps: true,
      underscored: true,
    }
  );

  ReciboTemplate.associate = (models) => {
    // Self-reference para versionado
    ReciboTemplate.hasMany(ReciboTemplate, {
      as: 'versions',
      foreignKey: 'templateGroupId',
    });
    ReciboTemplate.belongsTo(ReciboTemplate, {
      as: 'templateGroup',
      foreignKey: 'templateGroupId',
    });

    // Auditoría: usuario que creó/actualizó
    ReciboTemplate.belongsTo(models.Usuario, {
      as: 'creator',
      foreignKey: 'createdBy',
    });
    ReciboTemplate.belongsTo(models.Usuario, {
      as: 'updater',
      foreignKey: 'updatedBy',
    });
  };

  return ReciboTemplate;
};
```

#### **Paso 1.4: Commit**

- [ ] Hacer commit:

```bash
git add backend/src/migrations/versions/v1.0.8-add-recibo-templates-versioning/
git add backend/src/models/ReciboTemplate.js
git commit -m "feat(BACKLOG-081): agregar versionado a recibo_templates"
```

---

### Task 2: Crear Validador de Templates

**Files:**
- Create: `backend/src/utils/validators/templateValidator.js`

#### **Paso 2.1: Crear archivo validador**

- [ ] Crear `backend/src/utils/validators/templateValidator.js`:

```javascript
const placeholders = {
  recibo: [
    'numero_recibo', 'numero_afiliado', 'periodo', 'titular_apellido',
    'titular_nombre', 'fecha_nacimiento', 'fecha_cobertura',
    'numero_documento', 'obra_social_nombre', 'tipo_plan_nombre',
    'tipo_de_grupo_nombre', 'domicilio', 'localidad_nombre', 'zona_codigo',
  ],
  monetarios: [
    'valor_cuota', 'cuota_social', 'arancel_por_servicio', 'arancel_negativo_class',
  ],
};

const getAllPlaceholders = () => {
  return Object.values(placeholders).flat();
};

const validateHTML = (html) => {
  const errors = [];

  if (!html || html.trim().length === 0) {
    errors.push('HTML no puede estar vacío');
  }

  const hasTable = /<table|<div/.test(html);
  if (!hasTable) {
    errors.push('HTML debe contener al menos un <table> o <div>');
  }

  return errors;
};

const validatePlaceholders = (html) => {
  const errors = [];
  const placeholderRegex = /\{\{(\w+)\}\}/g;
  const match = html.match(placeholderRegex) || [];
  const usedPlaceholders = new Set(
    match.map((p) => p.replace(/[\{\}]/g, ''))
  );

  const allowedPlaceholders = getAllPlaceholders();
  usedPlaceholders.forEach((placeholder) => {
    if (!allowedPlaceholders.includes(placeholder)) {
      errors.push(
        `Placeholder {{${placeholder}}} no está en lista permitida`
      );
    }
  });

  return errors;
};

const validatePageConfig = (pageSize, orientation, margins) => {
  const errors = [];

  const validSizes = ['A4', 'A5', 'Carta', 'Personalizado'];
  if (!validSizes.includes(pageSize)) {
    errors.push(`pageSize debe ser uno de: ${validSizes.join(', ')}`);
  }

  const validOrientations = ['portrait', 'landscape'];
  if (!validOrientations.includes(orientation)) {
    errors.push(
      `orientation debe ser uno de: ${validOrientations.join(', ')}`
    );
  }

  const marginNum = parseInt(margins, 10);
  if (isNaN(marginNum) || marginNum < 0 || marginNum > 50) {
    errors.push('margins debe ser número entre 0 y 50 mm');
  }

  return errors;
};

const validateTemplate = (templateData) => {
  const { html, pageSize, orientation, margins } = templateData;
  const allErrors = [];

  allErrors.push(...validateHTML(html));
  allErrors.push(...validatePlaceholders(html));
  allErrors.push(...validatePageConfig(pageSize, orientation, margins));

  return allErrors;
};

module.exports = {
  validateTemplate,
  validateHTML,
  validatePlaceholders,
  validatePageConfig,
  getAllPlaceholders,
  placeholders,
};
```

#### **Paso 2.2: Commit**

- [ ] Hacer commit:

```bash
git add backend/src/utils/validators/templateValidator.js
git commit -m "feat(BACKLOG-081): crear validador de templates de recibos"
```

---

### Task 3: Crear Endpoints Backend

**Files:**
- Modify: `backend/src/routes/v1.0/admin.routes.js`
- Create or Modify: `backend/src/controllers/v1.0/adminController.js`

#### **Paso 3.1: Crear/modificar adminController.js**

- [ ] Crear o abrir `backend/src/controllers/v1.0/adminController.js` y agregar:

```javascript
const { ReciboTemplate, Usuario } = require('../../models');
const {
  validateTemplate,
  getAllPlaceholders,
  placeholders,
} = require('../../utils/validators/templateValidator');
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const purify = DOMPurify(window);

// GET /api/admin/recibos/templates/active
exports.getActiveTemplate = async (req, res) => {
  try {
    const template = await ReciboTemplate.findOne({
      where: { activo: true },
      include: [
        { as: 'creator', attributes: ['id', 'nombre'] },
        { as: 'updater', attributes: ['id', 'nombre'] },
      ],
    });

    if (!template) {
      return res.status(404).json({
        error: 'No active template found',
      });
    }

    return res.json({
      id: template.id,
      nombre: template.nombre,
      html: template.html,
      pageSize: template.pageSize,
      orientation: template.orientation,
      margins: template.margins,
      activo: template.activo,
      templateGroupId: template.templateGroupId,
      versionNumber: template.versionNumber,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      createdBy: template.creator,
      updatedBy: template.updater,
    });
  } catch (error) {
    console.error('Error fetching active template:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/admin/recibos/placeholders
exports.getPlaceholders = async (req, res) => {
  try {
    const result = {
      categories: {
        recibo: placeholders.recibo.map((p) => ({
          placeholder: `{{${p}}}`,
          label: p.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        })),
        monetarios: placeholders.monetarios.map((p) => ({
          placeholder: `{{${p}}}`,
          label: p.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        })),
      },
    };
    return res.json(result);
  } catch (error) {
    console.error('Error fetching placeholders:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/admin/recibos/templates/save
exports.saveTemplate = async (req, res) => {
  try {
    const { id, html, pageSize, orientation, margins, saveMode } = req.body;
    const userId = req.user.id;

    // Validar entrada
    const validationErrors = validateTemplate({
      html,
      pageSize,
      orientation,
      margins,
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validationErrors,
      });
    }

    // Sanitizar HTML
    const sanitizedHtml = purify.sanitize(html);

    if (saveMode === 'overwrite') {
      // Sobrescribir template existente
      const template = await ReciboTemplate.findByPk(id);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      template.html = sanitizedHtml;
      template.pageSize = pageSize;
      template.orientation = orientation;
      template.margins = margins;
      template.updatedBy = userId;

      await template.save();

      const updated = await template.reload({
        include: [
          { as: 'creator', attributes: ['id', 'nombre'] },
          { as: 'updater', attributes: ['id', 'nombre'] },
        ],
      });

      return res.json({
        success: true,
        templateId: template.id,
        versionNumber: template.versionNumber,
        message: 'Template actualizado',
        template: {
          id: updated.id,
          nombre: updated.nombre,
          html: updated.html,
          pageSize: updated.pageSize,
          orientation: updated.orientation,
          margins: updated.margins,
          activo: updated.activo,
          templateGroupId: updated.templateGroupId,
          versionNumber: updated.versionNumber,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
          createdBy: updated.creator,
          updatedBy: updated.updater,
        },
      });
    } else if (saveMode === 'new_version') {
      // Crear nueva versión y desactivar anteriores
      const currentTemplate = await ReciboTemplate.findByPk(id);
      if (!currentTemplate) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const templateGroupId = currentTemplate.templateGroupId || id;
      const nextVersion =
        (await ReciboTemplate.max('versionNumber', {
          where: { templateGroupId },
        })) + 1;

      // Desactivar todas las versiones del grupo
      await ReciboTemplate.update(
        { activo: false },
        { where: { templateGroupId } }
      );

      // Crear nueva versión
      const newTemplate = await ReciboTemplate.create({
        nombre: currentTemplate.nombre,
        html: sanitizedHtml,
        pageSize,
        orientation,
        margins,
        activo: true,
        templateGroupId,
        versionNumber: nextVersion,
        createdBy: userId,
        updatedBy: userId,
      });

      const created = await newTemplate.reload({
        include: [
          { as: 'creator', attributes: ['id', 'nombre'] },
          { as: 'updater', attributes: ['id', 'nombre'] },
        ],
      });

      return res.status(201).json({
        success: true,
        templateId: newTemplate.id,
        versionNumber: newTemplate.versionNumber,
        message: `Nueva versión v${nextVersion} creada y establecida como activa`,
        template: {
          id: created.id,
          nombre: created.nombre,
          html: created.html,
          pageSize: created.pageSize,
          orientation: created.orientation,
          margins: created.margins,
          activo: created.activo,
          templateGroupId: created.templateGroupId,
          versionNumber: created.versionNumber,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
          createdBy: created.creator,
          updatedBy: created.updater,
        },
      });
    } else {
      return res.status(400).json({
        error: 'saveMode debe ser "overwrite" o "new_version"',
      });
    }
  } catch (error) {
    console.error('Error saving template:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/admin/recibos/templates/versions
exports.getVersions = async (req, res) => {
  try {
    const { templateGroupId } = req.query;

    if (!templateGroupId) {
      return res.status(400).json({ error: 'templateGroupId is required' });
    }

    const versions = await ReciboTemplate.findAll({
      where: { templateGroupId },
      attributes: [
        'id',
        'versionNumber',
        'nombre',
        'activo',
        'createdAt',
        'updatedAt',
      ],
      order: [['versionNumber', 'ASC']],
    });

    return res.json({
      templateGroupId,
      versions,
    });
  } catch (error) {
    console.error('Error fetching versions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
```

#### **Paso 3.2: Instalar dependencias faltantes**

- [ ] Verificar que `dompurify` y `jsdom` estén en `backend/package.json`. Si no:

```bash
cd backend
npm install dompurify jsdom
```

#### **Paso 3.3: Agregar rutas en admin.routes.js**

- [ ] Abrir `backend/src/routes/v1.0/admin.routes.js` y agregar (si no existen):

```javascript
const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/v1.0/adminController');
const { authMiddleware } = require('../../middleware/auth');
const { adminOnly } = require('../../middleware/authorize');

// Todas las rutas requieren auth + admin
router.use(authMiddleware);
router.use(adminOnly);

// Rutas de templates de recibos
router.get('/recibos/templates/active', adminController.getActiveTemplate);
router.get('/recibos/templates/versions', adminController.getVersions);
router.get('/recibos/placeholders', adminController.getPlaceholders);
router.post('/recibos/templates/save', adminController.saveTemplate);

module.exports = router;
```

#### **Paso 3.4: Registrar rutas en index.js**

- [ ] Verificar que en `backend/src/index.js` esté registrada:

```javascript
const adminRoutes = require('./routes/v1.0/admin.routes');
app.use('/api/admin', adminRoutes);
```

#### **Paso 3.5: Commit**

- [ ] Hacer commit:

```bash
git add backend/src/controllers/v1.0/adminController.js
git add backend/src/routes/v1.0/admin.routes.js
git add backend/package.json
git commit -m "feat(BACKLOG-081): crear endpoints de templates de recibos"
```

---

### Task 4: Crear Store Zustand

**Files:**
- Create: `frontend/src/stores/reciboDesigner.store.js`

#### **Paso 4.1: Crear store**

- [ ] Crear `frontend/src/stores/reciboDesigner.store.js`:

```javascript
import { create } from 'zustand';

// Función auxiliar: convertir HTML simple a estructura grid
const parseHTMLtoGrid = (html) => {
  if (!html || typeof html !== 'string') return getEmptyGrid();

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('table');

    if (!table) return getEmptyGrid();

    const rows = [];
    table.querySelectorAll('tr').forEach((trElement) => {
      const cells = [];
      trElement.querySelectorAll('td, th').forEach((tdElement) => {
        cells.push({
          content: tdElement.textContent.trim(),
          colspan: parseInt(tdElement.getAttribute('colspan') || 1),
        });
      });
      rows.push({ cells });
    });

    return rows.length > 0 ? rows : getEmptyGrid();
  } catch (error) {
    console.error('Error parsing HTML:', error);
    return getEmptyGrid();
  }
};

// Función auxiliar: generar grid vacío
const getEmptyGrid = () => {
  return [
    { cells: Array(3).fill(null).map(() => ({ content: '', colspan: 1 })) },
    { cells: Array(3).fill(null).map(() => ({ content: '', colspan: 1 })) },
    { cells: Array(3).fill(null).map(() => ({ content: '', colspan: 1 })) },
  ];
};

// Función auxiliar: convertir grid a HTML
const gridToHTML = (grid) => {
  let html = '<table>\n';
  grid.forEach((row) => {
    html += '  <tr>\n';
    row.cells.forEach((cell) => {
      const colspanAttr = cell.colspan > 1 ? ` colspan="${cell.colspan}"` : '';
      html += `    <td${colspanAttr}>${cell.content || ''}</td>\n`;
    });
    html += '  </tr>\n';
  });
  html += '</table>';
  return html;
};

export const useReciboDesignerStore = create((set, get) => ({
  // State
  grid: getEmptyGrid(),
  pageConfig: { size: 'A4', orientation: 'portrait', margins: 8 },
  currentTemplate: null,
  isSaving: false,
  error: null,

  // Actions
  loadTemplate: (template) =>
    set({
      currentTemplate: template,
      grid: parseHTMLtoGrid(template.html),
      pageConfig: {
        size: template.pageSize,
        orientation: template.orientation,
        margins: template.margins,
      },
      error: null,
    }),

  addRow: () =>
    set((state) => {
      const newRow = {
        cells: Array(state.grid[0]?.cells.length || 3)
          .fill(null)
          .map(() => ({ content: '', colspan: 1 })),
      };
      return { grid: [...state.grid, newRow] };
    }),

  deleteRow: () =>
    set((state) => {
      if (state.grid.length <= 1) return state;
      return { grid: state.grid.slice(0, -1) };
    }),

  addColumn: () =>
    set((state) => {
      return {
        grid: state.grid.map((row) => ({
          cells: [...row.cells, { content: '', colspan: 1 }],
        })),
      };
    }),

  deleteColumn: () =>
    set((state) => {
      if (state.grid[0]?.cells.length <= 1) return state;
      return {
        grid: state.grid.map((row) => ({
          cells: row.cells.slice(0, -1),
        })),
      };
    }),

  clearGrid: () =>
    set({
      grid: getEmptyGrid(),
    }),

  updateCell: (rowIdx, cellIdx, content, colspan) =>
    set((state) => {
      const newGrid = state.grid.map((row, rIdx) =>
        rIdx === rowIdx
          ? {
              cells: row.cells.map((cell, cIdx) =>
                cIdx === cellIdx
                  ? { content, colspan: parseInt(colspan) || 1 }
                  : cell
              ),
            }
          : row
      );
      return { grid: newGrid };
    }),

  setPageConfig: (config) =>
    set((state) => ({
      pageConfig: { ...state.pageConfig, ...config },
    })),

  generateHTML: () => {
    const { grid } = get();
    return gridToHTML(grid);
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  setSaving: (isSaving) => set({ isSaving }),
}));
```

#### **Paso 4.2: Commit**

- [ ] Hacer commit:

```bash
git add frontend/src/stores/reciboDesigner.store.js
git commit -m "feat(BACKLOG-081): crear store Zustand para table builder"
```

---

### Task 5: Crear Servicio API Frontend

**Files:**
- Create: `frontend/src/services/reciboDesignerService.js`

#### **Paso 5.1: Crear servicio**

- [ ] Crear `frontend/src/services/reciboDesignerService.js`:

```javascript
import { api } from './api';

export const reciboDesignerService = {
  getActiveTemplate: async () => {
    const response = await api.get('/admin/recibos/templates/active');
    return response.data;
  },

  getPlaceholders: async () => {
    const response = await api.get('/admin/recibos/placeholders');
    return response.data;
  },

  getVersions: async (templateGroupId) => {
    const response = await api.get('/admin/recibos/templates/versions', {
      params: { templateGroupId },
    });
    return response.data;
  },

  saveTemplate: async (templateData) => {
    const response = await api.post('/admin/recibos/templates/save', templateData);
    return response.data;
  },
};
```

#### **Paso 5.2: Commit**

- [ ] Hacer commit:

```bash
git add frontend/src/services/reciboDesignerService.js
git commit -m "feat(BACKLOG-081): crear servicio API para table builder"
```

---

### Task 6: Crear Componentes React - Parte 1: Utilidades

**Files:**
- Create: `frontend/src/components/ReciboDesigner/ReciboDesigner.scss`
- Create: `frontend/src/constants/placeholders.js`

#### **Paso 6.1: Crear constantes de placeholders**

- [ ] Crear `frontend/src/constants/placeholders.js`:

```javascript
export const PLACEHOLDER_CATEGORIES = {
  recibo: {
    label: 'Datos del Recibo',
    items: [
      'numero_recibo',
      'numero_afiliado',
      'periodo',
      'titular_apellido',
      'titular_nombre',
      'fecha_nacimiento',
      'fecha_cobertura',
      'numero_documento',
      'obra_social_nombre',
      'tipo_plan_nombre',
      'tipo_de_grupo_nombre',
      'domicilio',
      'localidad_nombre',
      'zona_codigo',
    ],
  },
  monetarios: {
    label: 'Valores Monetarios',
    items: [
      'valor_cuota',
      'cuota_social',
      'arancel_por_servicio',
      'arancel_negativo_class',
    ],
  },
};

export const formatPlaceholder = (name) => `{{${name}}}`;
```

#### **Paso 6.2: Crear estilos**

- [ ] Crear `frontend/src/components/ReciboDesigner/ReciboDesigner.scss`:

```scss
@import '../../styles/colors.scss';

.recibo-designer {
  display: flex;
  height: calc(100vh - 120px);
  gap: 20px;
  padding: 20px;
  background: $color-bg;

  &__toolbar {
    flex: 0 0 300px;
    border: 1px solid $color-border;
    border-radius: 4px;
    padding: 15px;
    overflow-y: auto;
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  &__preview {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  &__preview-container {
    flex: 1;
    border: 1px solid $color-border;
    border-radius: 4px;
    padding: 15px;
    background: white;
    overflow-y: auto;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  &__preview-html {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    line-height: 1.4;
    background: #f5f5f5;
    padding: 10px;
    border-radius: 3px;
  }

  &__controls {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  &__button {
    padding: 8px 12px;
    background: $color-primary;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: background 0.2s;

    &:hover:not(:disabled) {
      background: darken($color-primary, 10%);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &--secondary {
      background: $color-secondary;

      &:hover:not(:disabled) {
        background: darken($color-secondary, 10%);
      }
    }

    &--danger {
      background: #dc3545;

      &:hover:not(:disabled) {
        background: darken(#dc3545, 10%);
      }
    }
  }

  &__section {
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid $color-border;

    &:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
  }

  &__section-title {
    font-size: 12px;
    font-weight: 600;
    color: $color-text-secondary;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  &__editor-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;

    th {
      background: #f0f0f0;
      padding: 8px;
      text-align: left;
      font-weight: 600;
      border: 1px solid $color-border;
    }

    td {
      padding: 8px;
      border: 1px solid $color-border;
      input {
        width: 100%;
        padding: 4px;
        border: 1px solid $color-border;
        border-radius: 3px;
        font-size: 11px;
      }
    }
  }

  &__warning {
    background: #fff3cd;
    border: 1px solid #ffc107;
    color: #856404;
    padding: 10px;
    border-radius: 4px;
    font-size: 12px;
    margin-bottom: 10px;
  }

  &__error {
    background: #f8d7da;
    border: 1px solid #f5c6cb;
    color: #721c24;
    padding: 10px;
    border-radius: 4px;
    font-size: 12px;
    margin-bottom: 10px;
  }

  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 14px;
    color: $color-text-secondary;
  }
}
```

#### **Paso 6.3: Commit**

- [ ] Hacer commit:

```bash
git add frontend/src/components/ReciboDesigner/ReciboDesigner.scss
git add frontend/src/constants/placeholders.js
git commit -m "feat(BACKLOG-081): crear estilos y constantes para table builder"
```

---

### Task 7: Crear Componentes React - Parte 2: StructureControls

**Files:**
- Create: `frontend/src/components/ReciboDesigner/StructureControls.jsx`

#### **Paso 7.1: Crear componente**

- [ ] Crear `frontend/src/components/ReciboDesigner/StructureControls.jsx`:

```javascript
import React from 'react';
import { useReciboDesignerStore } from '../../stores/reciboDesigner.store';

export const StructureControls = () => {
  const { grid, addRow, deleteRow, addColumn, deleteColumn, clearGrid } =
    useReciboDesignerStore();

  const handleDeleteRow = () => {
    if (window.confirm('¿Eliminar última fila?')) {
      deleteRow();
    }
  };

  const handleDeleteColumn = () => {
    if (window.confirm('¿Eliminar última columna?')) {
      deleteColumn();
    }
  };

  const handleClearGrid = () => {
    if (window.confirm('¿Limpiar tabla? Esta acción no se puede deshacer.')) {
      clearGrid();
    }
  };

  return (
    <div className="recibo-designer__section">
      <h3 className="recibo-designer__section-title">Estructura</h3>
      <div className="recibo-designer__controls">
        <button className="recibo-designer__button" onClick={addRow}>
          + Fila
        </button>
        <button
          className="recibo-designer__button recibo-designer__button--danger"
          onClick={handleDeleteRow}
          disabled={grid.length <= 1}
        >
          - Fila
        </button>
        <button className="recibo-designer__button" onClick={addColumn}>
          + Columna
        </button>
        <button
          className="recibo-designer__button recibo-designer__button--danger"
          onClick={handleDeleteColumn}
          disabled={grid[0]?.cells.length <= 1}
        >
          - Columna
        </button>
        <button
          className="recibo-designer__button recibo-designer__button--danger"
          onClick={handleClearGrid}
        >
          Limpiar
        </button>
      </div>
    </div>
  );
};
```

#### **Paso 7.2: Commit**

- [ ] Hacer commit:

```bash
git add frontend/src/components/ReciboDesigner/StructureControls.jsx
git commit -m "feat(BACKLOG-081): crear componente StructureControls"
```

---

### Task 8: Crear Componentes React - Parte 3: PlaceholderSelector

**Files:**
- Create: `frontend/src/components/ReciboDesigner/PlaceholderSelector.jsx`

#### **Paso 8.1: Crear componente**

- [ ] Crear `frontend/src/components/ReciboDesigner/PlaceholderSelector.jsx`:

```javascript
import React, { useState } from 'react';
import { PLACEHOLDER_CATEGORIES, formatPlaceholder } from '../../constants/placeholders';

export const PlaceholderSelector = ({ onCopy }) => {
  const [expandedCategory, setExpandedCategory] = useState('recibo');

  const handleCopy = (placeholder) => {
    const formatted = formatPlaceholder(placeholder);
    navigator.clipboard.writeText(formatted);
    if (onCopy) onCopy(formatted);
  };

  return (
    <div className="recibo-designer__section">
      <h3 className="recibo-designer__section-title">Placeholders</h3>
      {Object.entries(PLACEHOLDER_CATEGORIES).map(([key, category]) => (
        <div key={key} style={{ marginBottom: '10px' }}>
          <button
            className="recibo-designer__button recibo-designer__button--secondary"
            onClick={() =>
              setExpandedCategory(expandedCategory === key ? null : key)
            }
            style={{ width: '100%', textAlign: 'left' }}
          >
            {category.label}{' '}
            {expandedCategory === key ? '▼' : '▶'}
          </button>
          {expandedCategory === key && (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {category.items.map((item) => (
                <button
                  key={item}
                  onClick={() => handleCopy(item)}
                  style={{
                    padding: '6px',
                    background: '#f0f0f0',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '11px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.target.style.background = '#e0e0e0')}
                  onMouseLeave={(e) => (e.target.style.background = '#f0f0f0')}
                >
                  {formatPlaceholder(item)} (copiar)
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
```

#### **Paso 8.2: Commit**

- [ ] Hacer commit:

```bash
git add frontend/src/components/ReciboDesigner/PlaceholderSelector.jsx
git commit -m "feat(BACKLOG-081): crear componente PlaceholderSelector"
```

---

### Task 9: Crear Componentes React - Parte 4: InlineEditor

**Files:**
- Create: `frontend/src/components/ReciboDesigner/InlineEditor.jsx`

#### **Paso 9.1: Crear componente**

- [ ] Crear `frontend/src/components/ReciboDesigner/InlineEditor.jsx`:

```javascript
import React from 'react';
import { useReciboDesignerStore } from '../../stores/reciboDesigner.store';

export const InlineEditor = () => {
  const { grid, updateCell } = useReciboDesignerStore();

  return (
    <div className="recibo-designer__section">
      <h3 className="recibo-designer__section-title">Editor de Celdas</h3>
      <table className="recibo-designer__editor-table">
        <thead>
          <tr>
            <th>Fila</th>
            <th>Columna</th>
            <th>Contenido</th>
            <th>Colspan</th>
          </tr>
        </thead>
        <tbody>
          {grid.map((row, rowIdx) =>
            row.cells.map((cell, cellIdx) => (
              <tr key={`${rowIdx}-${cellIdx}`}>
                <td>{rowIdx + 1}</td>
                <td>{cellIdx + 1}</td>
                <td>
                  <input
                    type="text"
                    value={cell.content}
                    onChange={(e) =>
                      updateCell(rowIdx, cellIdx, e.target.value, cell.colspan)
                    }
                    placeholder="Texto o {{placeholder}}"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={cell.colspan}
                    onChange={(e) =>
                      updateCell(rowIdx, cellIdx, cell.content, e.target.value)
                    }
                    min="1"
                    max="10"
                    style={{ width: '50px' }}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
```

#### **Paso 9.2: Commit**

- [ ] Hacer commit:

```bash
git add frontend/src/components/ReciboDesigner/InlineEditor.jsx
git commit -m "feat(BACKLOG-081): crear componente InlineEditor"
```

---

### Task 10: Crear Componentes React - Parte 5: ReciboPreview y PageControls

**Files:**
- Create: `frontend/src/components/ReciboDesigner/ReciboPreview.jsx`
- Create: `frontend/src/components/ReciboDesigner/PageControls.jsx`

#### **Paso 10.1: Crear ReciboPreview.jsx**

- [ ] Crear `frontend/src/components/ReciboDesigner/ReciboPreview.jsx`:

```javascript
import React, { useMemo } from 'react';
import { useReciboDesignerStore } from '../../stores/reciboDesigner.store';

export const ReciboPreview = () => {
  const { grid, generateHTML, pageConfig } = useReciboDesignerStore();

  const html = useMemo(() => generateHTML(), [grid]);

  const getPageSize = () => {
    const sizes = {
      A4: '210mm x 297mm',
      A5: '148mm x 210mm',
      Carta: '216mm x 279mm',
      Personalizado: 'Personalizado',
    };
    return sizes[pageConfig.size] || sizes.A4;
  };

  return (
    <div className="recibo-designer__preview-container">
      <h3 className="recibo-designer__section-title">Vista Previa</h3>
      <div
        style={{
          background: pageConfig.orientation === 'landscape' ? '#eee' : '#fff',
          padding: `${pageConfig.margins}mm`,
          margin: '10px auto',
          maxWidth: pageConfig.orientation === 'landscape' ? '297mm' : '210mm',
          minHeight: pageConfig.orientation === 'landscape' ? '210mm' : '297mm',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #ddd',
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <div style={{ marginTop: '10px', fontSize: '11px', color: '#666' }}>
        {getPageSize()} - {pageConfig.orientation === 'landscape' ? 'Horizontal' : 'Vertical'} - Márgenes: {pageConfig.margins}mm
      </div>
    </div>
  );
};
```

#### **Paso 10.2: Crear PageControls.jsx**

- [ ] Crear `frontend/src/components/ReciboDesigner/PageControls.jsx`:

```javascript
import React from 'react';
import { useReciboDesignerStore } from '../../stores/reciboDesigner.store';

export const PageControls = () => {
  const { pageConfig, setPageConfig } = useReciboDesignerStore();

  return (
    <div className="recibo-designer__section">
      <h3 className="recibo-designer__section-title">Configuración de Página</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
            Tamaño:
          </label>
          <select
            value={pageConfig.size}
            onChange={(e) => setPageConfig({ size: e.target.value })}
            style={{ width: '100%', padding: '6px', borderRadius: '3px', border: '1px solid #ddd' }}
          >
            <option value="A4">A4</option>
            <option value="A5">A5</option>
            <option value="Carta">Carta</option>
            <option value="Personalizado">Personalizado</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
            Orientación:
          </label>
          <select
            value={pageConfig.orientation}
            onChange={(e) => setPageConfig({ orientation: e.target.value })}
            style={{ width: '100%', padding: '6px', borderRadius: '3px', border: '1px solid #ddd' }}
          >
            <option value="portrait">Vertical</option>
            <option value="landscape">Horizontal</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
            Márgenes (mm):
          </label>
          <input
            type="number"
            value={pageConfig.margins}
            onChange={(e) => setPageConfig({ margins: Math.max(0, Math.min(50, parseInt(e.target.value) || 0)) })}
            min="0"
            max="50"
            style={{ width: '100%', padding: '6px', borderRadius: '3px', border: '1px solid #ddd' }}
          />
        </div>
      </div>
    </div>
  );
};
```

#### **Paso 10.3: Commit**

- [ ] Hacer commit:

```bash
git add frontend/src/components/ReciboDesigner/ReciboPreview.jsx
git add frontend/src/components/ReciboDesigner/PageControls.jsx
git commit -m "feat(BACKLOG-081): crear componentes ReciboPreview y PageControls"
```

---

### Task 11: Crear Componentes React - Parte 6: SaveActions

**Files:**
- Create: `frontend/src/components/ReciboDesigner/SaveActions.jsx`

#### **Paso 11.1: Crear componente**

- [ ] Crear `frontend/src/components/ReciboDesigner/SaveActions.jsx`:

```javascript
import React, { useState } from 'react';
import { useReciboDesignerStore } from '../../stores/reciboDesigner.store';
import { reciboDesignerService } from '../../services/reciboDesignerService';

export const SaveActions = () => {
  const {
    grid,
    pageConfig,
    currentTemplate,
    generateHTML,
    setSaving,
    isSaving,
    error,
    setError,
    loadTemplate,
  } = useReciboDesignerStore();

  const [showVersionModal, setShowVersionModal] = useState(false);

  const handleSave = async (saveMode) => {
    if (!currentTemplate) {
      setError('No hay template cargado');
      return;
    }

    if (grid.length === 0 || !grid.some((row) => row.cells.some((cell) => cell.content))) {
      setError('La tabla no puede estar vacía');
      return;
    }

    setSaving(true);
    try {
      const html = generateHTML();
      const response = await reciboDesignerService.saveTemplate({
        id: currentTemplate.id,
        html,
        pageSize: pageConfig.size,
        orientation: pageConfig.orientation,
        margins: pageConfig.margins,
        saveMode,
      });

      if (response.success) {
        loadTemplate(response.template);
        setError(null);
        alert(response.message);
      } else {
        setError('Error al guardar template');
      }
    } catch (err) {
      setError(
        err.response?.data?.details?.[0] || 'Error al guardar template'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const html = generateHTML();
    const element = document.createElement('a');
    const file = new Blob([html], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `recibo_template_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyToClipboard = async () => {
    const html = generateHTML();
    try {
      await navigator.clipboard.writeText(html);
      alert('HTML copiado al portapapeles');
    } catch {
      alert('Error al copiar');
    }
  };

  return (
    <div className="recibo-designer__section">
      <h3 className="recibo-designer__section-title">Acciones</h3>
      {error && <div className="recibo-designer__error">{error}</div>}
      <div className="recibo-designer__controls" style={{ flexDirection: 'column' }}>
        <button
          className="recibo-designer__button"
          onClick={() => handleSave('overwrite')}
          disabled={isSaving}
          style={{ width: '100%' }}
        >
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          className="recibo-designer__button recibo-designer__button--secondary"
          onClick={() => setShowVersionModal(true)}
          style={{ width: '100%' }}
        >
          Guardar como nueva versión
        </button>
        <button
          className="recibo-designer__button"
          onClick={handleExport}
          style={{ width: '100%' }}
        >
          Exportar HTML
        </button>
        <button
          className="recibo-designer__button recibo-designer__button--secondary"
          onClick={handleCopyToClipboard}
          style={{ width: '100%' }}
        >
          Copiar al portapapeles
        </button>
      </div>

      {showVersionModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '400px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <h3>Guardar como nueva versión</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
              Se creará una nueva versión de este template y se establecerá como activa.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="recibo-designer__button recibo-designer__button--secondary"
                onClick={() => setShowVersionModal(false)}
              >
                Cancelar
              </button>
              <button
                className="recibo-designer__button"
                onClick={() => {
                  handleSave('new_version');
                  setShowVersionModal(false);
                }}
              >
                Crear versión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

#### **Paso 11.2: Commit**

- [ ] Hacer commit:

```bash
git add frontend/src/components/ReciboDesigner/SaveActions.jsx
git commit -m "feat(BACKLOG-081): crear componente SaveActions"
```

---

### Task 12: Crear Componentes React - Parte 7: ReciboDesignerToolbar

**Files:**
- Create: `frontend/src/components/ReciboDesigner/ReciboDesignerToolbar.jsx`

#### **Paso 12.1: Crear componente**

- [ ] Crear `frontend/src/components/ReciboDesigner/ReciboDesignerToolbar.jsx`:

```javascript
import React from 'react';
import { StructureControls } from './StructureControls';
import { PlaceholderSelector } from './PlaceholderSelector';
import { InlineEditor } from './InlineEditor';
import { PageControls } from './PageControls';
import { SaveActions } from './SaveActions';

export const ReciboDesignerToolbar = () => {
  return (
    <div className="recibo-designer__toolbar">
      <h2 style={{ fontSize: '14px', marginBottom: '15px', color: '#333' }}>
        Herramientas
      </h2>
      <StructureControls />
      <PlaceholderSelector />
      <PageControls />
      <SaveActions />
      <InlineEditor />
    </div>
  );
};
```

#### **Paso 12.2: Commit**

- [ ] Hacer commit:

```bash
git add frontend/src/components/ReciboDesigner/ReciboDesignerToolbar.jsx
git commit -m "feat(BACKLOG-081): crear componente ReciboDesignerToolbar"
```

---

### Task 13: Crear Página Principal ReciboDesignerPage

**Files:**
- Create: `frontend/src/pages/AdminPanel/ReciboDesignerPage.jsx`

#### **Paso 13.1: Crear página**

- [ ] Crear `frontend/src/pages/AdminPanel/ReciboDesignerPage.jsx`:

```javascript
import React, { useEffect, useState } from 'react';
import { useReciboDesignerStore } from '../../stores/reciboDesigner.store';
import { reciboDesignerService } from '../../services/reciboDesignerService';
import { ReciboDesignerToolbar } from '../../components/ReciboDesigner/ReciboDesignerToolbar';
import { ReciboPreview } from '../../components/ReciboDesigner/ReciboPreview';
import '../../components/ReciboDesigner/ReciboDesigner.scss';

export const ReciboDesignerPage = () => {
  const { loadTemplate, error, setError } = useReciboDesignerStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActiveTemplate = async () => {
      try {
        const template = await reciboDesignerService.getActiveTemplate();
        loadTemplate(template);
        setError(null);
      } catch (err) {
        setError(
          err.response?.data?.error || 'Error al cargar template activo'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveTemplate();
  }, [loadTemplate, setError]);

  if (isLoading) {
    return (
      <div className="recibo-designer__loading">
        Cargando template activo...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Diseñador de Templates de Recibos</h1>
      {error && <div className="recibo-designer__error">{error}</div>}
      <div className="recibo-designer">
        <ReciboDesignerToolbar />
        <ReciboPreview />
      </div>
    </div>
  );
};
```

#### **Paso 13.2: Commit**

- [ ] Hacer commit:

```bash
git add frontend/src/pages/AdminPanel/ReciboDesignerPage.jsx
git commit -m "feat(BACKLOG-081): crear página ReciboDesignerPage"
```

---

### Task 14: Integrar en Rutas Admin

**Files:**
- Modify: `frontend/src/pages/DashboardPage/AdminPanel.jsx` (o ruta equivalente)

#### **Paso 14.1: Agregar ruta**

- [ ] Abrir archivo de rutas admin (típicamente en `frontend/src/pages/DashboardPage/AdminPanel.jsx` o similar):

```javascript
// En el componente AdminPanel, agregar a las rutas/secciones:

import { ReciboDesignerPage } from '../AdminPanel/ReciboDesignerPage';

// En el JSX, agregar:
<Link to="/admin/recibo-designer" className="admin-nav__link">
  Diseñador de Recibos
</Link>

// Y en React Router (si aplica):
<Route path="/admin/recibo-designer" element={<ReciboDesignerPage />} />
```

- [ ] Si se usa un archivo separado `AdminPanel.jsx`, asegurar que importe y declare la ruta para `/admin/recibo-designer`

#### **Paso 14.2: Commit**

- [ ] Hacer commit:

```bash
git add frontend/src/pages/DashboardPage/AdminPanel.jsx
git commit -m "feat(BACKLOG-081): integrar ReciboDesignerPage en rutas admin"
```

---

### Task 15: Testing y Ajustes Finales

**Files:**
- Manual testing

#### **Paso 15.1: Verificar que backend esté corriendo**

- [ ] En terminal backend:

```bash
cd backend
npm run dev
# Esperar mensaje: "Server running on http://localhost:5000"
```

#### **Paso 15.2: Verificar que frontend esté corriendo**

- [ ] En terminal frontend:

```bash
cd frontend
npm start
# Esperar que se abra http://localhost:3000
```

#### **Paso 15.3: Test 1 - Acceder a página**

- [ ] Navegar a `/admin/recibo-designer`
- [ ] Verificar que carga sin errores
- [ ] Verificar que template activo aparece en el editor

#### **Paso 15.4: Test 2 - Operaciones de tabla**

- [ ] Click "+ Fila" → debe agregar fila al final
- [ ] Click "+ Columna" → debe agregar columna a todas las filas
- [ ] Click "- Fila" con confirmación → debe eliminar última fila
- [ ] Vista previa actualiza automáticamente

#### **Paso 15.5: Test 3 - Editar celdas**

- [ ] Hacer click en campo de entrada en tabla InlineEditor
- [ ] Escribir texto → debe actualizar vista previa en tiempo real
- [ ] Copiar un placeholder → debe aparecer en portapapeles
- [ ] Pegar en campo de celda → debe mostrar en vista previa

#### **Paso 15.6: Test 4 - Guardar template**

- [ ] Hacer cambios en template
- [ ] Click "Guardar" → debe mostrar confirmación "Template actualizado"
- [ ] Recargar página → cambios deben persistir

#### **Paso 15.7: Test 5 - Nueva versión**

- [ ] Hacer cambios adicionales
- [ ] Click "Guardar como nueva versión" → debe crear versión v2
- [ ] Verificar en BD que versión anterior está `activo = false`
- [ ] Nueva versión debe estar `activo = true`

#### **Paso 15.8: Test 6 - Exportar HTML**

- [ ] Click "Exportar HTML" → debe descargar archivo `.html`
- [ ] Abrir en navegador → debe mostrar tabla renderizada

#### **Paso 15.9: Revisar consola**

- [ ] Abrir DevTools (F12)
- [ ] Verificar que no hay errores en Console
- [ ] Verificar Network tab → todas las llamadas API retornan 200

#### **Paso 15.10: Commit**

- [ ] Hacer commit final:

```bash
git add .
git commit -m "feat(BACKLOG-081): testing y ajustes finales table builder"
```

---

## Consideraciones de Implementación

### Performance
- Store Zustand es ligero y rápido
- HTML generation en cada cambio puede ser costoso con grillas grandes → considerar debouncing en versión futura
- Memoizar `ReciboPreview` para evitar re-renders innecesarios

### Escalabilidad
- Arquitectura permite múltiples templates y versiones
- BD con `template_group_id` permite historial completo
- Auditoría con `created_by`, `updated_by` rastreable

### Seguridad
- XSS: DOMPurify sanitiza HTML antes de guardar
- SQL: Sequelize prepared statements
- Auth: Middleware `authMiddleware` + `adminOnly` en todas rutas `/api/admin/*`

---

## Plan Completo

**Total de tareas:** 15  
**Estimación:** ~10-12 horas de desarrollo

| Tarea | Componente | Tiempo Est. |
|-------|-----------|------------|
| 1 | Modelo de datos + migrations | 1 hora |
| 2 | Validador | 30 min |
| 3 | Endpoints backend | 1.5 horas |
| 4 | Store Zustand | 45 min |
| 5 | Servicio API frontend | 15 min |
| 6 | Estilos + constantes | 30 min |
| 7-12 | Componentes React (6 tareas) | 3.5 horas |
| 13 | Página principal | 30 min |
| 14 | Integración en rutas | 15 min |
| 15 | Testing y ajustes | 1.5 horas |
| **TOTAL** | | **~10 horas** |

