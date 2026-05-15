const fs = require('fs');
const path = require('path');

// Mapeo de servicios a tablas BD
const serviceToTables = {
  'planesV1Service': ['PlanV1', 'PlanIntegrante'],
  'recibosService': ['Recibo', 'ReciboIntegrante', 'PeriodosRecibos'],
  'personasService': ['Persona'],
  'lookupService': ['ObraSocial', 'TipoPlan', 'TipoGrupo', 'Cobrador'],
  'zonaService': ['Zona'],
  'localidadService': ['Localidad'],
  'provinciaService': ['Provincia'],
  'planesIntegrantesService': ['PlanIntegrante'],
  'usuariosService': ['Usuario'],
  'migrationsService': ['migraciones_bd'],
  'authService': ['Usuario']
};

function extractComponentInfo(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const componentName = path.basename(filePath, '.jsx');

  // Extraer imports
  const importRegex = /import\s+(?:{\s*([^}]+)\s*}|([^\s]+))\s+from\s+['"]([^'"]+)['"]/g;
  const imports = {};
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports[match[3]] = match[1] || match[2];
  }

  // Detectar servicios importados
  const services = Object.keys(imports).filter(imp =>
    Object.keys(serviceToTables).some(svc => imp.includes(svc.replace('Service', '')))
  );

  // Extraer hooks usados
  const hooks = new Set();
  const hookRegex = /use[A-Z][a-zA-Z0-9]*/g;
  while ((match = hookRegex.exec(content)) !== null) {
    hooks.add(match[0]);
  }

  // Detectar PropTypes
  const propsMatch = content.match(/(?:\.propTypes\s*=\s*{([^}]+)}|PropTypes\.shape\({([^}]+)})/s);
  const props = [];
  if (propsMatch) {
    const propText = propsMatch[1] || propsMatch[2];
    const propRegex = /(\w+):\s*PropTypes\.(\w+)/g;
    while ((match = propRegex.exec(propText)) !== null) {
      props.push({ name: match[1], type: match[2] });
    }
  }

  // Detectar componentes renderizados (componentes hijos)
  const componentRegex = /<([A-Z][a-zA-Z0-9]*)/g;
  const childComponents = new Set();
  while ((match = componentRegex.exec(content)) !== null) {
    if (match[1] !== 'Fragment' && match[1] !== 'Provider') {
      childComponents.add(match[1]);
    }
  }

  // Detectar contextos
  const contexts = [];
  const contextRegex = /useContext\((\w+)\)/g;
  while ((match = contextRegex.exec(content)) !== null) {
    contexts.push(match[1]);
  }

  return {
    name: componentName,
    path: filePath.replace(/\\/g, '/'),
    props: props,
    hooks: Array.from(hooks),
    services: services,
    contexts: contexts,
    childComponents: Array.from(childComponents),
    tables: services.flatMap(svc => {
      for (const [service, tables] of Object.entries(serviceToTables)) {
        if (svc.includes(service.replace('Service', ''))) {
          return tables;
        }
      }
      return [];
    })
  };
}

function findAllComponents(dir) {
  const components = [];

  function walkDir(currentPath) {
    const files = fs.readdirSync(currentPath);

    files.forEach(file => {
      if (file.startsWith('.')) return;

      const fullPath = path.join(currentPath, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (file.endsWith('.jsx') && !file.includes('.test.')) {
        try {
          const info = extractComponentInfo(fullPath);
          components.push(info);
        } catch (err) {
          console.warn(`Error analyzing ${fullPath}: ${err.message}`);
        }
      }
    });
  }

  walkDir(dir);
  return components;
}

// Analizar componentes
const frontendDir = path.join(__dirname, 'frontend', 'src');
const components = findAllComponents(frontendDir);

console.log(`Encontrados ${components.length} componentes`);

// Crear estructura de datos para visualización
const nodes = components.map((comp, idx) => ({
  id: comp.name,
  label: comp.name,
  color: '#ffe0b2',
  borderWidth: 2,
  borderColor: '#FF9800',
  group: 'components',
  layer: 'Components',
  data: comp
}));

// Crear edges (relaciones padre-hijo)
const edges = [];
const processedPairs = new Set();

components.forEach(comp => {
  comp.childComponents.forEach(childName => {
    const childComp = components.find(c => c.name === childName);
    if (childComp) {
      const pairKey = `${comp.name}-${childName}`;
      if (!processedPairs.has(pairKey)) {
        edges.push({
          from: comp.name,
          to: childName,
          color: '#667eea'
        });
        processedPairs.add(pairKey);
      }
    }
  });
});

// Guardar datos para el HTML
fs.writeFileSync(
  path.join(__dirname, 'COMPONENT_DATA.json'),
  JSON.stringify({ components, nodes, edges }, null, 2)
);

console.log(`Datos guardados en COMPONENT_DATA.json`);
console.log(`Componentes: ${components.length}`);
console.log(`Relaciones: ${edges.length}`);
