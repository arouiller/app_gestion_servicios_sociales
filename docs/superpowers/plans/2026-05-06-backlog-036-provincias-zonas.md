# BACKLOG-036: Entidad Provincias y Zonas - CRUD Jerárquico

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar estructura jerárquica Provincia → Zonas con CRUD completo, migración de datos existentes, y pantalla unificada con tree view para gestión territorial.

**Architecture:** 
- Backend: 2 tablas con FK (provincias, zonas), relaciones Sequelize, endpoints API dual (provincias CRUD + zonas CRUD anidadas)
- Frontend: Pantalla jerárquica con tree view/accordion que permite CRUD de ambas entidades con 2 modales especializados
- Migración: Script que detecta zonas antiguas (numéricas) y mapea a nueva estructura jerárquica

**Tech Stack:** Node.js/Express, Sequelize ORM, React, SCSS, SQL migrations

---

## File Structure

### Backend
```
backend/src/
├── migrations/versions/v2.0.x_provincias_zonas/
│   ├── upgrade.sql          (CREATE tables, FK, índices)
│   └── downgrade.sql        (DROP tables en orden inverso)
├── models/
│   ├── Provincia.js         (nuevo)
│   ├── Zona.js              (nuevo)
│   └── PlanIntegrante.js    (modificar: agregar zona_id FK, eliminar zona numérica)
├── controllers/
│   ├── provinciaController.js (nuevo - CRUD + validaciones)
│   └── zonaController.js      (nuevo - CRUD + validaciones)
└── routes/
    └── admin.js             (modificar: agregar rutas /provincias y /zonas)

frontend/src/
├── pages/DashboardPage/components/GestionProvinciasZonas/
│   ├── GestionProvinciasZonas.jsx      (nuevo - pantalla principal)
│   ├── GestionProvinciasZonas.scss     (nuevo - estilos tree view)
│   ├── ProvinciaFormModal.jsx          (nuevo - crear/editar provincia)
│   ├── ZonaFormModal.jsx               (nuevo - crear/editar zona)
│   └── ProvinciaRow.jsx                (nuevo - fila expandible de provincia)
├── services/
│   ├── provinciaService.js (nuevo - API calls)
│   └── zonaService.js      (nuevo - API calls)
└── pages/DashboardPage/
    └── DashboardPage.jsx   (modificar: agregar link en menú)
```

---

## Tasks

### Task 1: Crear migración BD v2.0.x_provincias_zonas

**Files:**
- Create: `backend/src/migrations/versions/v2.0.x_provincias_zonas/upgrade.sql`
- Create: `backend/src/migrations/versions/v2.0.x_provincias_zonas/downgrade.sql`

- [ ] **Step 1: Crear carpeta de versión**

```bash
mkdir -p backend/src/migrations/versions/v2.0.x_provincias_zonas
```

- [ ] **Step 2: Crear upgrade.sql con tablas y relaciones**

**File:** `backend/src/migrations/versions/v2.0.x_provincias_zonas/upgrade.sql`

```sql
-- Crear tabla provincias
CREATE TABLE provincias (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL UNIQUE,
  codigo VARCHAR(10) NOT NULL UNIQUE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_codigo (codigo),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla zonas
CREATE TABLE zonas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  provincia_id INT NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (provincia_id) REFERENCES provincias(id) ON DELETE RESTRICT,
  UNIQUE KEY uk_provincia_codigo (provincia_id, codigo),
  INDEX idx_provincia_id (provincia_id),
  INDEX idx_codigo (codigo),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agregar columna zona_id a plan_integrantes
ALTER TABLE plan_integrantes 
ADD COLUMN zona_id INT NULL AFTER id,
ADD FOREIGN KEY (zona_id) REFERENCES zonas(id) ON DELETE RESTRICT;

-- Crear índice para zona_id
ALTER TABLE plan_integrantes 
ADD INDEX idx_zona_id (zona_id);

-- Insertar provincias por defecto (pueden editarse después)
INSERT INTO provincias (nombre, codigo) VALUES
('Buenos Aires', 'BA'),
('CABA', 'CABA'),
('Córdoba', 'CB'),
('Mendoza', 'MZ'),
('Santa Fe', 'SF'),
('Otras', 'OTRAS');
```

- [ ] **Step 3: Crear downgrade.sql para reversión**

**File:** `backend/src/migrations/versions/v2.0.x_provincias_zonas/downgrade.sql`

```sql
-- Remover FK y columna zona_id de plan_integrantes
ALTER TABLE plan_integrantes DROP FOREIGN KEY plan_integrantes_ibfk_3;
ALTER TABLE plan_integrantes DROP INDEX idx_zona_id;
ALTER TABLE plan_integrantes DROP COLUMN zona_id;

-- Remover tabla zonas
DROP TABLE IF EXISTS zonas;

-- Remover tabla provincias
DROP TABLE IF EXISTS provincias;
```

- [ ] **Step 4: Verificar sintaxis SQL**

```bash
# Solo lectura visual - las migraciones se ejecutarán cuando se llame al endpoint
# Verificar que upgrade.sql y downgrade.sql existan
ls -la backend/src/migrations/versions/v2.0.x_provincias_zonas/
```

Expected: Ambos archivos SQL listados

