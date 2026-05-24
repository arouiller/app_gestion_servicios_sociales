import React, { useEffect, useState } from 'react';
import { useReciboDesignerStore } from '../../stores/reciboDesigner.store';
import { reciboDesignerService } from '../../services/reciboDesignerService';
import { EditorToolbar } from '../../components/ReciboDesigner/EditorToolbar';
import { ReciboDesignerCanvas } from '../../components/ReciboDesigner/ReciboDesignerCanvas';
import { SidePanel } from '../../components/ReciboDesigner/SidePanel/SidePanel';
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
            pageConfig: {
              size: 'A4',
              orientation: 'portrait',
              pageMargins: { top: 10, right: 10, bottom: 10, left: 10 },
              reciboMargins: { top: 4, right: 4, bottom: 4, left: 4 },
              recibosPerPage: 1,
            },
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
      <div className="recibo-designer-page__loading">
        Cargando template activo...
      </div>
    );
  }

  return (
    <div className="recibo-designer-page">
      <EditorToolbar />
      <div className="recibo-designer-page__body">
        {error && <div className="recibo-designer-page__error">{error}</div>}
        <div className="recibo-designer-page__canvas-area">
          <ReciboDesignerCanvas />
        </div>
        <SidePanel />
      </div>
    </div>
  );
};
