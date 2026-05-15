# CRUD Entidades Lookup y Planes — Plan de Implementación

> **Para agentes automáticos:** REQUERIDO USO DE SUB-SKILL: Use superpowers:subagent-driven-development (recomendado) o superpowers:executing-plans para implementar este plan tarea por tarea. Los pasos usan sintaxis de checkbox (`- [ ]`) para rastrear el progreso.

**Objetivo:** Implementar los CRUD para las 5 entidades lookup (cobradores, tipos-de-plan, obras-sociales, servicios-adicionales, tipos-de-grupo), personas y planes. Incluyendo migraciones, modelos, controladores, rutas y componentes frontend.

**Arquitectura:** 
- **Backend:** Migraciones SQL, modelos Sequelize con associations, controller genérico parametrizado para lookup y controladores específicos para personas/planes.
- **Frontend:** Componente `LookupCRUD` reutilizable para las 5 entidades lookup, servicios API, páginas wrapper en dashboard, y formulario modal para planes.
- **Transacciones:** Planes usa transacciones para garantizar integridad (plan + integrantes + servicios).

**Tech Stack:** Express.js, Sequelize, React, Axios, SCSS, Jest tests

---

## Estructura de Archivos

### Backend

**Migraciones:**
- `backend/src/migrations/versions/1.0.1_tablas_lookup/upgrade.sql` — Crea 5 tablas lookup
- `backend/src/migrations/versions/1.0.1_tablas_lookup/downgrade.sql` — Drop tablas lookup
- `backend/src/migrations/versions/1.0.2_planes_y_personas/upgrade.sql` — Crea personas, planes, plan_integrantes, integrante_servicios
- `backend/src/migrations/versions/1.0.2_planes_y_personas/downgrade.sql` — Drop tablas planes

**Modelos (Sequelize):**
- `backend/src/models/Cobrador.js`
- `backend/src/models/TipoDePlan.js`
- `backend/src/models/ObraSocial.js`
- `backend/src/models/ServicioAdicional.js`
- `backend/src/models/TipoDeGrupo.js`
- `backend/src/models/Persona.js`
- `backend/src/models/Plan.js`
- `backend/src/models/PlanIntegrante.js`
- `backend/src/models/IntegranteServicio.js`

**Controladores:**
- `backend/src/controllers/lookupController.js` — CRUD genérico para todas las entidades lookup
- `backend/src/controllers/personasController.js` — Búsqueda de personas
- `backend/src/controllers/planesController.js` — CRUD de planes

**Rutas:**
- `backend/src/routes/lookup.js` — Rutas dinámicas para lookup
- `backend/src/routes/personas.js` — GET /api/personas (búsqueda)
- `backend/src/routes/planes.js` — CRUD de planes

**Modificación:**
- `backend/src/index.js` — Montar nuevas rutas

### Frontend

**Servicios API:**
- `frontend/src/services/lookupService.js` — fetch genérico para lookup (GET, POST, PUT, DELETE)
- `frontend/src/services/planesService.js` — fetch para planes (GET, POST, PUT, DELETE)
- `frontend/src/services/personasService.js` — búsqueda de personas

**Componentes compartidos:**
- `frontend/src/components/LookupCRUD/LookupCRUD.jsx` — Componente reutilizable para CRUD lookup
- `frontend/src/components/LookupCRUD/LookupCRUD.scss`
- `frontend/src/components/ErrorDisplay/ErrorDisplay.jsx` — Muestra errores en modales
- `frontend/src/components/ErrorDisplay/ErrorDisplay.scss`

**Páginas wrapper (lookup):**
- `frontend/src/pages/DashboardPage/components/Cobradores/Cobradores.jsx`
- `frontend/src/pages/DashboardPage/components/TiposDePlan/TiposDePlan.jsx`
- `frontend/src/pages/DashboardPage/components/ObrasSociales/ObrasSociales.jsx`
- `frontend/src/pages/DashboardPage/components/ServiciosAdicionales/ServiciosAdicionales.jsx`
- `frontend/src/pages/DashboardPage/components/TiposDeGrupo/TiposDeGrupo.jsx`

**CRUD Planes:**
- `frontend/src/pages/DashboardPage/components/GestionPlanes/GestionPlanes.jsx` — Tabla + modal CRUD
- `frontend/src/pages/DashboardPage/components/GestionPlanes/GestionPlanes.scss`

**Modificación:**
- `frontend/src/pages/DashboardPage/DashboardPage.jsx` — Menú de navegación + renderizar módulos dinámicamente

---

## Plan de Tareas

### Task 1: Migración 1.0.1 — Tablas Lookup

**Archivos:**
- Crear: `backend/src/migrations/versions/1.0.1_tablas_lookup/upgrade.sql`
- Crear: `backend/src/migrations/versions/1.0.1_tablas_lookup/downgrade.sql`

- [ ] **Paso 1: Crear archivo upgrade.sql**

```sql
-- backend/src/migrations/versions/1.0.1_tablas_lookup/upgrade.sql
CREATE TABLE cobradores (
  cobrador_numero     INT          NOT NULL,
  cobrador_apellido   VARCHAR(100) NOT NULL,
  cobrador_nombre     VARCHAR(100) NOT NULL,
  fecha_creacion      DATETIME     NOT NULL DEFAULT NOW(),
  fecha_actualizacion DATETIME     NOT NULL DEFAULT NOW(),
  PRIMARY KEY (cobrador_numero)
);

CREATE TABLE tipos_de_plan (
  tipo_plan_numero    INT          NOT NULL,
  tipo_plan_nombre    VARCHAR(100) NOT NULL,
  fecha_creacion      DATETIME     NOT NULL DEFAULT NOW(),
  fecha_actualizacion DATETIME     NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tipo_plan_numero)
);

CREATE TABLE obras_sociales (
  os_numero           INT          NOT NULL,
  os_nombre           VARCHAR(100) NOT NULL,
  fecha_creacion      DATETIME     NOT NULL DEFAULT NOW(),
  fecha_actualizacion DATETIME     NOT NULL DEFAULT NOW(),
  PRIMARY KEY (os_numero)
);

CREATE TABLE servicios_adicionales (
  servicio_adicional_numero    INT          NOT NULL,
  servicio_adicional_nombre    VARCHAR(100) NOT NULL,
  fecha_creacion               DATETIME     NOT NULL DEFAULT NOW(),
  fecha_actualizacion          DATETIME     NOT NULL DEFAULT NOW(),
  PRIMARY KEY (servicio_adicional_numero)
);

CREATE TABLE tipos_de_grupo (
  tipo_de_grupo_numero    INT          NOT NULL,
  tipo_de_grupo_nombre    VARCHAR(100) NOT NULL,
  fecha_creacion          DATETIME     NOT NULL DEFAULT NOW(),
  fecha_actualizacion     DATETIME     NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tipo_de_grupo_numero)
);

INSERT INTO tipos_de_grupo (tipo_de_grupo_numero, tipo_de_grupo_nombre) VALUES
  (1, 'Individual'),
  (2, 'Grupo familiar'),
  (3, 'Titular y adherente');
```

- [ ] **Paso 2: Crear archivo downgrade.sql**

```sql
-- backend/src/migrations/versions/1.0.1_tablas_lookup/downgrade.sql
DROP TABLE IF EXISTS tipos_de_grupo;
DROP TABLE IF EXISTS servicios_adicionales;
DROP TABLE IF EXISTS obras_sociales;
DROP TABLE IF EXISTS tipos_de_plan;
DROP TABLE IF EXISTS cobradores;
```

---

### Task 2: Migración 1.0.2 — Personas y Planes

**Archivos:**
- Crear: `backend/src/migrations/versions/1.0.2_planes_y_personas/upgrade.sql`
- Crear: `backend/src/migrations/versions/1.0.2_planes_y_personas/downgrade.sql`

- [ ] **Paso 1: Crear archivo upgrade.sql**

