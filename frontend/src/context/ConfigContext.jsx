import React, { createContext, useState, useEffect, useRef } from 'react';
import configService from '../services/configService';

export const ConfigContext = createContext();

/**
 * Proveedor centralizado para la configuración de la aplicación
 * Carga una sola vez al montar la app y proporciona a todos los componentes
 * Evita múltiples llamadas a /api/admin/configuracion
 */
export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loadingRef = useRef(false); // Evitar cargas duplicadas

  useEffect(() => {
    // Guarda contra cargas duplicadas (ej: en caso de double-mount)
    if (loadingRef.current) {
      return;
    }
    loadingRef.current = true;

    const loadConfig = async () => {
      try {
        setLoading(true);
        const data = await configService.getConfiguracion();
        setConfig(data);
        setError(null);
      } catch (err) {
        console.error('Error cargando configuración:', err);
        setError(err.message || 'Error al cargar configuración');
        // Mantener defaults si hay error
        setConfig(null);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading, error }}>
      {children}
    </ConfigContext.Provider>
  );
}
