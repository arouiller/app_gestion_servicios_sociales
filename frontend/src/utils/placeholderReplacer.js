/**
 * Reemplaza placeholders {{placeholder}} con valores de Persona
 * @param {string} content - Contenido con placeholders
 * @param {object} personData - Datos de la Persona
 * @returns {string} - Contenido con placeholders reemplazados
 */
export const replacePlaceholders = (content, personData) => {
  if (!personData || !content) return content;

  let result = content;

  const placeholderMap = {
    '{{numero_afiliado}}': personData.numero_afiliado || '',
    '{{tipo_documento}}': personData.tipo_documento || '',
    '{{numero_documento}}': personData.numero_documento || '',
    '{{titular_apellido}}': personData.apellido || '',
    '{{titular_nombre}}': personData.nombre || '',
    '{{fecha_nacimiento}}': personData.fecha_nacimiento || '',
    '{{obra_social_nombre}}': personData.obra_social_nombre || '',
    '{{tipo_plan_nombre}}': personData.tipo_plan_nombre || '',
    '{{tipo_de_grupo_nombre}}': personData.tipo_de_grupo_nombre || '',
    '{{domicilio}}': personData.domicilio || '',
    '{{localidad_nombre}}': personData.localidad_nombre || '',
    '{{fecha_cobertura}}': personData.fecha_cobertura || '',
    '{{zona_codigo}}': personData.zona_codigo || '',
    '{{valor_cuota}}': personData.valor_cuota || '',
    '{{cuota_social}}': personData.cuota_social || '',
    '{{arancel_por_servicio}}': personData.arancel_por_servicio || '',
    '{{numero_recibo}}': personData.numero_recibo || '',
    '{{periodo}}': personData.periodo || '',
    '{{fecha_generacion}}': new Date().toLocaleDateString('es-AR'),
    '{{empresa_nombre}}': personData.empresa_nombre || '',
    '{{empresa_direccion}}': personData.empresa_direccion || ''
  };

  Object.entries(placeholderMap).forEach(([placeholder, value]) => {
    result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\]/g, '\$&'), 'g'), value);
  });

  return result;
};
