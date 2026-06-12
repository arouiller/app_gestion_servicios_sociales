import React, { useState, useEffect, useRef } from 'react';
import html2pdf from 'html2pdf.js';
import useTemplateStore from '../../../hooks/useTemplateStore';
import AfililadoSelector from './AfililadoSelector';

const TemplatePreview = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const previewRef = useRef(null);

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

  const replacePlaceholder = (text) => {
    if (!text) return '';
    return text.replace(/\{\{(\w+)\}\}/g, (match, placeholder) => {
      const value = personaData[placeholder];
      return value !== undefined && value !== null ? String(value) : match;
    });
  };

  const getBlockStyle = (blockName) => {
    const positions = currentTemplate.bloque_positions || {};
    const pos = positions[blockName];
    if (!pos) return {};

    return {
      position: 'absolute',
      left: `${pos.x}mm`,
      top: `${pos.y}mm`,
      width: `${pos.width}mm`,
      height: `${pos.height}mm`
    };
  };

  const handleViewPdf = () => {
    if (!previewRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const options = {
        margin: 10,
        filename: `recibo_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };

      html2pdf()
        .set(options)
        .from(previewRef.current)
        .outputPdf('dataurlstring')
        .then((pdfDataUrl) => {
          window.open(pdfDataUrl, '_blank');
          setLoading(false);
        })
        .catch((err) => {
          setError('Error generando PDF: ' + err.message);
          setLoading(false);
        });
    } catch (err) {
      setError('Error generando PDF: ' + err.message);
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!previewRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const options = {
        margin: 10,
        filename: `recibo_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };

      html2pdf()
        .set(options)
        .from(previewRef.current)
        .save()
        .then(() => {
          setLoading(false);
        })
        .catch((err) => {
          setError('Error descargando PDF: ' + err.message);
          setLoading(false);
        });
    } catch (err) {
      setError('Error descargando PDF: ' + err.message);
      setLoading(false);
    }
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

      <div className="a4-preview" ref={previewRef} style={{ position: 'relative', width: '210mm', height: '297mm', background: 'white', margin: '20px auto', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {currentTemplate.bloque_encabezado && (
          <div className="preview-section encabezado" style={getBlockStyle('encabezado')}>
            {currentTemplate.bloque_encabezado.empresa_nombre && (
              <h2>{currentTemplate.bloque_encabezado.empresa_nombre}</h2>
            )}
            {currentTemplate.bloque_encabezado.empresa_direccion && (
              <p>{currentTemplate.bloque_encabezado.empresa_direccion}</p>
            )}
          </div>
        )}

        {currentTemplate.bloque_afiliado && (
          <div className="preview-section afiliado" style={getBlockStyle('afiliado')}>
            <table>
              <tbody>
                {currentTemplate.bloque_afiliado.filas?.map((fila, idx) => (
                  <tr key={idx}>
                    <td className="label">{fila.etiqueta}:</td>
                    <td className="value">{replacePlaceholder(fila.placeholder)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {currentTemplate.bloque_detalles && (
          <div className="preview-section detalles" style={getBlockStyle('detalles')}>
            <table border="1">
              <tbody>
                {currentTemplate.bloque_detalles.filas?.map((fila, idx) => (
                  <tr key={idx}>
                    <td className="label">{fila.etiqueta}</td>
                    <td className="value">{replacePlaceholder(fila.placeholder)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {currentTemplate.bloque_pie && (
          <div className="preview-section pie" style={getBlockStyle('pie')}>
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