```sql
-- backend/src/migrations/versions/1.0.2_planes_y_personas/upgrade.sql
CREATE TABLE personas (
  id                      INT          NOT NULL AUTO_INCREMENT,
  apellido                VARCHAR(100) NOT NULL,
  nombre                  VARCHAR(100) NOT NULL,
  tipo_documento          ENUM('DNI','LC','LE','PASAPORTE') NOT NULL,
  numero_documento        VARCHAR(20)  NOT NULL,
  fecha_nacimiento        DATE         NOT NULL,
  fecha_cobertura         DATE         NOT NULL,
  fecha_creacion          DATETIME     NOT NULL DEFAULT NOW(),
  fecha_actualizacion     DATETIME     NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

CREATE TABLE planes (
  plan_numero             INT          NOT NULL AUTO_INCREMENT,
  tipo_plan_numero        INT          NOT NULL,
  cobrador_numero         INT          NOT NULL,
  tipo_de_grupo_numero    INT          NOT NULL,
  os_numero               INT          NOT NULL,
  numero_afiliado         VARCHAR(50)  NOT NULL,
  telefono_1              VARCHAR(30),
  telefono_2              VARCHAR(30),
  domicilio               VARCHAR(255),
  localidad               VARCHAR(100),
  valor_cuota             DECIMAL(10,2),
  estado                  ENUM('ACTIVO','SUSPENDIDO') NOT NULL DEFAULT 'ACTIVO',
  fecha_creacion          DATETIME     NOT NULL DEFAULT NOW(),
  fecha_actualizacion     DATETIME     NOT NULL DEFAULT NOW(),
  PRIMARY KEY (plan_numero),
  UNIQUE KEY uq_numero_afiliado (numero_afiliado),
  FOREIGN KEY (tipo_plan_numero)     REFERENCES tipos_de_plan(tipo_plan_numero),
  FOREIGN KEY (cobrador_numero)      REFERENCES cobradores(cobrador_numero),
  FOREIGN KEY (tipo_de_grupo_numero) REFERENCES tipos_de_grupo(tipo_de_grupo_numero),
  FOREIGN KEY (os_numero)            REFERENCES obras_sociales(os_numero)
);

CREATE TABLE plan_integrantes (
  id              INT         NOT NULL AUTO_INCREMENT,
  plan_numero     INT         NOT NULL,
  persona_id      INT         NOT NULL,
  rol             ENUM('titular','integrante') NOT NULL,
  credencial      CHAR(1)     NOT NULL,
  fecha_creacion  DATETIME    NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id),
  UNIQUE KEY uq_plan_persona (plan_numero, persona_id),
  FOREIGN KEY (plan_numero)  REFERENCES planes(plan_numero) ON DELETE CASCADE,
  FOREIGN KEY (persona_id)   REFERENCES personas(id)
);

CREATE TABLE integrante_servicios (
  plan_integrante_id          INT NOT NULL,
  servicio_adicional_numero   INT NOT NULL,
  PRIMARY KEY (plan_integrante_id, servicio_adicional_numero),
  FOREIGN KEY (plan_integrante_id)        REFERENCES plan_integrantes(id) ON DELETE CASCADE,
  FOREIGN KEY (servicio_adicional_numero) REFERENCES servicios_adicionales(servicio_adicional_numero)
);
```

- [ ] **Paso 2: Crear archivo downgrade.sql**

```sql
-- backend/src/migrations/versions/1.0.2_planes_y_personas/downgrade.sql
DROP TABLE IF EXISTS integrante_servicios;
DROP TABLE IF EXISTS plan_integrantes;
DROP TABLE IF EXISTS planes;
DROP TABLE IF EXISTS personas;
```

---

### Task 3: Modelos Lookup (Sequelize)

**Archivos:**
- Crear: `backend/src/models/Cobrador.js`
- Crear: `backend/src/models/TipoDePlan.js`
- Crear: `backend/src/models/ObraSocial.js`
- Crear: `backend/src/models/ServicioAdicional.js`
- Crear: `backend/src/models/TipoDeGrupo.js`

- [ ] **Paso 1: Crear modelo Cobrador.js**

```javascript
// backend/src/models/Cobrador.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Cobrador = sequelize.define('Cobrador', {
    cobrador_numero: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false,
    },
    cobrador_apellido: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    cobrador_nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'cobradores',
    timestamps: false,
  });

  return Cobrador;
};
```

- [ ] **Paso 2: Crear modelo TipoDePlan.js**

```javascript
// backend/src/models/TipoDePlan.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TipoDePlan = sequelize.define('TipoDePlan', {
    tipo_plan_numero: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false,
    },
    tipo_plan_nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'tipos_de_plan',
    timestamps: false,
  });

  return TipoDePlan;
};
```

- [ ] **Paso 3: Crear modelo ObraSocial.js**

```javascript
// backend/src/models/ObraSocial.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ObraSocial = sequelize.define('ObraSocial', {
    os_numero: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false,
    },
    os_nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'obras_sociales',
    timestamps: false,
  });

  return ObraSocial;
};
```

- [ ] **Paso 4: Crear modelo ServicioAdicional.js**

```javascript
// backend/src/models/ServicioAdicional.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ServicioAdicional = sequelize.define('ServicioAdicional', {
    servicio_adicional_numero: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false,
    },
    servicio_adicional_nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'servicios_adicionales',
    timestamps: false,
  });

  return ServicioAdicional;
};
```

- [ ] **Paso 5: Crear modelo TipoDeGrupo.js**

```javascript
// backend/src/models/TipoDeGrupo.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TipoDeGrupo = sequelize.define('TipoDeGrupo', {
    tipo_de_grupo_numero: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: false,
    },
    tipo_de_grupo_nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'tipos_de_grupo',
    timestamps: false,
  });

  return TipoDeGrupo;
};
```

---

### Task 4: Modelos Planes y Personas

**Archivos:**
- Crear: `backend/src/models/Persona.js`
- Crear: `backend/src/models/Plan.js`
- Crear: `backend/src/models/PlanIntegrante.js`
- Crear: `backend/src/models/IntegranteServicio.js`

- [ ] **Paso 1: Crear modelo Persona.js**

```javascript
// backend/src/models/Persona.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Persona = sequelize.define('Persona', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    apellido: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    tipo_documento: {
      type: DataTypes.ENUM('DNI', 'LC', 'LE', 'PASAPORTE'),
      allowNull: false,
    },
    numero_documento: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    fecha_nacimiento: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fecha_cobertura: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'personas',
    timestamps: false,
  });

  return Persona;
};
```

- [ ] **Paso 2: Crear modelo Plan.js**

```javascript
// backend/src/models/Plan.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Plan = sequelize.define('Plan', {
    plan_numero: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tipo_plan_numero: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cobrador_numero: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipo_de_grupo_numero: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    os_numero: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    numero_afiliado: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    telefono_1: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    telefono_2: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    domicilio: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    localidad: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    valor_cuota: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    estado: {
      type: DataTypes.ENUM('ACTIVO', 'SUSPENDIDO'),
      allowNull: false,
      defaultValue: 'ACTIVO',
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    fecha_actualizacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'planes',
    timestamps: false,
  });

  return Plan;
};
```

- [ ] **Paso 3: Crear modelo PlanIntegrante.js**

```javascript
// backend/src/models/PlanIntegrante.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PlanIntegrante = sequelize.define('PlanIntegrante', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    plan_numero: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    persona_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rol: {
      type: DataTypes.ENUM('titular', 'integrante'),
      allowNull: false,
    },
    credencial: {
      type: DataTypes.CHAR(1),
      allowNull: false,
    },
    fecha_creacion: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'plan_integrantes',
    timestamps: false,
  });

  return PlanIntegrante;
};
```

- [ ] **Paso 4: Crear modelo IntegranteServicio.js**

```javascript
// backend/src/models/IntegranteServicio.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const IntegranteServicio = sequelize.define('IntegranteServicio', {
    plan_integrante_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    servicio_adicional_numero: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
  }, {
    tableName: 'integrante_servicios',
    timestamps: false,
  });

  return IntegranteServicio;
};
```

- [ ] **Paso 5: Agregar associations en un archivo de inicialización (si no existe)**

En `backend/src/models/index.js` o donde se cargan los modelos, agregar las associations después de definir todos:

```javascript
// En el archivo donde se importan todos los modelos:
if (db.Plan && db.TipoDePlan) {
  db.Plan.belongsTo(db.TipoDePlan, { foreignKey: 'tipo_plan_numero' });
}
if (db.Plan && db.Cobrador) {
  db.Plan.belongsTo(db.Cobrador, { foreignKey: 'cobrador_numero' });
}
if (db.Plan && db.TipoDeGrupo) {
  db.Plan.belongsTo(db.TipoDeGrupo, { foreignKey: 'tipo_de_grupo_numero' });
}
if (db.Plan && db.ObraSocial) {
  db.Plan.belongsTo(db.ObraSocial, { foreignKey: 'os_numero' });
}
if (db.PlanIntegrante && db.Plan) {
  db.PlanIntegrante.belongsTo(db.Plan, { foreignKey: 'plan_numero', onDelete: 'CASCADE' });
  db.Plan.hasMany(db.PlanIntegrante, { foreignKey: 'plan_numero' });
}
if (db.PlanIntegrante && db.Persona) {
  db.PlanIntegrante.belongsTo(db.Persona, { foreignKey: 'persona_id' });
}
if (db.IntegranteServicio && db.PlanIntegrante) {
  db.IntegranteServicio.belongsTo(db.PlanIntegrante, { foreignKey: 'plan_integrante_id', onDelete: 'CASCADE' });
  db.PlanIntegrante.hasMany(db.IntegranteServicio, { foreignKey: 'plan_integrante_id' });
}
if (db.IntegranteServicio && db.ServicioAdicional) {
  db.IntegranteServicio.belongsTo(db.ServicioAdicional, { foreignKey: 'servicio_adicional_numero' });
}
```

