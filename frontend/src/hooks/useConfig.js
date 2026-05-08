import { useContext } from 'react';
import { ConfigContext } from '../context/ConfigContext';

/**
 * Hook para acceder a la configuración centralizada
 * @returns {Object} { config, loading, error }
 */
export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig debe usarse dentro de ConfigProvider');
  }
  return context;
}