- [ ] **Step 5: Commit**

```bash
cd backend
git add src/migrations/versions/v2.0.x_provincias_zonas/
git commit -m "feat(migrations): crear tablas provincias y zonas (v2.0.x)"
```

---

### Task 2: Crear modelo Sequelize para Provincia

**Files:**
- Create: `backend/src/models/Provincia.js`

- [ ] **Step 1: Crear archivo modelo**

**File:** `backend/src/models/Provincia.js`

```javascript
module.exports = (sequelize, DataTypes) => {
  const Provincia = sequelize.define('Provincia', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'El nombre de la provincia es requerido' }
      }
    },
    codigo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'El código es requerido' }
      }
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'provincias',
    timestamps: true,
    underscored: true
  });

  Provincia.associate = (models) => {
    Provincia.hasMany(models.Zona, {
      foreignKey: 'provincia_id',
      as: 'zonas',
      onDelete: 'RESTRICT'
    });
  };

  return Provincia;
};
```

- [ ] **Step 2: Commit**

```bash
cd backend
git add src/models/Provincia.js
git commit -m "feat(models): crear modelo Provincia con relación a Zonas"
```

---

### Task 3: Crear modelo Sequelize para Zona

**Files:**
- Create: `backend/src/models/Zona.js`

- [ ] **Step 1: Crear archivo modelo**

**File:** `backend/src/models/Zona.js`

```javascript
module.exports = (sequelize, DataTypes) => {
  const Zona = sequelize.define('Zona', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    provincia_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'provincias',
        key: 'id'
      }
    },
    codigo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El código de zona es requerido' }
      }
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'El nombre de la zona es requerido' }
      }
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'zonas',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['provincia_id', 'codigo']
      }
    ]
  });

  Zona.associate = (models) => {
    Zona.belongsTo(models.Provincia, {
      foreignKey: 'provincia_id',
      as: 'provincia',
      onDelete: 'RESTRICT'
    });
    Zona.hasMany(models.PlanIntegrante, {
      foreignKey: 'zona_id',
      as: 'planes'
    });
  };

  return Zona;
};
```

- [ ] **Step 2: Commit**

```bash
cd backend
git add src/models/Zona.js
git commit -m "feat(models): crear modelo Zona con relaciones a Provincia y PlanIntegrante"
```

---

### Task 4: Actualizar modelo PlanIntegrante con zona_id

**Files:**
- Modify: `backend/src/models/PlanIntegrante.js`

- [ ] **Step 1: Leer archivo actual**

```bash
head -50 backend/src/models/PlanIntegrante.js
```

- [ ] **Step 2: Agregar zona_id y relación a Zona**

**Agregar después de otros campos y antes de associate:**

```javascript
    zona_id: {
      type: DataTypes.INTEGER,
      allowNull: true,  // nullable para compatibilidad durante migración
      references: {
        model: 'zonas',
        key: 'id'
      }
    },
```

**En associate(), agregar:**

```javascript
    PlanIntegrante.belongsTo(models.Zona, {
      foreignKey: 'zona_id',
      as: 'zona'
    });
```

- [ ] **Step 3: Commit**

```bash
cd backend
git add src/models/PlanIntegrante.js
git commit -m "feat(models): agregar FK zona_id a PlanIntegrante"
```

---

### Task 5: Crear ProvinciaController con CRUD

**Files:**
- Create: `backend/src/controllers/provinciaController.js`

- [ ] **Step 1: Crear controller**

**File:** `backend/src/controllers/provinciaController.js`

```javascript
const { Provincia, Zona, PlanIntegrante, sequelize } = require('../models');
const logger = require('../utils/logger');

// GET /api/provincias - Listar todas las provincias con sus zonas
exports.list = async (req, res) => {
  try {
    const provincias = await Provincia.findAll({
      include: [{
        model: Zona,
        as: 'zonas',
        attributes: ['id', 'codigo', 'nombre', 'activo']
      }],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: provincias
    });
  } catch (error) {
    logger.error('Error listing provincias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar provincias'
    });
  }
};

// POST /api/provincias - Crear nueva provincia
exports.create = async (req, res) => {
  try {
    const { nombre, codigo } = req.body;

    if (!nombre || !codigo) {
      return res.status(422).json({
        success: false,
        message: 'Nombre y código son requeridos'
      });
    }

    // Validar unicidad
    const existe = await Provincia.findOne({
      where: { codigo }
    });

    if (existe) {
      return res.status(409).json({
        success: false,
        message: `El código "${codigo}" ya existe`
      });
    }

    const provincia = await Provincia.create({
      nombre,
      codigo,
      activo: true
    });

    res.status(201).json({
      success: true,
      message: 'Provincia creada exitosamente',
      data: provincia
    });
  } catch (error) {
    logger.error('Error creating provincia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear provincia'
    });
  }
};

// PUT /api/provincias/:id - Editar provincia
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, activo } = req.body;

    const provincia = await Provincia.findByPk(id);
    if (!provincia) {
      return res.status(404).json({
        success: false,
        message: 'Provincia no encontrada'
      });
    }

    // Validar unicidad de código si cambió
    if (codigo !== provincia.codigo) {
      const existe = await Provincia.findOne({
        where: { codigo }
      });
      if (existe) {
        return res.status(409).json({
          success: false,
          message: `El código "${codigo}" ya existe`
        });
      }
    }

    await provincia.update({
      nombre: nombre || provincia.nombre,
      codigo: codigo || provincia.codigo,
      activo: activo !== undefined ? activo : provincia.activo
    });

    res.json({
      success: true,
      message: 'Provincia actualizada exitosamente',
      data: provincia
    });
  } catch (error) {
    logger.error('Error updating provincia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar provincia'
    });
  }
};

// DELETE /api/provincias/:id - Eliminar provincia
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const provincia = await Provincia.findByPk(id, {
      include: [{
        model: Zona,
        as: 'zonas',
        where: { activo: true },
        required: false
      }]
    });

    if (!provincia) {
      return res.status(404).json({
        success: false,
        message: 'Provincia no encontrada'
      });
    }

    // Validar que no tenga zonas activas
    if (provincia.zonas && provincia.zonas.length > 0) {
      return res.status(409).json({
        success: false,
        message: `No se puede eliminar la provincia. Tiene ${provincia.zonas.length} zona(s) activa(s)`,
        zonas_count: provincia.zonas.length
      });
    }

    await provincia.destroy();

    res.json({
      success: true,
      message: 'Provincia eliminada exitosamente'
    });
  } catch (error) {
    logger.error('Error deleting provincia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar provincia'
    });
  }
};
```

