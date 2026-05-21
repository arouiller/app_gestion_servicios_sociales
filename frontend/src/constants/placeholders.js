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