---

### Task 5: LookupController (CRUD Genérico)

**Archivos:**
- Crear: `backend/src/controllers/lookupController.js`

- [ ] **Paso 1: Crear lookupController.js con mapeo de configuración y todas las operaciones CRUD**

```javascript
// backend/src/controllers/lookupController.js
const db = require('../models');

const ENTIDADES = {
  cobradores: {
    model: db.Cobrador,
    pkField: 'cobrador_numero',
    campos: ['cobrador_apellido', 'cobrador_nombre'],
    refsCheck: [{ model: db.Plan, fk: 'cobrador_numero' }],
  },
  'tipos-de-plan': {
    model: db.TipoDePlan,
    pkField: 'tipo_plan_numero',
    campos: ['tipo_plan_nombre'],
    refsCheck: [{ model: db.Plan, fk: 'tipo_plan_numero' }],
  },
  'obras-sociales': {
    model: db.ObraSocial,
    pkField: 'os_numero',
    campos: ['os_nombre'],
    refsCheck: [{ model: db.Plan, fk: 'os_numero' }],
  },
  'servicios-adicionales': {
    model: db.ServicioAdicional,
    pkField: 'servicio_adicional_numero',
    campos: ['servicio_adicional_nombre'],
    refsCheck: [{ model: db.IntegranteServicio, fk: 'servicio_adicional_numero' }],
  },
  'tipos-de-grupo': {
    model: db.TipoDeGrupo,
    pkField: 'tipo_de_grupo_numero',
    campos: ['tipo_de_grupo_nombre'],
    refsCheck: [{ model: db.Plan, fk: 'tipo_de_grupo_numero' }],
  },
};

// GET /api/lookup/:entidad
exports.list = async (req, res, next) => {
  try {
    const { entidad } = req.params;
    const config = ENTIDADES[entidad];

    if (!config) {
      return res.status(404).json({ error: 'Entidad no encontrada' });
    }

    const registros = await config.model.findAll({
      order: [[config.pkField, 'ASC']],
    });

    res.json(registros);
  } catch (err) {
    next(err);
  }
};

// POST /api/lookup/:entidad
exports.create = async (req, res, next) => {
  try {
    const { entidad } = req.params;
    const config = ENTIDADES[entidad];

    if (!config) {
      return res.status(404).json({ error: 'Entidad no encontrada' });
    }

    // Validar que todos los campos estén presentes
    for (const campo of config.campos) {
      if (!req.body[campo] || req.body[campo].toString().trim() === '') {
        return res.status(422).json({ error: `Campo requerido: ${campo}` });
      }
    }

    let pkValue = req.body[config.pkField];

    if (pkValue) {
      // Verificar unicidad si se provee el PK
      const existe = await config.model.findByPk(pkValue);
      if (existe) {
        return res.status(409).json({ error: `El número ${pkValue} ya existe` });
      }
    } else {
      // Calcular siguiente PK
      const max = await config.model.max(config.pkField);
      pkValue = (max || 0) + 1;
    }

    const data = { ...req.body, [config.pkField]: pkValue };
    const registro = await config.model.create(data);

    res.status(201).json(registro);
  } catch (err) {
    next(err);
  }
};

// PUT /api/lookup/:entidad/:numero
exports.update = async (req, res, next) => {
  try {
    const { entidad, numero } = req.params;
    const config = ENTIDADES[entidad];

    if (!config) {
      return res.status(404).json({ error: 'Entidad no encontrada' });
    }

    const registro = await config.model.findByPk(numero);
    if (!registro) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    // Validar que todos los campos estén presentes
    for (const campo of config.campos) {
      if (!req.body[campo] || req.body[campo].toString().trim() === '') {
        return res.status(422).json({ error: `Campo requerido: ${campo}` });
      }
    }

    // Actualizar solo los campos de entrada (no cambiar PK)
    const updateData = {};
    for (const campo of config.campos) {
      updateData[campo] = req.body[campo];
    }
    updateData.fecha_actualizacion = new Date();

    await registro.update(updateData);

    res.json(registro);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/lookup/:entidad/:numero
exports.delete = async (req, res, next) => {
  try {
    const { entidad, numero } = req.params;
    const config = ENTIDADES[entidad];

    if (!config) {
      return res.status(404).json({ error: 'Entidad no encontrada' });
    }

    const registro = await config.model.findByPk(numero);
    if (!registro) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    // Verificar referencias
    for (const ref of config.refsCheck) {
      const count = await ref.model.count({ where: { [ref.fk]: numero } });
      if (count > 0) {
        return res.status(409).json({ error: 'No se puede eliminar, está en uso' });
      }
    }

    await registro.destroy();

    res.json({ message: 'Eliminado' });
  } catch (err) {
    next(err);
  }
};
```

---

### Task 6: PersonasController (Búsqueda)

**Archivos:**
- Crear: `backend/src/controllers/personasController.js`

- [ ] **Paso 1: Crear personasController.js con búsqueda**

```javascript
// backend/src/controllers/personasController.js
const db = require('../models');
const { Op } = require('sequelize');

// GET /api/personas?search=texto
exports.search = async (req, res, next) => {
  try {
    const { search } = req.query;

    if (!search || search.trim() === '') {
      return res.json([]);
    }

    const personas = await db.Persona.findAll({
      where: {
        [Op.or]: [
          { apellido: { [Op.like]: `%${search}%` } },
          { nombre: { [Op.like]: `%${search}%` } },
          { numero_documento: { [Op.like]: `%${search}%` } },
        ],
      },
      attributes: ['id', 'apellido', 'nombre', 'tipo_documento', 'numero_documento', 'fecha_nacimiento', 'fecha_cobertura'],
      limit: 10,
    });

    res.json(personas);
  } catch (err) {
    next(err);
  }
};
```

---

### Task 7: PlanesController (CRUD Completo)

**Archivos:**
- Crear: `backend/src/controllers/planesController.js`

- [ ] **Paso 1: Crear planesController.js con todos los endpoints CRUD**