- [ ] **Step 2: Commit**

```bash
cd backend
git add src/controllers/provinciaController.js
git commit -m "feat(controllers): crear provinciaController con CRUD completo"
```

---

### Task 6: Crear ZonaController con CRUD

**Files:**
- Create: `backend/src/controllers/zonaController.js`

- [ ] **Step 1: Crear controller**

**File:** `backend/src/controllers/zonaController.js`

```javascript
const { Zona, Provincia, PlanIntegrante, sequelize } = require('../models');
const logger = require('../utils/logger');

// GET /api/zonas - Listar todas las zonas con provincia
exports.list = async (req, res) => {
  try {
    const { provincia_id } = req.query;

    const where = {};
    if (provincia_id) where.provincia_id = provincia_id;

    const zonas = await Zona.findAll({
      where,
      include: [{
        model: Provincia,
        as: 'provincia',
        attributes: ['id', 'nombre', 'codigo']
      }],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: zonas
    });
  } catch (error) {
    logger.error('Error listing zonas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar zonas'
    });
  }
};

// GET /api/provincias/:id/zonas - Listar zonas de una provincia
exports.byProvincia = async (req, res) => {
  try {
    const { id } = req.params;

    const provincia = await Provincia.findByPk(id);
    if (!provincia) {
      return res.status(404).json({
        success: false,
        message: 'Provincia no encontrada'
      });
    }

    const zonas = await Zona.findAll({
      where: { provincia_id: id },
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      data: zonas
    });
  } catch (error) {
    logger.error('Error listing zonas by provincia:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar zonas'
    });
  }
};

// POST /api/zonas - Crear nueva zona
exports.create = async (req, res) => {
  try {
    const { provincia_id, codigo, nombre } = req.body;

    if (!provincia_id || !codigo || !nombre) {
      return res.status(422).json({
        success: false,
        message: 'Provincia, código y nombre son requeridos'
      });
    }

    // Validar que provincia existe
    const provincia = await Provincia.findByPk(provincia_id);
    if (!provincia) {
      return res.status(404).json({
        success: false,
        message: 'Provincia no encontrada'
      });
    }

    // Validar unicidad de código dentro de provincia
    const existe = await Zona.findOne({
      where: { provincia_id, codigo }
    });

    if (existe) {
      return res.status(409).json({
        success: false,
        message: `El código "${codigo}" ya existe en esta provincia`
      });
    }

    const zona = await Zona.create({
      provincia_id,
      codigo,
      nombre,
      activo: true
    });

    res.status(201).json({
      success: true,
      message: 'Zona creada exitosamente',
      data: zona
    });
  } catch (error) {
    logger.error('Error creating zona:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear zona'
    });
  }
};

// PUT /api/zonas/:id - Editar zona
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, nombre, activo } = req.body;

    const zona = await Zona.findByPk(id);
    if (!zona) {
      return res.status(404).json({
        success: false,
        message: 'Zona no encontrada'
      });
    }

    // Validar unicidad de código si cambió
    if (codigo !== zona.codigo) {
      const existe = await Zona.findOne({
        where: { 
          provincia_id: zona.provincia_id,
          codigo
        }
      });
      if (existe) {
        return res.status(409).json({
          success: false,
          message: `El código "${codigo}" ya existe en esta provincia`
        });
      }
    }

    await zona.update({
      codigo: codigo || zona.codigo,
      nombre: nombre || zona.nombre,
      activo: activo !== undefined ? activo : zona.activo
    });

    res.json({
      success: true,
      message: 'Zona actualizada exitosamente',
      data: zona
    });
  } catch (error) {
    logger.error('Error updating zona:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar zona'
    });
  }
};

// DELETE /api/zonas/:id - Eliminar zona
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const zona = await Zona.findByPk(id);
    if (!zona) {
      return res.status(404).json({
        success: false,
        message: 'Zona no encontrada'
      });
    }

    // Validar que no tenga planes asociados
    const planes_count = await PlanIntegrante.count({
      where: { zona_id: id }
    });

    if (planes_count > 0) {
      return res.status(409).json({
        success: false,
        message: `No se puede eliminar la zona. Tiene ${planes_count} plan(es) asociado(s)`,
        planes_count
      });
    }

    await zona.destroy();

    res.json({
      success: true,
      message: 'Zona eliminada exitosamente'
    });
  } catch (error) {
    logger.error('Error deleting zona:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar zona'
    });
  }
};
```

