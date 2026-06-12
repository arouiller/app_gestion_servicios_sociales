import React, { useState, useEffect } from 'react';
import templateService from '../../../services/templateService';
import useTemplateStore from '../../../hooks/useTemplateStore';
import AfililadoSelector from './AfililadoSelector';

const TemplatePreview = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentTemplate = useTemplateStore((state) => state.currentTemplate);
  const previewAfiliado = useTemplateStore((state) => state.previewAfiliado);
  const setPreviewAfiliado = useTemplateStore((state) => state.setPreviewAfiliado);

  const getDummyData = () => ({
    numero_afiliado: '0001',
    titular_nombre: 'Juan',
    titular_apellido: 'Pérez',
    obra_social_nombre: 'OSDE',
    tipo_plan_nombre: 'Plan Superior',
    valor_cuota: '$250.50',
    numero_recibo: 'REC-20260612-001',
    periodo: '2026-06'
  });

  const personaData = previewAfiliado || getDummyData();

  const handleViewPdf = async () => {
    setLoading(true);
    const result = await templateService.generatePdf(currentTemplate.id, null, true);
    if (result.success) {
      const url = window.URL.createObjectURL(new Blob([result.blob]));
      window.open(url);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleDownloadPdf = async () => {
    setLoading(true);
    const result = await templateService.generatePdf(currentTemplate.id, null, true);
    if (result.success) {
      const url = window.URL.createObjectURL(new Blob([result.blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recibo_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="template-preview">
      <h3>Vista Previa</h3>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="preview-selector">
        <AfililadoSelector onSelect={setPreviewAfiliado} />
        {!previewAfiliado && (
          <span className="preview-hint">Usando datos de ejemplo</span>
        )}
      </div>

      <div className="preview-content">
        {currentTemplate.bloque_encabezado && (
          <div className="preview-section encabezado">
            {currentTemplate.bloque_encabezado.empresa_nombre && (
              <h2>{currentTemplate.bloque_encabezado.empresa_nombre}</h2>
            )}
            {currentTemplate.bloque_encabezado.empresa_direccion && (
              <p>{currentTemplate.bloque_encabezado.empresa_direccion}</p>
            )}
          </div>
        )}

        {currentTemplate.bloque_afiliado && (
          <div className="preview-section afiliado">
            <table>
              <tbody>
                {currentTemplate.bloque_afiliado.filas?.map((fila, idx) => (
                  <tr key={idx}>
                    <td className="label">{fila.etiqueta}:</td>
                    <td className="value">{personaData[fila.placeholder] || fila.placeholder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {currentTemplate.bloque_detalles && (
          <div className="preview-section detalles">
            <table border="1">
              <tbody>
                {currentTemplate.bloque_detalles.filas?.map((fila, idx) => (
                  <tr key={idx}>
                    <td className="label">{fila.etiqueta}</td>
                    <td className="value">{personaData[fila.placeholder] || fila.placeholder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {currentTemplate.bloque_pie && (
          <div className="preview-section pie">
            {currentTemplate.bloque_pie.aclaracion && (
              <p className="aclaracion">{currentTemplate.bloque_pie.aclaracion}</p>
            )}
            {currentTemplate.bloque_pie.mostrar_linea_firma && (
              <div className="firma-line"></div>
            )}
          </div>
        )}
      </div>

      <div className="preview-actions">
        <button
          className="btn btn-info"
          onClick={handleViewPdf}
          disabled={loading}
        >
          📄 Ver PDF
        </button>
        <button
          className="btn btn-download"
          onClick={handleDownloadPdf}
          disabled={loading}
        >
          ⬇️ Descargar
        </button>
      </div>
    </div>
  );
};

export default TemplatePreview;