```javascript
// backend/src/controllers/planesController.js
const db = require('../models');
const { Op } = require('sequelize');

// GET /api/planes/siguiente-numero-afiliado
// ⚠️ IMPORTANTE: Esta ruta debe registrarse ANTES que GET /api/planes/:id
exports.obtenerSiguienteNumeroAfiliado = async (req, res, next) => {
  try {
    const max = await db.Plan.max('CAST(numero_afiliado AS UNSIGNED)');
    const siguiente = (max || 0) + 1;
    res.json({ siguiente: siguiente.toString() });
  } catch (err) {
    next(err);
  }
};

// GET /api/planes
exports.list = async (req, res, next) => {
  try {
    const { estado, cobrador_numero, os_numero, page = 1, limit = 20 } = req.query;

    const where = {};
    if (estado) where.estado = estado;
    if (cobrador_numero) where.cobrador_numero = cobrador_numero;
    if (os_numero) where.os_numero = os_numero;

    const offset = (page - 1) * limit;

    const { count, rows } = await db.Plan.findAndCountAll({
      where,
      include: [
        { model: db.Cobrador, attributes: ['cobrador_apellido', 'cobrador_nombre'] },
        { model: db.ObraSocial, attributes: ['os_nombre'] },
        { model: db.TipoDePlan, attributes: ['tipo_plan_nombre'] },
      ],
      offset,
      limit: parseInt(limit),
    });

    res.json({
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      data: rows,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/planes/:id
exports.detail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await db.Plan.findByPk(id, {
      include: [
        { model: db.Cobrador },
        { model: db.ObraSocial },
        { model: db.TipoDePlan },
        { model: db.TipoDeGrupo },
        {
          model: db.PlanIntegrante,
          include: [
            { model: db.Persona },
            { model: db.IntegranteServicio, include: [db.ServicioAdicional] },
          ],
        },
      ],
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    res.json(plan);
  } catch (err) {
    next(err);
  }
};

// POST /api/planes (transacción)
exports.create = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const {
      tipo_plan_numero,
      cobrador_numero,
      tipo_de_grupo_numero,
      os_numero,
      numero_afiliado,
      telefono_1,
      telefono_2,
      domicilio,
      localidad,
      valor_cuota,
      estado,
      integrantes,
    } = req.body;

    // Validación de integrantes
    if (!integrantes || !Array.isArray(integrantes) || integrantes.length === 0) {
      await transaction.rollback();
      return res.status(422).json({ error: 'Se requiere al menos 1 integrante' });
    }

    const titulares = integrantes.filter(i => i.rol === 'titular');
    if (titulares.length !== 1) {
      await transaction.rollback();
      return res.status(422).json({ error: 'Debe haber exactamente 1 titular' });
    }

    // Crear personas si es necesario
    const integrantesConPersonaId = await Promise.all(integrantes.map(async (integrante) => {
      if (integrante.persona_id) {
        // Verificar existencia
        const persona = await db.Persona.findByPk(integrante.persona_id, { transaction });
        if (!persona) {
          throw new Error(`Persona ${integrante.persona_id} no existe`);
        }
        return integrante;
      } else {
        // Crear nueva persona
        const nuevaPersona = await db.Persona.create(
          {
            apellido: integrante.apellido,
            nombre: integrante.nombre,
            tipo_documento: integrante.tipo_documento,
            numero_documento: integrante.numero_documento,
            fecha_nacimiento: integrante.fecha_nacimiento,
            fecha_cobertura: integrante.fecha_cobertura,
          },
          { transaction }
        );
        return { ...integrante, persona_id: nuevaPersona.id };
      }
    }));

    // Crear plan
    const plan = await db.Plan.create(
      {
        tipo_plan_numero,
        cobrador_numero,
        tipo_de_grupo_numero,
        os_numero,
        numero_afiliado,
        telefono_1,
        telefono_2,
        domicilio,
        localidad,
        valor_cuota,
        estado: estado || 'ACTIVO',
      },
      { transaction }
    );

    // Crear plan_integrantes
    const planIntegrantesData = await Promise.all(integrantesConPersonaId.map(integrante =>
      db.PlanIntegrante.create(
        {
          plan_numero: plan.plan_numero,
          persona_id: integrante.persona_id,
          rol: integrante.rol,
          credencial: integrante.credencial,
        },
        { transaction }
      )
    ));

    // Crear integrante_servicios
    for (let i = 0; i < planIntegrantesData.length; i++) {
      const planIntegrante = planIntegrantesData[i];
      const servicios = integrantesConPersonaId[i].servicios || [];

      for (const servicioId of servicios) {
        await db.IntegranteServicio.create(
          {
            plan_integrante_id: planIntegrante.id,
            servicio_adicional_numero: servicioId,
          },
          { transaction }
        );
      }
    }

    await transaction.commit();

    const planCompleto = await db.Plan.findByPk(plan.plan_numero, {
      include: [
        { model: db.Cobrador },
        { model: db.ObraSocial },
        { model: db.TipoDePlan },
        { model: db.TipoDeGrupo },
        {
          model: db.PlanIntegrante,
          include: [
            { model: db.Persona },
            { model: db.IntegranteServicio, include: [db.ServicioAdicional] },
          ],
        },
      ],
    });

    res.status(201).json(planCompleto);
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

// PUT /api/planes/:id (transacción)
exports.update = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      tipo_plan_numero,
      cobrador_numero,
      tipo_de_grupo_numero,
      os_numero,
      numero_afiliado,
      telefono_1,
      telefono_2,
      domicilio,
      localidad,
      valor_cuota,
      estado,
      integrantes,
    } = req.body;

    const plan = await db.Plan.findByPk(id, { transaction });
    if (!plan) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    // Validación de integrantes
    if (!integrantes || !Array.isArray(integrantes) || integrantes.length === 0) {
      await transaction.rollback();
      return res.status(422).json({ error: 'Se requiere al menos 1 integrante' });
    }

    const titulares = integrantes.filter(i => i.rol === 'titular');
    if (titulares.length !== 1) {
      await transaction.rollback();
      return res.status(422).json({ error: 'Debe haber exactamente 1 titular' });
    }

    // Actualizar datos del plan
    await plan.update(
      {
        tipo_plan_numero,
        cobrador_numero,
        tipo_de_grupo_numero,
        os_numero,
        numero_afiliado,
        telefono_1,
        telefono_2,
        domicilio,
        localidad,
        valor_cuota,
        estado,
      },
      { transaction }
    );

    // Obtener integrantes actuales
    const integrantesActuales = await db.PlanIntegrante.findAll(
      { where: { plan_numero: id } },
      { transaction }
    );

    // Sincronizar integrantes
    const integrantesNuevoIds = integrantes.map(i => i.id).filter(Boolean);
    const integrantesAEliminar = integrantesActuales.filter(i => !integrantesNuevoIds.includes(i.id));

    for (const integrante of integrantesAEliminar) {
      await integrante.destroy({ transaction });
    }

    // Crear/actualizar integrantes
    for (const integrante of integrantes) {
      if (integrante.id) {
        // Actualizar existente
        const planIntegrante = integrantesActuales.find(i => i.id === integrante.id);
        if (planIntegrante) {
          await planIntegrante.update(
            {
              rol: integrante.rol,
              credencial: integrante.credencial,
            },
            { transaction }
          );

          // Actualizar servicios
          await db.IntegranteServicio.destroy(
            { where: { plan_integrante_id: integrante.id } },
            { transaction }
          );

          const servicios = integrante.servicios || [];
          for (const servicioId of servicios) {
            await db.IntegranteServicio.create(
              {
                plan_integrante_id: integrante.id,
                servicio_adicional_numero: servicioId,
              },
              { transaction }
            );
          }
        }
      } else {
        // Crear nuevo
        let personaId = integrante.persona_id;

        if (!personaId) {
          // Crear nueva persona
          const nuevaPersona = await db.Persona.create(
            {
              apellido: integrante.apellido,
              nombre: integrante.nombre,
              tipo_documento: integrante.tipo_documento,
              numero_documento: integrante.numero_documento,
              fecha_nacimiento: integrante.fecha_nacimiento,
              fecha_cobertura: integrante.fecha_cobertura,
            },
            { transaction }
          );
          personaId = nuevaPersona.id;
        }

        const planIntegrante = await db.PlanIntegrante.create(
          {
            plan_numero: id,
            persona_id: personaId,
            rol: integrante.rol,
            credencial: integrante.credencial,
          },
          { transaction }
        );

        const servicios = integrante.servicios || [];
        for (const servicioId of servicios) {
          await db.IntegranteServicio.create(
            {
              plan_integrante_id: planIntegrante.id,
              servicio_adicional_numero: servicioId,
            },
            { transaction }
          );
        }
      }
    }

    await transaction.commit();

    const planActualizado = await db.Plan.findByPk(id, {
      include: [
        { model: db.Cobrador },
        { model: db.ObraSocial },
        { model: db.TipoDePlan },
        { model: db.TipoDeGrupo },
        {
          model: db.PlanIntegrante,
          include: [
            { model: db.Persona },
            { model: db.IntegranteServicio, include: [db.ServicioAdicional] },
          ],
        },
      ],
    });

    res.json(planActualizado);
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
};

// DELETE /api/planes/:id
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    const plan = await db.Plan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    // DELETE CASCADE lo maneja las FKs
    await plan.destroy();

    res.json({ message: 'Plan eliminado' });
  } catch (err) {
    next(err);
  }
};
```

---

### Task 8: Rutas Backend

**Archivos:**
- Crear: `backend/src/routes/lookup.js`
- Crear: `backend/src/routes/personas.js`
- Crear: `backend/src/routes/planes.js`

- [ ] **Paso 1: Crear ruta lookup.js**

```javascript
// backend/src/routes/lookup.js
const express = require('express');
const router = express.Router();
const lookupController = require('../controllers/lookupController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken); // Todas protegidas

router.get('/:entidad', lookupController.list);
router.post('/:entidad', lookupController.create);
router.put('/:entidad/:numero', lookupController.update);
router.delete('/:entidad/:numero', lookupController.delete);

module.exports = router;
```

- [ ] **Paso 2: Crear ruta personas.js**

```javascript
// backend/src/routes/personas.js
const express = require('express');
const router = express.Router();
const personasController = require('../controllers/personasController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken); // Todas protegidas

router.get('/', personasController.search);

module.exports = router;
```

- [ ] **Paso 3: Crear ruta planes.js**

```javascript
// backend/src/routes/planes.js
const express = require('express');
const router = express.Router();
const planesController = require('../controllers/planesController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken); // Todas protegidas

// ⚠️ IMPORTANTE: Esta ruta DEBE ir antes que GET /:id
router.get('/siguiente-numero-afiliado', planesController.obtenerSiguienteNumeroAfiliado);

router.get('/', planesController.list);
router.post('/', planesController.create);
router.get('/:id', planesController.detail);
router.put('/:id', planesController.update);
router.delete('/:id', planesController.delete);

module.exports = router;
```

- [ ] **Paso 4: Modificar backend/src/index.js para montar las rutas**