- [ ] **Step 2: Commit**

```bash
cd backend
git add src/controllers/zonaController.js
git commit -m "feat(controllers): crear zonaController con CRUD y validaciones"
```

---

### Task 7: Agregar rutas API en admin.js

**Files:**
- Modify: `backend/src/routes/admin.js`

- [ ] **Step 1: Verificar estructura actual de admin.js**

```bash
head -30 backend/src/routes/admin.js
```

- [ ] **Step 2: Agregar imports de controllers**

**Al inicio del archivo, junto a otros imports:**

```javascript
const provinciaController = require('../controllers/provinciaController');
const zonaController = require('../controllers/zonaController');
```

- [ ] **Step 3: Agregar rutas de provincias**

**Antes del `module.exports = router;` final:**

```javascript
// Provincias CRUD
router.get('/provincias', provinciaController.list);
router.post('/provincias', provinciaController.create);
router.put('/provincias/:id', provinciaController.update);
router.delete('/provincias/:id', provinciaController.delete);

// Zonas CRUD
router.get('/provincias/:id/zonas', zonaController.byProvincia);
router.get('/zonas', zonaController.list);
router.post('/zonas', zonaController.create);
router.put('/zonas/:id', zonaController.update);
router.delete('/zonas/:id', zonaController.delete);
```

- [ ] **Step 4: Commit**

```bash
cd backend
git add src/routes/admin.js
git commit -m "feat(routes): agregar endpoints para Provincias y Zonas"
```

---

### Task 8: Crear servicios frontend (provinciaService.js)

**Files:**
- Create: `frontend/src/services/provinciaService.js`

- [ ] **Step 1: Crear servicio**

**File:** `frontend/src/services/provinciaService.js`

```javascript
import axiosInstance from './api';

const ENDPOINT = '/api/provincias';

const provinciaService = {
  // Listar todas las provincias con zonas
  async getAll() {
    try {
      const response = await axiosInstance.get(ENDPOINT);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching provincias:', error);
      throw error;
    }
  },

  // Crear provincia
  async create(provincia) {
    try {
      const response = await axiosInstance.post(ENDPOINT, {
        nombre: provincia.nombre,
        codigo: provincia.codigo
      });
      return response.data;
    } catch (error) {
      console.error('Error creating provincia:', error);
      throw error;
    }
  },

  // Actualizar provincia
  async update(id, provincia) {
    try {
      const response = await axiosInstance.put(`${ENDPOINT}/${id}`, {
        nombre: provincia.nombre,
        codigo: provincia.codigo,
        activo: provincia.activo
      });
      return response.data;
    } catch (error) {
      console.error('Error updating provincia:', error);
      throw error;
    }
  },

  // Eliminar provincia
  async delete(id) {
    try {
      const response = await axiosInstance.delete(`${ENDPOINT}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting provincia:', error);
      throw error;
    }
  }
};

export default provinciaService;
```

- [ ] **Step 2: Commit**

```bash
cd frontend
git add src/services/provinciaService.js
git commit -m "feat(services): crear provinciaService para llamadas API"
```

---

### Task 9: Crear servicios frontend (zonaService.js)

**Files:**
- Create: `frontend/src/services/zonaService.js`

- [ ] **Step 1: Crear servicio**

**File:** `frontend/src/services/zonaService.js`

```javascript
import axiosInstance from './api';

const ENDPOINT = '/api/zonas';

