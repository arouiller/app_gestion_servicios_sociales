import React, { useEffect, useState } from 'react';
import { useReciboDesignerStore } from '../../stores/reciboDesigner.store';
import { reciboDesignerService } from '../../services/reciboDesignerService';
import { ReciboDesignerToolbar } from '../../components/ReciboDesigner/ReciboDesignerToolbar';
import { ReciboPreview } from '../../components/ReciboDesigner/ReciboPreview';
import '../../components/ReciboDesigner/ReciboDesigner.scss';

export const ReciboDesignerPage = () => {
  const { loadTemplate, error, setError } = useReciboDesignerStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActiveTemplate = async () => {
      try {
        const template = await reciboDesignerService.getActiveTemplate();
        loadTemplate(template);
        setError(null);
      } catch (err) {
        setError(
          err.response?.data?.error || 'Error al cargar template activo'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveTemplate();
  }, [loadTemplate, setError]);

  if (isLoading) {
    return (
      <div className="recibo-designer__loading">
        Cargando template activo...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Diseñador de Templates de Recibos</h1>
      {error && <div className="recibo-designer__error">{error}</div>}
      <div className="recibo-designer">
        <ReciboDesignerToolbar />
        <ReciboPreview />
      </div>
    </div>
  );
};