En `backend/src/index.js`, después de las rutas existentes (auth, etc.), agregar:

```javascript
// Montar nuevas rutas
const lookupRoutes = require('./routes/lookup');
const personasRoutes = require('./routes/personas');
const planesRoutes = require('./routes/planes');

app.use('/api/lookup', lookupRoutes);
app.use('/api/personas', personasRoutes);
app.use('/api/planes', planesRoutes);
```

---

### Task 9: Servicios Frontend

**Archivos:**
- Crear: `frontend/src/services/lookupService.js`
- Crear: `frontend/src/services/planesService.js`
- Crear: `frontend/src/services/personasService.js`

- [ ] **Paso 1: Crear lookupService.js**

```javascript
// frontend/src/services/lookupService.js
import api from './api';

const lookupService = {
  // GET lista de entidades
  list: async (entidad) => {
    const response = await api.get(`/lookup/${entidad}`);
    return response.data;
  },

  // POST crear nueva entidad
  create: async (entidad, data) => {
    const response = await api.post(`/lookup/${entidad}`, data);
    return response.data;
  },

  // PUT actualizar entidad
  update: async (entidad, numero, data) => {
    const response = await api.put(`/lookup/${entidad}/${numero}`, data);
    return response.data;
  },

  // DELETE eliminar entidad
  delete: async (entidad, numero) => {
    const response = await api.delete(`/lookup/${entidad}/${numero}`);
    return response.data;
  },
};

export default lookupService;
```

- [ ] **Paso 2: Crear planesService.js**

```javascript
// frontend/src/services/planesService.js
import api from './api';

const planesService = {
  // GET lista de planes con filtros
  list: async (filters = {}) => {
    const response = await api.get('/planes', { params: filters });
    return response.data;
  },

  // GET detalle de un plan
  detail: async (id) => {
    const response = await api.get(`/planes/${id}`);
    return response.data;
  },

  // GET siguiente número de afiliado
  obtenerSiguienteNumeroAfiliado: async () => {
    const response = await api.get('/planes/siguiente-numero-afiliado');
    return response.data.siguiente;
  },

  // POST crear plan
  create: async (data) => {
    const response = await api.post('/planes', data);
    return response.data;
  },

  // PUT actualizar plan
  update: async (id, data) => {
    const response = await api.put(`/planes/${id}`, data);
    return response.data;
  },

  // DELETE eliminar plan
  delete: async (id) => {
    const response = await api.delete(`/planes/${id}`);
    return response.data;
  },
};

export default planesService;
```

- [ ] **Paso 3: Crear personasService.js**

```javascript
// frontend/src/services/personasService.js
import api from './api';

const personasService = {
  // GET buscar personas
  search: async (searchText) => {
    const response = await api.get('/personas', { params: { search: searchText } });
    return response.data;
  },
};

export default personasService;
```

---

### Task 10: Componentes Compartidos Frontend

**Archivos:**
- Crear: `frontend/src/components/LookupCRUD/LookupCRUD.jsx`
- Crear: `frontend/src/components/LookupCRUD/LookupCRUD.scss`
- Crear: `frontend/src/components/ErrorDisplay/ErrorDisplay.jsx`
- Crear: `frontend/src/components/ErrorDisplay/ErrorDisplay.scss`

- [ ] **Paso 1: Crear ErrorDisplay.jsx**

```jsx
// frontend/src/components/ErrorDisplay/ErrorDisplay.jsx
import React, { useState } from 'react';
import './ErrorDisplay.scss';

const ErrorDisplay = ({ error, onClose }) => {
  if (!error) return null;

  return (
    <div className="error-overlay" onClick={onClose}>
      <div className="error-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
};

export default ErrorDisplay;
```

- [ ] **Paso 2: Crear ErrorDisplay.scss**

```scss
// frontend/src/components/ErrorDisplay/ErrorDisplay.scss
.error-overlay {
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
}

.error-modal {
  background: var(--color-surface);
  padding: 24px;
  border-radius: 8px;
  max-width: 400px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);

  h3 {
    margin-top: 0;
    margin-bottom: 16px;
    color: var(--color-danger);
  }

  p {
    margin: 0 0 16px 0;
    color: var(--color-text);
  }

  button {
    padding: 8px 16px;
    background: var(--color-danger);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      opacity: 0.9;
    }
  }
}
```

- [ ] **Paso 3: Crear LookupCRUD.jsx**

```jsx
// frontend/src/components/LookupCRUD/LookupCRUD.jsx
import React, { useEffect, useState } from 'react';
import lookupService from '../../services/lookupService';
import ErrorDisplay from '../ErrorDisplay/ErrorDisplay';
import './LookupCRUD.scss';

const LookupCRUD = ({ titulo, endpoint, campos }) => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  const entidad = endpoint.split('/').pop();

  // Cargar lista
  useEffect(() => {
    loadRegistros();
  }, [entidad]);

  const loadRegistros = async () => {
    try {
      setLoading(true);
      const data = await lookupService.list(entidad);
      setRegistros(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (registro = null) => {
    if (registro) {
      setFormData(registro);
      setEditingId(registro[campos[0]?.pk || 'id']);
    } else {
      setFormData({});
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData({});
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await lookupService.update(entidad, editingId, formData);
      } else {
        await lookupService.create(entidad, formData);
      }
      await loadRegistros();
      handleCloseForm();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro?')) {
      try {
        await lookupService.delete(entidad, id);
        await loadRegistros();
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || 'Error al eliminar');
      }
    }
  };

  if (loading) return <div className="lookup-crud loading">Cargando...</div>;

  return (
    <div className="lookup-crud">
      <div className="header">
        <h2>{titulo}</h2>
        <button onClick={() => handleOpenForm()} className="btn-primary">
          + Nuevo
        </button>
      </div>

      <table className="lookup-table">
        <thead>
          <tr>
            {campos.map(campo => (
              <th key={campo.name}>{campo.label}</th>
            ))}
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {registros.map(registro => (
            <tr key={Object.values(registro)[0]}>
              {campos.map(campo => (
                <td key={campo.name}>{registro[campo.name]}</td>
              ))}
              <td className="acciones">
                <button onClick={() => handleOpenForm(registro)} className="btn-edit">Editar</button>
                <button onClick={() => handleDelete(Object.values(registro)[0])} className="btn-delete">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <form className="modal-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h3>{editingId ? 'Editar' : 'Crear'} {titulo.slice(0, -1)}</h3>
            {campos.map(campo => (
              <div key={campo.name} className="form-group">
                <label>{campo.label}</label>
                <input
                  type={campo.tipo === 'numero_pk' ? 'number' : 'text'}
                  name={campo.name}
                  value={formData[campo.name] || ''}
                  onChange={handleInputChange}
                  required={true}
                />
              </div>
            ))}
            <div className="form-actions">
              <button type="submit" className="btn-primary">Guardar</button>
              <button type="button" onClick={handleCloseForm} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <ErrorDisplay error={error} onClose={() => setError(null)} />
    </div>
  );
};

export default LookupCRUD;
```

- [ ] **Paso 4: Crear LookupCRUD.scss**

```scss
// frontend/src/components/LookupCRUD/LookupCRUD.scss
.lookup-crud {
  padding: 16px;

  &.loading {
    text-align: center;
    padding: 32px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h2 {
      margin: 0;
      color: var(--color-text);
    }

    .btn-primary {
      padding: 8px 16px;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        background: var(--color-primary-hover);
      }
    }
  }

  .lookup-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;

    thead {
      background: var(--color-surface-alt);
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text);
    }

    tbody tr:nth-child(even) {
      background: var(--color-row-alt);
    }

    tbody tr:hover {
      background: var(--color-surface-alt);
    }

    .acciones {
      display: flex;
      gap: 8px;

      button {
        padding: 4px 8px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;

        &.btn-edit {
          background: var(--color-primary);
          color: white;

          &:hover {
            opacity: 0.9;
          }
        }

        &.btn-delete {
          background: var(--color-danger);
          color: white;

          &:hover {
            opacity: 0.9;
          }
        }
      }
    }
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
  }

  .modal-form {
    background: var(--color-surface);
    padding: 24px;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

    h3 {
      margin-top: 0;
      margin-bottom: 20px;
      color: var(--color-text);
    }

    .form-group {
      margin-bottom: 16px;

      label {
        display: block;
        margin-bottom: 6px;
        color: var(--color-text);
        font-weight: 500;
      }

      input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--color-border);
        border-radius: 4px;
        font-size: 14px;
        color: var(--color-text);
        background: var(--color-surface);

        &:focus {
          outline: none;
          border-color: var(--color-primary);
        }
      }
    }

    .form-actions {
      display: flex;
      gap: 8px;
      margin-top: 24px;

      button {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;

        &.btn-primary {
          background: var(--color-primary);
          color: white;

          &:hover {
            background: var(--color-primary-hover);
          }
        }

        &.btn-secondary {
          background: var(--color-border);
          color: var(--color-text);

          &:hover {
            opacity: 0.8;
          }
        }
      }
    }
  }
}
```

