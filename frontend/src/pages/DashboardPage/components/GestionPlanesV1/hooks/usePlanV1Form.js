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
  integrantes: [], // Array of { persona_id, persona, rol }
};

export const usePlanV1Form = (initialData = null) => {
  const [form, setForm] = useState(
    initialData
      ? {
          numero_afiliado: initialData.numero_afiliado
            ? String(initialData.numero_afiliado).padStart(5, '0')
            : '',
          tipo_plan_numero: initialData.tipo_plan_numero || '',
          cobrador_numero: initialData.cobrador_numero || '',
          tipo_de_grupo_numero: initialData.tipo_de_grupo_numero || '',
          os_numero: initialData.os_numero || '',
          estado: initialData.estado || 'ACTIVO',
          valor_cuota: initialData.valor_cuota ? String(initialData.valor_cuota) : '',
          domicilio: initialData.domicilio || '',
          telefono_1: initialData.telefono_1 || '',
          integrantes: initialData.PlanIntegrantes || [],
        }
      : INITIAL_FORM
  );

  const [errors, setErrors] = useState({});

  const handleFieldChange = useCallback((field, value) => {
    if (field === 'integrantes') {
      console.log('[usePlanV1Form] handleFieldChange integrantes:', value.length, 'items', value.map(i => ({ persona_id: i.persona_id, id: i.id })));
      console.trace('[usePlanV1Form] handleFieldChange called from:');
    }
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  const addIntegrante = useCallback((persona, rol = 'adherente') => {
    console.log('[usePlanV1Form] addIntegrante called with:', persona?.numero_documento, rol);
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

  const reorderIntegrantes = useCallback((newIntegrantes) => {
    // Actualizar array reordenado con rol automático por posición
    const integrantesConRol = newIntegrantes.map((integrante, index) => ({
      ...integrante,
      rol: index === 0 ? 'titular' : 'integrante', // Rol automático: primero = titular
    }));

    setForm((prev) => ({
      ...prev,
      integrantes: integrantesConRol,
    }));
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};

    if (!form.numero_afiliado || form.numero_afiliado.trim() === '') {
      newErrors.numero_afiliado = 'Número de afiliado es requerido';
    } else if (!/^\d+$/.test(String(form.numero_afiliado).trim())) {
      newErrors.numero_afiliado = 'Solo se permiten números';
    } else if (parseInt(form.numero_afiliado.trim(), 10) === 0) {
      newErrors.numero_afiliado = 'El número de afiliado no puede ser 0';
    } else if (parseInt(form.numero_afiliado.trim(), 10) > 99999) {
      newErrors.numero_afiliado = 'El número de afiliado no puede superar 99999';
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

    // Check for duplicates: use numero_documento for deferred personas (persona_id === null), persona_id for others
    const identifiers = form.integrantes.map((i) =>
      i.persona_id !== null ? `id:${i.persona_id}` : `doc:${i.persona?.numero_documento}`
    );
    if (new Set(identifiers).size !== identifiers.length) {
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
    reorderIntegrantes,
    validate,
    reset,
    setForm, // Allow direct form updates if needed
    setErrors,
  };
};
