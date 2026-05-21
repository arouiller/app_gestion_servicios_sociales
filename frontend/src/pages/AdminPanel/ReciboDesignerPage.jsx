import React, { useEffect, useState } from 'react';
import { useReciboDesignerStore } from '../../stores/reciboDesigner.store';
import { reciboDesignerService } from '../../services/reciboDesignerService';
import { ReciboDesignerToolbar } from '../../components/ReciboDesigner/ReciboDesignerToolbar';
import { ReciboPreview } from '../../components/ReciboDesigner/ReciboPreview';
import '../../components/ReciboDesigner/ReciboDesigner.scss';

export const ReciboDesignerPage = () => {
  const { loadTemplate, error, setError, currentTemplate } = useReciboDesignerStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActiveTemplate = async () => {
      try {
        const template = await reciboDesignerService.getActiveTemplate();
        loadTemplate(template);
        setError(null);
      } catch (err) {
        if (err.response?.status === 404) {
          // Sin template activo, crear uno nuevo vacío
          loadTemplate({
            id: null,
            nombre: 'Nuevo Template',
            html: '<table></table>',
            pageSize: 'A4',
            orientation: 'portrait',
            margins: 8,
            activo: false,
            templateGroupId: null,
            versionNumber: 1,
          });
          setError(null);
        } else {
          setError(
            err.response?.data?.error || 'Error al cargar template activo'
          );
        }
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
      {!currentTemplate && <div className="recibo-designer__warning">Crear nuevo template</div>}
      {error && <div className="recibo-designer__error">{error}</div>}
      <div className="recibo-designer">
        <ReciboDesignerToolbar />
        <ReciboPreview />
      </div>
    </div>
  );
};
