import { useState, useEffect } from 'react';

/**
 * Hook personalizado para debounce de valores.
 * Retrasa la actualización de un valor hasta que el usuario deja de escribir/cambiar.
 *
 * Uso:
 * const [searchText, setSearchText] = useState('');
 * const debouncedSearchText = useDebounce(searchText, 2000);
 *
 * @param {any} value - El valor a debounce
 * @param {number} delay - Tiempo de espera en milisegundos (default: 2000)
 * @returns {any} El valor debouncificado
 */
function useDebounce(value, delay = 2000) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Crear timer que se ejecuta después del delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancelar timer anterior si value cambia antes del delay
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
