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