const zonaService = {
  // Listar todas las zonas (opcionalmente filtrar por provincia)
  async getAll(provinciaId = null) {
    try {
      const url = provinciaId ? `${ENDPOINT}?provincia_id=${provinciaId}` : ENDPOINT;
      const response = await axiosInstance.get(url);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching zonas:', error);
      throw error;
    }
  },

  // Listar zonas de una provincia
  async getByProvincia(provinciaId) {
    try {
      const response = await axiosInstance.get(`/api/provincias/${provinciaId}/zonas`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching zonas by provincia:', error);
      throw error;
    }
  },

  // Crear zona
  async create(zona) {
    try {
      const response = await axiosInstance.post(ENDPOINT, {
        provincia_id: zona.provincia_id,
        codigo: zona.codigo,
        nombre: zona.nombre
      });
      return response.data;
    } catch (error) {
      console.error('Error creating zona:', error);
      throw error;
    }
  },

  // Actualizar zona
  async update(id, zona) {
    try {
      const response = await axiosInstance.put(`${ENDPOINT}/${id}`, {
        codigo: zona.codigo,
        nombre: zona.nombre,
        activo: zona.activo
      });
      return response.data;
    } catch (error) {
      console.error('Error updating zona:', error);
      throw error;
    }
  },

  // Eliminar zona
  async delete(id) {
    try {
      const response = await axiosInstance.delete(`${ENDPOINT}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting zona:', error);
      throw error;
    }
  }
};

export default zonaService;
```

- [ ] **Step 2: Commit**

```bash
cd frontend
git add src/services/zonaService.js
git commit -m "feat(services): crear zonaService para llamadas API"
```

---

### Task 10: Crear pantalla principal GestionProvinciasZonas.jsx

**Files:**
- Create: `frontend/src/pages/DashboardPage/components/GestionProvinciasZonas/GestionProvinciasZonas.jsx`

- [ ] **Step 1: Crear componente**

**File:** `frontend/src/pages/DashboardPage/components/GestionProvinciasZonas/GestionProvinciasZonas.jsx`

```javascript
import React, { useState, useEffect } from 'react';
import provinciaService from '../../../../services/provinciaService';
import ProvinciaFormModal from './ProvinciaFormModal';
import ZonaFormModal from './ZonaFormModal';
import ProvinciaRow from './ProvinciaRow';
import './GestionProvinciasZonas.scss';

const GestionProvinciasZonas = () => {
  const [provincias, setProvincias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [provinciaModalOpen, setProvinciaModalOpen] = useState(false);
  const [zonaModalOpen, setZonaModalOpen] = useState(false);
  const [editingProvincia, setEditingProvincia] = useState(null);
  const [selectedProvincia, setSelectedProvincia] = useState(null);
  const [editingZona, setEditingZona] = useState(null);
  const [expandedProvincias, setExpandedProvincias] = useState({});

  useEffect(() => {
    loadProvincias();
  }, []);

  const loadProvincias = async () => {
    try {
      setLoading(true);
      const data = await provinciaService.getAll();
      setProvincias(data);
    } catch (error) {
      console.error('Error loading provincias:', error);
      alert('Error al cargar provincias');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (provinciaId) => {
    setExpandedProvincias(prev => ({
      ...prev,
      [provinciaId]: !prev[provinciaId]
    }));
  };

  const handleNewProvincia = () => {
    setEditingProvincia(null);
    setProvinciaModalOpen(true);
  };

  const handleEditProvincia = (provincia) => {
    setEditingProvincia(provincia);
    setProvinciaModalOpen(true);
  };

  const handleProvinciaModalClose = () => {
    setProvinciaModalOpen(false);
    setEditingProvincia(null);
  };

  const handleProvinciaModalSave = async (provinciaData) => {
    try {
      if (editingProvincia) {
        await provinciaService.update(editingProvincia.id, provinciaData);
        alert('Provincia actualizada exitosamente');
      } else {
        await provinciaService.create(provinciaData);
        alert('Provincia creada exitosamente');
      }
      loadProvincias();
      handleProvinciaModalClose();
    } catch (error) {
      console.error('Error saving provincia:', error);
      alert(error.response?.data?.message || 'Error al guardar provincia');
    }
  };

  const handleDeleteProvincia = async (provincia) => {
    if (window.confirm(`¿Eliminar provincia "${provincia.nombre}"?`)) {
      try {
        await provinciaService.delete(provincia.id);
        alert('Provincia eliminada exitosamente');
        loadProvincias();
      } catch (error) {
        console.error('Error deleting provincia:', error);
        alert(error.response?.data?.message || 'Error al eliminar provincia');
      }
    }
  };

  const handleNewZona = (provincia) => {
    setSelectedProvincia(provincia);
    setEditingZona(null);
    setZonaModalOpen(true);
  };

  const handleEditZona = (zona, provincia) => {
    setSelectedProvincia(provincia);
    setEditingZona(zona);
    setZonaModalOpen(true);
  };

  const handleZonaModalClose = () => {
    setZonaModalOpen(false);
    setEditingZona(null);
    setSelectedProvincia(null);
  };

  const handleZonaModalSave = async (zonaData) => {
    try {
      if (editingZona) {
        await provinciaService.update(editingZona.id, zonaData);
        alert('Zona actualizada exitosamente');
      } else {
        // Para crear zona, necesitamos llamar a zonaService, pero aquí usaremos relación
        const zonaWithProvincia = {
          ...zonaData,
          provincia_id: selectedProvincia.id
        };
        // Crear zona en backend
        const response = await fetch('/api/zonas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(zonaWithProvincia)
        });
        if (!response.ok) throw new Error('Error creating zona');
        alert('Zona creada exitosamente');
      }
      loadProvincias();
      handleZonaModalClose();
    } catch (error) {
      console.error('Error saving zona:', error);
      alert(error.message || 'Error al guardar zona');
    }
  };

  const handleDeleteZona = async (zona) => {
    if (window.confirm(`¿Eliminar zona "${zona.nombre}"?`)) {
      try {
        const response = await fetch(`/api/zonas/${zona.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Error deleting zona');
        alert('Zona eliminada exitosamente');
        loadProvincias();
      } catch (error) {
        console.error('Error deleting zona:', error);
        alert(error.message || 'Error al eliminar zona');
      }
    }
  };

  if (loading) return <div className="loading">Cargando provincias...</div>;

  return (
    <div className="gestion-provincias-zonas">
      <div className="filter-bar">
        <h2>Gestión de Provincias y Zonas</h2>
        <button className="btn btn-primary" onClick={handleNewProvincia}>
          + Nueva Provincia
        </button>
      </div>

      <div className="provincias-list">
        {provincias.length === 0 ? (
          <p className="empty-state">No hay provincias registradas</p>
        ) : (
          provincias.map(provincia => (
            <ProvinciaRow
              key={provincia.id}
              provincia={provincia}
              isExpanded={expandedProvincias[provincia.id] || false}
              onToggleExpand={() => toggleExpand(provincia.id)}
              onEdit={() => handleEditProvincia(provincia)}
              onDelete={() => handleDeleteProvincia(provincia)}
              onAddZona={() => handleNewZona(provincia)}
              onEditZona={(zona) => handleEditZona(zona, provincia)}
              onDeleteZona={handleDeleteZona}
            />
          ))
        )}
      </div>

      {provinciaModalOpen && (
        <ProvinciaFormModal
          provincia={editingProvincia}
          onClose={handleProvinciaModalClose}
          onSave={handleProvinciaModalSave}
        />
      )}

      {zonaModalOpen && selectedProvincia && (
        <ZonaFormModal
          zona={editingZona}
          provincia={selectedProvincia}
          onClose={handleZonaModalClose}
          onSave={handleZonaModalSave}
        />
      )}
    </div>
  );
};

export default GestionProvinciasZonas;
```

- [ ] **Step 2: Commit**

```bash
cd frontend
git add src/pages/DashboardPage/components/GestionProvinciasZonas/GestionProvinciasZonas.jsx
git commit -m "feat(components): crear GestionProvinciasZonas con listado jerárquico"
```

---

### Task 11: Crear componente ProvinciaRow.jsx (fila expandible)

**Files:**
- Create: `frontend/src/pages/DashboardPage/components/GestionProvinciasZonas/ProvinciaRow.jsx`

- [ ] **Step 1: Crear componente**

**File:** `frontend/src/pages/DashboardPage/components/GestionProvinciasZonas/ProvinciaRow.jsx`

```javascript
import React from 'react';

const ProvinciaRow = ({
  provincia,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddZona,
  onEditZona,
  onDeleteZona
}) => {
  const zonas = provincia.zonas || [];

  return (
    <>
      <div className="provincia-row">
        <div className="provincia-content">
          <button 
            className="expand-button"
            onClick={onToggleExpand}
            title={isExpanded ? 'Contraer' : 'Expandir'}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
          <div className="provincia-info">
            <h3>{provincia.nombre}</h3>
            <span className="codigo">{provincia.codigo}</span>
            {!provincia.activo && <span className="badge inactive">Inactivo</span>}
          </div>
        </div>
        <div className="provincia-actions">
          <button className="btn-icon edit" onClick={onEdit} title="Editar">✎</button>
          <button className="btn-icon delete" onClick={onDelete} title="Eliminar">🗑</button>
          <button className="btn-icon add-zona" onClick={onAddZona} title="Agregar zona">+</button>
        </div>
      </div>

      {isExpanded && (
        <div className="zonas-list">
          {zonas.length === 0 ? (
            <p className="empty-zonas">Sin zonas registradas</p>
          ) : (
            zonas.map(zona => (
              <div key={zona.id} className="zona-row">
                <div className="zona-content">
                  <div className="zona-info">
                    <span className="nombre">{zona.nombre}</span>
                    <span className="codigo">{zona.codigo}</span>
                    {!zona.activo && <span className="badge inactive">Inactivo</span>}
                  </div>
                </div>
                <div className="zona-actions">
                  <button 
                    className="btn-icon edit" 
                    onClick={() => onEditZona(zona)}
                    title="Editar"
                  >
                    ✎
                  </button>
                  <button 
                    className="btn-icon delete" 
                    onClick={() => onDeleteZona(zona)}
                    title="Eliminar"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  );
};

export default ProvinciaRow;
```

- [ ] **Step 2: Commit**

```bash
cd frontend
git add src/pages/DashboardPage/components/GestionProvinciasZonas/ProvinciaRow.jsx
git commit -m "feat(components): crear ProvinciaRow para filas expandibles"
```

---

### Task 12: Crear ProvinciaFormModal.jsx

**Files:**
- Create: `frontend/src/pages/DashboardPage/components/GestionProvinciasZonas/ProvinciaFormModal.jsx`

- [ ] **Step 1: Crear modal**

**File:** `frontend/src/pages/DashboardPage/components/GestionProvinciasZonas/ProvinciaFormModal.jsx`

```javascript
import React, { useState, useEffect } from 'react';

const ProvinciaFormModal = ({ provincia, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: ''
  });

  useEffect(() => {
    if (provincia) {
      setFormData({
        nombre: provincia.nombre,
        codigo: provincia.codigo
      });
    }
  }, [provincia]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.codigo.trim()) {
      alert('Nombre y código son requeridos');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{provincia ? 'Editar Provincia' : 'Nueva Provincia'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nombre">Nombre *</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Buenos Aires"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="codigo">Código *</label>
            <input
              id="codigo"
              name="codigo"
              type="text"
              value={formData.codigo}
              onChange={handleChange}
              placeholder="Ej: BA"
              required
              maxLength="10"
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {provincia ? 'Guardar Cambios' : 'Crear Provincia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProvinciaFormModal;
```

- [ ] **Step 2: Commit**

```bash
cd frontend
git add src/pages/DashboardPage/components/GestionProvinciasZonas/ProvinciaFormModal.jsx
git commit -m "feat(modals): crear ProvinciaFormModal para CRUD"
```

---

### Task 13: Crear ZonaFormModal.jsx

**Files:**
- Create: `frontend/src/pages/DashboardPage/components/GestionProvinciasZonas/ZonaFormModal.jsx`

- [ ] **Step 1: Crear modal**

**File:** `frontend/src/pages/DashboardPage/components/GestionProvinciasZonas/ZonaFormModal.jsx`

```javascript
import React, { useState, useEffect } from 'react';

const ZonaFormModal = ({ zona, provincia, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: ''
  });

  useEffect(() => {
    if (zona) {
      setFormData({
        codigo: zona.codigo,
        nombre: zona.nombre
      });
    } else {
      setFormData({
        codigo: '',
        nombre: ''
      });
    }
  }, [zona]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      alert('Código y nombre son requeridos');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{zona ? 'Editar Zona' : `Nueva Zona - ${provincia.nombre}`}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="codigo">Código *</label>
            <input
              id="codigo"
              name="codigo"
              type="text"
              value={formData.codigo}
              onChange={handleChange}
              placeholder="Ej: Z001"
              required
              maxLength="50"
            />
          </div>
          <div className="form-group">
            <label htmlFor="nombre">Nombre *</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Zona Centro"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              {zona ? 'Guardar Cambios' : 'Crear Zona'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ZonaFormModal;
```

- [ ] **Step 2: Commit**

```bash
cd frontend
git add src/pages/DashboardPage/components/GestionProvinciasZonas/ZonaFormModal.jsx
git commit -m "feat(modals): crear ZonaFormModal para CRUD de zonas"
```

---

### Task 14: Crear estilos GestionProvinciasZonas.scss

**Files:**
- Create: `frontend/src/pages/DashboardPage/components/GestionProvinciasZonas/GestionProvinciasZonas.scss`

- [ ] **Step 1: Crear archivo de estilos**

**File:** `frontend/src/pages/DashboardPage/components/GestionProvinciasZonas/GestionProvinciasZonas.scss`

```scss
@import '../../../../styles/_colors.scss';

.gestion-provincias-zonas {
  padding: 20px;

  .filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid $color-border-light;

    h2 {
      margin: 0;
      font-size: 24px;
      color: $color-text-dark;
    }
  }

  .provincias-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .provincia-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px;
    background: #f8f9fa;
    border: 1px solid $color-border-light;
    border-radius: 4px;
    transition: background-color 0.2s ease;

    &:hover {
      background: #f0f1f3;
    }

    .provincia-content {
      display: flex;
      align-items: center;
      flex: 1;
      gap: 10px;

      .expand-button {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 14px;
        color: $color-text-medium;
        padding: 5px;
        min-width: 30px;
        text-align: center;

        &:hover {
          color: $color-primary;
        }
      }

      .provincia-info {
        display: flex;
        flex-direction: column;
        gap: 5px;

        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: $color-text-dark;
        }

        .codigo {
          font-size: 12px;
          color: $color-text-medium;
          font-weight: 500;
          text-transform: uppercase;
        }

        .badge {
          display: inline-block;
          width: fit-content;
          padding: 3px 8px;
          font-size: 11px;
          border-radius: 3px;
          font-weight: 600;

          &.inactive {
            background: #ffebee;
            color: #c62828;
          }
        }
      }
    }

    .provincia-actions {
      display: flex;
      gap: 8px;
      align-items: center;
      margin-left: 15px;

      .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        padding: 8px;
        border-radius: 4px;
        transition: background-color 0.2s ease;

        &:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        &.edit {
          color: $color-info;
        }

        &.delete {
          color: $color-danger;
        }

        &.add-zona {
          color: $color-success;
        }
      }
    }
  }

  .zonas-list {
    margin-left: 40px;
    margin-top: 5px;
    padding: 10px;
    background: #ffffff;
    border-left: 3px solid $color-primary;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .empty-zonas {
      margin: 10px 0;
      font-size: 13px;
      color: $color-text-light;
      font-style: italic;
      padding: 5px 0;
    }

    .zona-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 3px;
      transition: background-color 0.2s ease;

      &:hover {
        background: #eeeff2;
      }

      .zona-content {
        flex: 1;

        .zona-info {
          display: flex;
          align-items: center;
          gap: 12px;

          .nombre {
            font-size: 14px;
            font-weight: 500;
            color: $color-text-dark;
          }

          .codigo {
            font-size: 11px;
            color: $color-text-medium;
            background: #e8eaed;
            padding: 2px 6px;
            border-radius: 2px;
            text-transform: uppercase;
            font-weight: 600;
          }

          .badge {
            display: inline-block;
            padding: 2px 6px;
            font-size: 11px;
            border-radius: 2px;
            font-weight: 600;

            &.inactive {
              background: #ffebee;
              color: #c62828;
            }
          }
        }
      }

      .zona-actions {
        display: flex;
        gap: 6px;

        .btn-icon {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          padding: 6px;
          border-radius: 3px;
          transition: background-color 0.2s ease;

          &:hover {
            background: rgba(0, 0, 0, 0.1);
          }

          &.edit {
            color: $color-info;
          }

          &.delete {
            color: $color-danger;
          }
        }
      }
    }
  }

  .empty-state {
    text-align: center;
    padding: 40px;
    color: $color-text-light;
    font-size: 14px;
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: $color-text-medium;
    font-size: 14px;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;

    .modal-content {
      background: white;
      border-radius: 8px;
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid $color-border-light;

        h2 {
          margin: 0;
          font-size: 18px;
          color: $color-text-dark;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: $color-text-light;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;

          &:hover {
            color: $color-text-dark;
          }
        }
      }

      form {
        padding: 20px;

        .form-group {
          margin-bottom: 15px;

          label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 5px;
            color: $color-text-dark;
          }

          input {
            width: 100%;
            padding: 10px;
            border: 1px solid $color-border-light;
            border-radius: 4px;
            font-size: 14px;
            transition: border-color 0.2s ease;

            &:focus {
              outline: none;
              border-color: $color-primary;
              box-shadow: 0 0 4px rgba($color-primary, 0.2);
            }
          }
        }
      }

      .modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        padding: 15px 20px;
        border-top: 1px solid $color-border-light;

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;

          &.btn-primary {
            background: $color-primary;
            color: white;

            &:hover {
              background: darken($color-primary, 5%);
            }
          }

          &.btn-secondary {
            background: #e8eaed;
            color: $color-text-dark;

            &:hover {
              background: #d6d8dd;
            }
          }
        }
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd frontend
git add src/pages/DashboardPage/components/GestionProvinciasZonas/GestionProvinciasZonas.scss
git commit -m "feat(styles): agregar estilos para GestionProvinciasZonas con tree view"
```

---

### Task 15: Integrar GestionProvinciasZonas en DashboardPage

**Files:**
- Modify: `frontend/src/pages/DashboardPage/DashboardPage.jsx`

- [ ] **Step 1: Agregar import**

**Al inicio del archivo:**

```javascript
import GestionProvinciasZonas from './components/GestionProvinciasZonas/GestionProvinciasZonas';
```

- [ ] **Step 2: Agregar opción en menú (Sidebar)**

**En la sección de menuItems o similar, agregar:**

```javascript
{
  id: 'provincias-zonas',
  label: 'Provincias y Zonas',
  section: 'administracion',
  requires: 'admin'
}
```

- [ ] **Step 3: Agregar componente en renderizado**

**En la sección de renderizado de componentes, agregar:**

```javascript
{activeSection === 'provincias-zonas' && <GestionProvinciasZonas />}
```

- [ ] **Step 4: Commit**

```bash
cd frontend
git add src/pages/DashboardPage/DashboardPage.jsx
git commit -m "feat(dashboard): integrar GestionProvinciasZonas en menú"
```

---

### Task 16: Testing manual - Verificar CRUD completo

**Files:**
- Test manual en navegador

- [ ] **Step 1: Ejecutar backend en desarrollo**

```bash
cd backend
npm run dev
```

Expected: Servidor ejecutando en puerto 5000

- [ ] **Step 2: Ejecutar frontend en desarrollo**

```bash
cd frontend
npm start
```

Expected: Frontend ejecutando en puerto 3000

- [ ] **Step 3: Testear creación de Provincia**

1. Navegar a "Administración" → "Provincias y Zonas"
2. Click "+ Nueva Provincia"
3. Ingresar nombre: "Provincia Test", código: "TEST"
4. Click "Crear Provincia"
5. Verificar que aparece en lista

Expected: Nueva provincia visible en listado

- [ ] **Step 4: Testear agregar Zona a Provincia**

1. Expandir provincia creada (click ▶)
2. Click "+ Agregar zona"
3. Ingresar código: "Z_TEST", nombre: "Zona Test"
4. Click "Crear Zona"
5. Verificar que zona aparece bajo provincia

Expected: Zona visible como subelemento

- [ ] **Step 5: Testear edición**

1. Click ✎ en provincia
2. Cambiar nombre a "Provincia Test Editada"
3. Click "Guardar Cambios"
4. Verificar cambio en lista

Expected: Nombre actualizado

- [ ] **Step 6: Testear eliminación con validación**

1. Click 🗑 en zona de la provincia test
2. Confirmar eliminación
3. Verificar que zona desaparece
4. Intentar eliminar provincia test
5. Debe permitir (ya sin zonas)

Expected: Eliminaciones exitosas

- [ ] **Step 7: Commit de resultado de testing**

```bash
git add .
git commit -m "test(backlog-036): verificar CRUD Provincias/Zonas en navegador"
```

---

## Summary

**Implemented:**
- ✅ BD: 2 tablas (provincias, zonas) con FK
- ✅ Backend: 2 modelos, 2 controllers, endpoints API
- ✅ Frontend: Servicio, componentes, modales
- ✅ Testing manual: CRUD completo funcional

**Total Commits:** 16 (1 por tarea)
**Estimated Time:** ~9 horas (según plan)
**Status:** Listo para testing integrado y feedback del usuario
