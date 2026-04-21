import { useState, useCallback } from 'react';

const INITIAL_FORM = {
  numero_afiliado: '',
  tipo_plan_numero: '',
  cobrador_numero: '',
  tipo_de_grupo_numero: '',
  os_numero: '',
  estado: 'ACTIVO',
  valor_cuota: '',
  domicilio: '',
  telefono_1: '',
  zona: 0,
  integrantes: [], // Array of { persona_id, persona, rol }
};

export const usePlanV1Form = (initialData = null) => {
  const [form, setForm] = useState(
    initialData
      ? {
          numero_afiliado: initialData.numero_afiliado || '',
          tipo_plan_numero: initialData.tipo_plan_numero || '',
          cobrador_numero: initialData.cobrador_numero || '',
          tipo_de_grupo_numero: initialData.tipo_de_grupo_numero || '',
          os_numero: initialData.os_numero || '',
          estado: initialData.estado || 'ACTIVO',
          valor_cuota: initialData.valor_cuota ? String(initialData.valor_cuota) : '',
          domicilio: initialData.domicilio || '',
          telefono_1: initialData.telefono_1 || '',
          zona: initialData.zona ?? 0,
          integrantes: initialData.PlanIntegrantes || [],
        }
      : INITIAL_FORM
  );

  const [errors, setErrors] = useState({});

  const handleFieldChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const addIntegrante = useCallback((persona, rol = 'adherente') => {
    setForm((prev) => ({
      ...prev,
      integrantes: [
        ...prev.integrantes,
        {
          id: null,
          persona_id: persona.id,
          persona,
          rol,
        },
      ],
    }));
  }, []);

  const removeIntegrante = useCallback((personaId) => {
    setForm((prev) => ({
      ...prev,
      integrantes: prev.integrantes.filter((i) => i.persona_id !== personaId),
    }));
  }, []);

  const updateIntegranteRol = useCallback((personaId, newRol) => {
    setForm((prev) => ({
      ...prev,
      integrantes: prev.integrantes.map((i) =>
        i.persona_id === personaId ? { ...i, rol: newRol } : i
      ),
    }));
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};

    if (!form.numero_afiliado || form.numero_afiliado.trim() === '') {
      newErrors.numero_afiliado = 'Número de afiliado es requerido';
    } else if (!/^\d+$/.test(String(form.numero_afiliado).trim())) {
      newErrors.numero_afiliado = 'Solo se permiten números';
    }
    if (!form.tipo_plan_numero) {
      newErrors.tipo_plan_numero = 'Tipo de Plan es requerido';
    }
    if (!form.cobrador_numero) {
      newErrors.cobrador_numero = 'Cobrador es requerido';
    }
    if (!form.tipo_de_grupo_numero) {
      newErrors.tipo_de_grupo_numero = 'Tipo de Grupo es requerido';
    }
    if (!form.os_numero) {
      newErrors.os_numero = 'Obra Social es requerida';
    }
    if (!form.valor_cuota || isNaN(parseFloat(form.valor_cuota))) {
      newErrors.valor_cuota = 'Valor de Cuota es requerido y debe ser un número';
    }

    // Validate at least 1 titular
    const hasTitular = form.integrantes.some((i) => i.rol === 'titular');
    if (!hasTitular) {
      newErrors.integrantes = 'Debe haber al menos un afiliado como Titular';
    }

    // Check for duplicates
    const personaIds = form.integrantes.map((i) => i.persona_id);
    if (new Set(personaIds).size !== personaIds.length) {
      newErrors.integrantes = 'No puedes agregar el mismo afiliado dos veces';
    }

    setErrors(newErrors);
    return newErrors;
  }, [form]);

  const reset = useCallback(() => {
    setForm(INITIAL_FORM);
    setErrors({});
  }, []);

  return {
    form,
    errors,
    handleFieldChange,
    addIntegrante,
    removeIntegrante,
    updateIntegranteRol,
    validate,
    reset,
    setForm, // Allow direct form updates if needed
    setErrors,
  };
};