---

### Task 11: Páginas Wrapper para Lookup (5 Componentes)

**Archivos:**
- Crear: `frontend/src/pages/DashboardPage/components/Cobradores/Cobradores.jsx`
- Crear: `frontend/src/pages/DashboardPage/components/TiposDePlan/TiposDePlan.jsx`
- Crear: `frontend/src/pages/DashboardPage/components/ObrasSociales/ObrasSociales.jsx`
- Crear: `frontend/src/pages/DashboardPage/components/ServiciosAdicionales/ServiciosAdicionales.jsx`
- Crear: `frontend/src/pages/DashboardPage/components/TiposDeGrupo/TiposDeGrupo.jsx`

- [ ] **Paso 1: Crear Cobradores.jsx**

```jsx
// frontend/src/pages/DashboardPage/components/Cobradores/Cobradores.jsx
import React from 'react';
import LookupCRUD from '../../../../components/LookupCRUD/LookupCRUD';

const Cobradores = () => {
  return (
    <LookupCRUD
      titulo="Cobradores"
      endpoint="/lookup/cobradores"
      campos={[
        { name: 'cobrador_numero', label: 'Número', tipo: 'numero_pk' },
        { name: 'cobrador_apellido', label: 'Apellido' },
        { name: 'cobrador_nombre', label: 'Nombre' },
      ]}
    />
  );
};

export default Cobradores;
```

- [ ] **Paso 2: Crear TiposDePlan.jsx**

```jsx
// frontend/src/pages/DashboardPage/components/TiposDePlan/TiposDePlan.jsx
import React from 'react';
import LookupCRUD from '../../../../components/LookupCRUD/LookupCRUD';

const TiposDePlan = () => {
  return (
    <LookupCRUD
      titulo="Tipos de Plan"
      endpoint="/lookup/tipos-de-plan"
      campos={[
        { name: 'tipo_plan_numero', label: 'Número', tipo: 'numero_pk' },
        { name: 'tipo_plan_nombre', label: 'Nombre' },
      ]}
    />
  );
};

export default TiposDePlan;
```

- [ ] **Paso 3: Crear ObrasSociales.jsx**

```jsx
// frontend/src/pages/DashboardPage/components/ObrasSociales/ObrasSociales.jsx
import React from 'react';
import LookupCRUD from '../../../../components/LookupCRUD/LookupCRUD';

const ObrasSociales = () => {
  return (
    <LookupCRUD
      titulo="Obras Sociales"
      endpoint="/lookup/obras-sociales"
      campos={[
        { name: 'os_numero', label: 'Número', tipo: 'numero_pk' },
        { name: 'os_nombre', label: 'Nombre' },
      ]}
    />
  );
};

export default ObrasSociales;
```

- [ ] **Paso 4: Crear ServiciosAdicionales.jsx**

```jsx
// frontend/src/pages/DashboardPage/components/ServiciosAdicionales/ServiciosAdicionales.jsx
import React from 'react';
import LookupCRUD from '../../../../components/LookupCRUD/LookupCRUD';

const ServiciosAdicionales = () => {
  return (
    <LookupCRUD
      titulo="Servicios Adicionales"
      endpoint="/lookup/servicios-adicionales"
      campos={[
        { name: 'servicio_adicional_numero', label: 'Número', tipo: 'numero_pk' },
        { name: 'servicio_adicional_nombre', label: 'Nombre' },
      ]}
    />
  );
};

export default ServiciosAdicionales;
```

- [ ] **Paso 5: Crear TiposDeGrupo.jsx**

```jsx
// frontend/src/pages/DashboardPage/components/TiposDeGrupo/TiposDeGrupo.jsx
import React from 'react';
import LookupCRUD from '../../../../components/LookupCRUD/LookupCRUD';

const TiposDeGrupo = () => {
  return (
    <LookupCRUD
      titulo="Tipos de Grupo"
      endpoint="/lookup/tipos-de-grupo"
      campos={[
        { name: 'tipo_de_grupo_numero', label: 'Número', tipo: 'numero_pk' },
        { name: 'tipo_de_grupo_nombre', label: 'Nombre' },
      ]}
    />
  );
};

export default TiposDeGrupo;
```

---

### Task 12: CRUD Planes Frontend (GestionPlanes)

**Archivos:**
- Crear: `frontend/src/pages/DashboardPage/components/GestionPlanes/GestionPlanes.jsx`
- Crear: `frontend/src/pages/DashboardPage/components/GestionPlanes/GestionPlanes.scss`

- [ ] **Paso 1: Crear GestionPlanes.jsx (parte 1 — tabla y estado)**

