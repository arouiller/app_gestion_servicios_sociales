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

  // Limpiar claves numéricas corruptas de un objeto
  const cleanNumericKeys = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    return Object.keys(obj)
      .filter(key => isNaN(key)) // Solo claves NO numéricas
      .reduce((clean, key) => {
        clean[key] = obj[key];
        return clean;
      }, {});
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
    setCurrentTemplate: (template) => {
      // Parsear bloque_pageconfig si es string (viene así del API)
      let parsedTemplate = { ...template };
      if (typeof parsedTemplate.bloque_pageconfig === 'string') {
        try {
          parsedTemplate.bloque_pageconfig = JSON.parse(parsedTemplate.bloque_pageconfig);
        } catch (e) {
          console.error('Error parsing bloque_pageconfig:', e);
          parsedTemplate.bloque_pageconfig = {};
        }
      }
      // Limpiar claves numéricas corruptas
      parsedTemplate.bloque_pageconfig = cleanNumericKeys(parsedTemplate.bloque_pageconfig);

      return set(() => ({
        currentTemplate: parsedTemplate,
        isDirty: false,
        editingBlock: null
      }));
    },

    updateBloque: (bloqueKey, updates) =>
      set((state) => {
        // Parsear bloque si es string (especialmente para bloque_pageconfig)
        let bloqueValue = state.currentTemplate[bloqueKey];
        if (typeof bloqueValue === 'string') {
          try {
            bloqueValue = JSON.parse(bloqueValue);
          } catch (e) {
            console.error(`Error parsing ${bloqueKey}:`, e);
            bloqueValue = {};
          }
        }

        // Limpiar claves numéricas corruptas
        bloqueValue = cleanNumericKeys(bloqueValue);

        const updated = {
          ...state.currentTemplate,
          [bloqueKey]: {
            ...bloqueValue,
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
