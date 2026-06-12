import create from 'zustand';

const useTemplateStore = create((set) => {
  // Debounce helper
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  return {
    // State
    currentTemplate: {
      id: null,
      nombre: '',
      descripcion: '',
      bloque_encabezado: null,
      bloque_afiliado: null,
      bloque_detalles: null,
      bloque_pie: null,
      bloque_pageconfig: {
        tamaño: 'A4',
        personalizado_ancho_mm: null,
        personalizado_alto_mm: null,
        orientacion: 'portrait',
        margen_superior_mm: 10,
        margen_derecho_mm: 10,
        margen_inferior_mm: 10,
        margen_izquierdo_mm: 10,
        recibos_por_pagina: 1,
        layout: 'vertical',
        columnas_grilla: 1,
        gap_vertical_mm: 5,
        gap_horizontal_mm: 5
      },
      activo: false,
      usuario_id: null,
      created_at: null,
      updated_at: null
    },
    editingBlock: null,
    isDirty: false,
    isSaving: false,
    previewAfiliado: null,
    templates: [],
    loading: false,
    error: null,

    // Actions
    setCurrentTemplate: (template) =>
      set(() => ({
        currentTemplate: template,
        isDirty: false,
        editingBlock: null
      })),

    updateBloque: (bloqueKey, updates) =>
      set((state) => {
        const updated = {
          ...state.currentTemplate,
          [bloqueKey]: {
            ...state.currentTemplate[bloqueKey],
            ...updates
          }
        };
        return {
          currentTemplate: updated,
          isDirty: true
        };
      }),

    updateTemplate: (updates) =>
      set((state) => ({
        currentTemplate: {
          ...state.currentTemplate,
          ...updates
        },
        isDirty: true
      })),

    setEditingBlock: (blockKey) =>
      set(() => ({
        editingBlock: blockKey
      })),

    setPreviewAfiliado: (persona) =>
      set(() => ({
        previewAfiliado: persona
      })),

    setIsSaving: (isSaving) =>
      set(() => ({
        isSaving
      })),

    setTemplates: (templates) =>
      set(() => ({
        templates
      })),

    setLoading: (loading) =>
      set(() => ({
        loading
      })),

    setError: (error) =>
      set(() => ({
        error
      })),

    resetTemplate: () =>
      set(() => ({
        currentTemplate: {
          id: null,
          nombre: '',
          descripcion: '',
          bloque_encabezado: null,
          bloque_afiliado: null,
          bloque_detalles: null,
          bloque_pie: null,
          bloque_pageconfig: {
            tamaño: 'A4',
            personalizado_ancho_mm: null,
            personalizado_alto_mm: null,
            orientacion: 'portrait',
            margen_superior_mm: 10,
            margen_derecho_mm: 10,
            margen_inferior_mm: 10,
            margen_izquierdo_mm: 10,
            recibos_por_pagina: 1,
            layout: 'vertical',
            columnas_grilla: 1,
            gap_vertical_mm: 5,
            gap_horizontal_mm: 5
          },
          activo: false,
          usuario_id: null,
          created_at: null,
          updated_at: null
        },
        isDirty: false,
        editingBlock: null,
        previewAfiliado: null
      }))
  };
});

export default useTemplateStore;