```jsx
// frontend/src/pages/DashboardPage/components/GestionPlanes/GestionPlanes.jsx
import React, { useEffect, useState } from 'react';
import planesService from '../../../../services/planesService';
import personasService from '../../../../services/personasService';
import lookupService from '../../../../services/lookupService';
import ErrorDisplay from '../../../../components/ErrorDisplay/ErrorDisplay';
import './GestionPlanes.scss';

const GestionPlanes = () => {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});

  // Datos de referencia para el formulario
  const [cobradores, setCobradores] = useState([]);
  const [tiposDeGrupo, setTiposDeGrupo] = useState([]);
  const [tiposDePlan, setTiposDePlan] = useState([]);
  const [obrasSociales, setObrasSociales] = useState([]);
  const [serviciosAdicionales, setServiciosAdicionales] = useState([]);
  const [personasSearch, setPersonasSearch] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar todo al montar
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [planes, cobradores, tiposGrupo, tiposPlan, obrasSoc, servicios] = await Promise.all([
        planesService.list(),
        lookupService.list('cobradores'),
        lookupService.list('tipos-de-grupo'),
        lookupService.list('tipos-de-plan'),
        lookupService.list('obras-sociales'),
        lookupService.list('servicios-adicionales'),
      ]);
      setPlanes(planes.data || planes);
      setCobradores(cobradores);
      setTiposDeGrupo(tiposGrupo);
      setTiposDePlan(tiposPlan);
      setObrasSociales(obrasSoc);
      setServiciosAdicionales(servicios);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (plan = null) => {
    if (plan) {
      setFormData({
        ...plan,
        integrantes: plan.PlanIntegrantes || [],
      });
      setEditingId(plan.plan_numero);
    } else {
      setFormData({
        integrantes: [{ rol: 'titular', credencial: 'A', servicios: [] }],
      });
      setEditingId(null);
      // Pre-cargar siguiente número de afiliado
      planesService.obtenerSiguienteNumeroAfiliado().then(siguiente => {
        setFormData(prev => ({ ...prev, numero_afiliado: siguiente }));
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setFormData({});
    setEditingId(null);
    setSearchQuery('');
    setPersonasSearch([]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setPersonasSearch([]);
      return;
    }
    try {
      const personas = await personasService.search(query);
      setPersonasSearch(personas);
    } catch (err) {
      console.error('Error buscando personas:', err);
    }
  };

  const addIntegrante = () => {
    setFormData(prev => ({
      ...prev,
      integrantes: [
        ...prev.integrantes,
        { rol: 'integrante', credencial: 'A', servicios: [] },
      ],
    }));
  };

  const removeIntegrante = (index) => {
    setFormData(prev => ({
      ...prev,
      integrantes: prev.integrantes.filter((_, i) => i !== index),
    }));
  };

  const updateIntegrante = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      integrantes: prev.integrantes.map((int, i) => (
        i === index ? { ...int, [field]: value } : int
      )),
    }));
  };

  const selectPersona = (index, persona) => {
    updateIntegrante(index, 'persona_id', persona.id);
    updateIntegrante(index, 'apellido', persona.apellido);
    updateIntegrante(index, 'nombre', persona.nombre);
    updateIntegrante(index, 'tipo_documento', persona.tipo_documento);
    updateIntegrante(index, 'numero_documento', persona.numero_documento);
    updateIntegrante(index, 'fecha_nacimiento', persona.fecha_nacimiento);
    updateIntegrante(index, 'fecha_cobertura', persona.fecha_cobertura);
    setSearchQuery('');
    setPersonasSearch([]);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await planesService.update(editingId, formData);
      } else {
        await planesService.create(formData);
      }
      await loadAll();
      handleCloseForm();
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro?')) {
      try {
        await planesService.delete(id);
        await loadAll();
        setError(null);
      } catch (err) {
        setError(err.response?.data?.error || 'Error al eliminar');
      }
    }
  };

  if (loading) return <div className="gestion-planes loading">Cargando...</div>;

  return (
    <div className="gestion-planes">
      <div className="header">
        <h2>Gestión de Planes</h2>
        <button onClick={() => handleOpenForm()} className="btn-primary">
          + Nuevo Plan
        </button>
      </div>

      <table className="planes-table">
        <thead>
          <tr>
            <th>Número Afiliado</th>
            <th>Cobrador</th>
            <th>Obra Social</th>
            <th>Tipo</th>
            <th>Valor Cuota</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {planes.map(plan => (
            <tr key={plan.plan_numero}>
              <td>{plan.numero_afiliado}</td>
              <td>{plan.Cobrador?.cobrador_nombre}</td>
              <td>{plan.ObraSocial?.os_nombre}</td>
              <td>{plan.TipoDePlan?.tipo_plan_nombre}</td>
              <td>${plan.valor_cuota}</td>
              <td>{plan.estado}</td>
              <td className="acciones">
                <button onClick={() => handleOpenForm(plan)} className="btn-edit">Editar</button>
                <button onClick={() => handleDelete(plan.plan_numero)} className="btn-delete">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div className="modal-overlay" onClick={handleCloseForm}>
          <form className="modal-form" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
            <h3>{editingId ? 'Editar' : 'Crear'} Plan</h3>

            {/* Pestaña 1: Datos del Plan */}
            <fieldset>
              <legend>Datos del Plan</legend>

              <div className="form-row">
                <div className="form-group">
                  <label>Número Afiliado *</label>
                  <input
                    type="text"
                    name="numero_afiliado"
                    value={formData.numero_afiliado || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cobrador *</label>
                  <select
                    name="cobrador_numero"
                    value={formData.cobrador_numero || ''}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {cobradores.map(c => (
                      <option key={c.cobrador_numero} value={c.cobrador_numero}>
                        {c.cobrador_apellido} {c.cobrador_nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Obra Social *</label>
                  <select
                    name="os_numero"
                    value={formData.os_numero || ''}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {obrasSociales.map(o => (
                      <option key={o.os_numero} value={o.os_numero}>
                        {o.os_nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de Plan *</label>
                  <select
                    name="tipo_plan_numero"
                    value={formData.tipo_plan_numero || ''}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {tiposDePlan.map(t => (
                      <option key={t.tipo_plan_numero} value={t.tipo_plan_numero}>
                        {t.tipo_plan_nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Tipo de Grupo *</label>
                  <select
                    name="tipo_de_grupo_numero"
                    value={formData.tipo_de_grupo_numero || ''}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {tiposDeGrupo.map(t => (
                      <option key={t.tipo_de_grupo_numero} value={t.tipo_de_grupo_numero}>
                        {t.tipo_de_grupo_nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Valor Cuota</label>
                  <input
                    type="number"
                    name="valor_cuota"
                    step="0.01"
                    value={formData.valor_cuota || ''}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Estado</label>
                  <select name="estado" value={formData.estado || 'ACTIVO'} onChange={handleInputChange}>
                    <option value="ACTIVO">Activo</option>
                    <option value="SUSPENDIDO">Suspendido</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono 1</label>
                  <input
                    type="tel"
                    name="telefono_1"
                    value={formData.telefono_1 || ''}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono 2</label>
                  <input
                    type="tel"
                    name="telefono_2"
                    value={formData.telefono_2 || ''}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Domicilio</label>
                <input
                  type="text"
                  name="domicilio"
                  value={formData.domicilio || ''}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group full-width">
                <label>Localidad</label>
                <input
                  type="text"
                  name="localidad"
                  value={formData.localidad || ''}
                  onChange={handleInputChange}
                />
              </div>
            </fieldset>

            {/* Pestaña 2: Integrantes */}
            <fieldset>
              <legend>Integrantes del Plan</legend>

              {formData.integrantes?.map((integrante, index) => (
                <div key={index} className="integrante-block">
                  <div className="integrante-header">
                    <h4>Integrante {index + 1} {integrante.rol === 'titular' ? '(Titular)' : ''}</h4>
                    {formData.integrantes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIntegrante(index)}
                        className="btn-remove"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Rol *</label>
                      <select
                        value={integrante.rol || 'integrante'}
                        onChange={(e) => updateIntegrante(index, 'rol', e.target.value)}
                      >
                        <option value="titular">Titular</option>
                        <option value="integrante">Integrante</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Credencial *</label>
                      <input
                        type="text"
                        maxLength="1"
                        value={integrante.credencial || ''}
                        onChange={(e) => updateIntegrante(index, 'credencial', e.target.value)}
                      />
                    </div>
                  </div>

                  {!integrante.persona_id && (
                    <div className="form-group search-personas">
                      <label>Buscar Persona Existente</label>
                      <input
                        type="text"
                        placeholder="Apellido, nombre o documento..."
                        onChange={(e) => handleSearch(e.target.value)}
                      />
                      {personasSearch.length > 0 && (
                        <ul className="search-results">
                          {personasSearch.map(persona => (
                            <li
                              key={persona.id}
                              onClick={() => selectPersona(index, persona)}
                            >
                              {persona.apellido} {persona.nombre} ({persona.numero_documento})
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="hint">o completar datos manualmente abajo</p>
                    </div>
                  )}

                  {integrante.persona_id ? (
                    <div className="persona-display">
                      <p>
                        <strong>{integrante.apellido} {integrante.nombre}</strong>
                      </p>
                      <p>{integrante.tipo_documento}: {integrante.numero_documento}</p>
                      <button
                        type="button"
                        onClick={() => {
                          const newIntegrantes = [...formData.integrantes];
                          newIntegrantes[index] = {
                            rol: integrante.rol,
                            credencial: integrante.credencial,
                            servicios: integrante.servicios || [],
                          };
                          setFormData(prev => ({ ...prev, integrantes: newIntegrantes }));
                        }}
                        className="btn-change"
                      >
                        Cambiar persona
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Apellido *</label>
                          <input
                            type="text"
                            value={integrante.apellido || ''}
                            onChange={(e) => updateIntegrante(index, 'apellido', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label>Nombre *</label>
                          <input
                            type="text"
                            value={integrante.nombre || ''}
                            onChange={(e) => updateIntegrante(index, 'nombre', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Tipo de Documento *</label>
                          <select
                            value={integrante.tipo_documento || 'DNI'}
                            onChange={(e) => updateIntegrante(index, 'tipo_documento', e.target.value)}
                          >
                            <option value="DNI">DNI</option>
                            <option value="LC">LC</option>
                            <option value="LE">LE</option>
                            <option value="PASAPORTE">Pasaporte</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Número de Documento *</label>
                          <input
                            type="text"
                            value={integrante.numero_documento || ''}
                            onChange={(e) => updateIntegrante(index, 'numero_documento', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Fecha de Nacimiento *</label>
                          <input
                            type="date"
                            value={integrante.fecha_nacimiento || ''}
                            onChange={(e) => updateIntegrante(index, 'fecha_nacimiento', e.target.value)}
                          />
                        </div>

                        <div className="form-group">
                          <label>Fecha de Cobertura *</label>
                          <input
                            type="date"
                            value={integrante.fecha_cobertura || ''}
                            onChange={(e) => updateIntegrante(index, 'fecha_cobertura', e.target.value)}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="form-group full-width">
                    <label>Servicios Adicionales</label>
                    <div className="servicios-list">
                      {serviciosAdicionales.map(servicio => (
                        <label key={servicio.servicio_adicional_numero} className="checkbox">
                          <input
                            type="checkbox"
                            checked={(integrante.servicios || []).includes(servicio.servicio_adicional_numero)}
                            onChange={(e) => {
                              const servicios = integrante.servicios || [];
                              if (e.target.checked) {
                                servicios.push(servicio.servicio_adicional_numero);
                              } else {
                                servicios.splice(servicios.indexOf(servicio.servicio_adicional_numero), 1);
                              }
                              updateIntegrante(index, 'servicios', [...servicios]);
                            }}
                          />
                          {servicio.servicio_adicional_nombre}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addIntegrante} className="btn-add-integrante">
                + Agregar Integrante
              </button>
            </fieldset>

            <div className="form-actions">
              <button type="submit" className="btn-primary">Guardar</button>
              <button type="button" onClick={handleCloseForm} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <ErrorDisplay error={error} onClose={() => setError(null)} />
    </div>
  );
};

export default GestionPlanes;
```

- [ ] **Paso 2: Crear GestionPlanes.scss**

```scss
// frontend/src/pages/DashboardPage/components/GestionPlanes/GestionPlanes.scss
.gestion-planes {
  padding: 16px;

  &.loading {
    text-align: center;
    padding: 32px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h2 {
      margin: 0;
      color: var(--color-text);
    }

    .btn-primary {
      padding: 8px 16px;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        background: var(--color-primary-hover);
      }
    }
  }

  .planes-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;

    thead {
      background: var(--color-surface-alt);
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text);
    }

    tbody tr:nth-child(even) {
      background: var(--color-row-alt);
    }

    tbody tr:hover {
      background: var(--color-surface-alt);
    }

    .acciones {
      display: flex;
      gap: 8px;

      button {
        padding: 4px 8px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;

        &.btn-edit {
          background: var(--color-primary);
          color: white;

          &:hover {
            opacity: 0.9;
          }
        }

        &.btn-delete {
          background: var(--color-danger);
          color: white;

          &:hover {
            opacity: 0.9;
          }
        }
      }
    }
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
    overflow-y: auto;
    padding: 20px;
  }

  .modal-form {
    background: var(--color-surface);
    padding: 24px;
    border-radius: 8px;
    max-width: 960px;
    width: 100%;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    margin: 20px auto;

    h3 {
      margin-top: 0;
      margin-bottom: 20px;
      color: var(--color-text);
    }

    fieldset {
      border: 1px solid var(--color-border);
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 16px;

      legend {
        padding: 0 8px;
        color: var(--color-text);
        font-weight: 500;
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-group {
      display: flex;
      flex-direction: column;

      label {
        margin-bottom: 6px;
        color: var(--color-text);
        font-weight: 500;
        font-size: 14px;
      }

      input, select, textarea {
        padding: 8px 12px;
        border: 1px solid var(--color-border);
        border-radius: 4px;
        font-size: 14px;
        color: var(--color-text);
        background: var(--color-surface);

        &:focus {
          outline: none;
          border-color: var(--color-primary);
        }
      }

      &.full-width {
        grid-column: 1 / -1;
      }

      &.search-personas {
        position: relative;

        input {
          margin-bottom: 8px;
        }

        .search-results {
          list-style: none;
          padding: 8px 0;
          margin: 0;
          border: 1px solid var(--color-border);
          border-radius: 4px;
          max-height: 150px;
          overflow-y: auto;
          background: var(--color-surface);

          li {
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid var(--color-border);

            &:last-child {
              border-bottom: none;
            }

            &:hover {
              background: var(--color-surface-alt);
            }
          }
        }

        .hint {
          font-size: 12px;
          color: var(--color-text-muted);
          margin: 8px 0 0 0;
        }
      }
    }

    .persona-display {
      border: 1px solid var(--color-primary);
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      background: var(--color-surface-alt);

      p {
        margin: 4px 0;
        color: var(--color-text);

        strong {
          color: var(--color-primary);
        }
      }

      .btn-change {
        padding: 4px 8px;
        background: var(--color-primary);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        margin-top: 8px;

        &:hover {
          opacity: 0.9;
        }
      }
    }

    .integrante-block {
      border: 1px solid var(--color-border);
      border-radius: 4px;
      padding: 16px;
      margin-bottom: 16px;
      background: var(--color-surface-alt);

      .integrante-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        h4 {
          margin: 0;
          color: var(--color-text);
        }

        .btn-remove {
          padding: 4px 8px;
          background: var(--color-danger);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;

          &:hover {
            opacity: 0.9;
          }
        }
      }

      .servicios-list {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;

        .checkbox {
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          color: var(--color-text);

          input {
            width: auto;
            margin: 0;
          }
        }
      }
    }

    .btn-add-integrante {
      padding: 8px 16px;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-bottom: 16px;

      &:hover {
        background: var(--color-primary-hover);
      }
    }

    .form-actions {
      display: flex;
      gap: 8px;
      margin-top: 24px;

      button {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;

        &.btn-primary {
          background: var(--color-primary);
          color: white;

          &:hover {
            background: var(--color-primary-hover);
          }
        }

        &.btn-secondary {
          background: var(--color-border);
          color: var(--color-text);

          &:hover {
            opacity: 0.8;
          }
        }
      }
    }
  }

  @media (max-width: 768px) {
    .modal-form {
      max-width: 100%;
      margin: 10px;

      .form-row {
        grid-template-columns: 1fr;
      }

      .planes-table {
        font-size: 12px;

        th, td {
          padding: 8px;
        }

        .acciones {
          flex-direction: column;
        }
      }
    }
  }
}
```

---

### Task 13: Modificar DashboardPage para integración

**Archivos:**
- Modificar: `frontend/src/pages/DashboardPage/DashboardPage.jsx`

- [ ] **Paso 1: Modificar DashboardPage.jsx para agregar menú y renderizar módulos**

Leer el archivo actual `frontend/src/pages/DashboardPage/DashboardPage.jsx` y actualizarlo para:
- Agregar estado para módulo activo (Cobradores, TiposDePlan, ObrasSociales, ServiciosAdicionales, TiposDeGrupo, GestionPlanes)
- Crear menú lateral o tab que seleccione el módulo
- Renderizar componentes dinámicamente según módulo activo

Ejemplo estructura:

```jsx
import React, { useState } from 'react';
import DatosPersonales from './components/DatosPersonales/DatosPersonales';
import Cobradores from './components/Cobradores/Cobradores';
import TiposDePlan from './components/TiposDePlan/TiposDePlan';
import ObrasSociales from './components/ObrasSociales/ObrasSociales';
import ServiciosAdicionales from './components/ServiciosAdicionales/ServiciosAdicionales';
import TiposDeGrupo from './components/TiposDeGrupo/TiposDeGrupo';
import GestionPlanes from './components/GestionPlanes/GestionPlanes';

const DashboardPage = () => {
  const [activeModule, setActiveModule] = useState('datosPersonales');

  const modules = {
    datosPersonales: { label: 'Datos Personales', component: DatosPersonales },
    cobradores: { label: 'Cobradores', component: Cobradores },
    tiposPlan: { label: 'Tipos de Plan', component: TiposDePlan },
    obrasSociales: { label: 'Obras Sociales', component: ObrasSociales },
    serviciosAdicionales: { label: 'Servicios Adicionales', component: ServiciosAdicionales },
    tiposGrupo: { label: 'Tipos de Grupo', component: TiposDeGrupo },
    planes: { label: 'Planes', component: GestionPlanes },
  };

  const ActiveComponent = modules[activeModule].component;

  return (
    <div className="dashboard-page">
      <aside className="dashboard-menu">
        {Object.entries(modules).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => setActiveModule(key)}
            className={`menu-item ${activeModule === key ? 'active' : ''}`}
          >
            {label}
          </button>
        ))}
      </aside>

      <main className="dashboard-content">
        <ActiveComponent />
      </main>
    </div>
  );
};

export default DashboardPage;
```

---

## Checklist de Auto-Revisión

- [ ] **Cobertura del spec:**
  - ✅ Migraciones 1.0.1 y 1.0.2 completas
  - ✅ 9 modelos Sequelize (lookup + personas/planes)
  - ✅ Controller lookup genérico (GET, POST, PUT, DELETE)
  - ✅ Controller personas (búsqueda solamente)
  - ✅ Controller planes (CRUD con transacciones, sin aumento-masivo ni recibos)
  - ✅ 3 rutas backend (lookup, personas, planes)
  - ✅ 3 servicios frontend (lookup, planes, personas)
  - ✅ Componente LookupCRUD reutilizable + ErrorDisplay
  - ✅ 5 páginas wrapper para lookup
  - ✅ GestionPlanes (CRUD modal completo)
  - ✅ DashboardPage integrado con menú

- [ ] **Sin placeholders:**
  - ✅ Código SQL completo en ambas migraciones
  - ✅ Modelos completos con atributos exactos
  - ✅ Controllers con lógica de validación, transacciones y manejo de errores
  - ✅ Servicios con métodos específicos (no "handleAPI")
  - ✅ Componentes con UI funcional (tabla, modal, formulario, búsqueda)

- [ ] **Consistencia de tipos/nombres:**
  - ✅ `cobrador_numero`, `tipo_plan_numero`, `os_numero` consistentes en modelos y controllers
  - ✅ Endpoints `/api/lookup/:entidad`, `/api/personas`, `/api/planes` consistentes
  - ✅ Props de LookupCRUD: `titulo`, `endpoint`, `campos` consistentes
  - ✅ Nombres de integrantes: `PlanIntegrante`, `plan_integrantes` en BD/modelos, `integrantes` en frontend

---

**Plan completo y guardado.** Dos opciones de ejecución:

1. **Driven por Subagentes (recomendado)** — Despachamos un subagente fresco por tarea, revisamos entre tareas, iteración rápida.

2. **Ejecución Inline** — Ejecutar tareas en esta sesión con superpowers:executing-plans, ejecución por lotes con checkpoints de revisión.

¿Cuál prefieres?

