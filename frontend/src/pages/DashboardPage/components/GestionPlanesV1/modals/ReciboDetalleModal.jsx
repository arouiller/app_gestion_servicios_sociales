import React, { useState, useEffect } from 'react';
import recibosService from '../../../../../services/recibosService';
import { formatNumeroAfiliado } from '../../../../../utils/formatters';
import './ReciboDetalleModal.scss';

function ReciboDetalleModal({ reciboId, onClose, reciboData }) {
  const [recibo, setRecibo] = useState(reciboData || null);
  const [loading, setLoading] = useState(!reciboData);

  useEffect(() => {
    if (reciboData) {
      setRecibo(reciboData);
      setLoading(false);
    } else if (reciboId) {
      loadRecibo();
    }
  }, [reciboId, reciboData]);

  const loadRecibo = async () => {
    try {
      setLoading(true);
      const data = await recibosService.getById(reciboId);
      setRecibo(data);
    } catch (err) {
      console.error('Error loading recibo:', err);
      setRecibo(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="recibo-detalle-modal__overlay" onClick={onClose} />
      <div className="recibo-detalle-modal">
        <div className="recibo-detalle-modal__header">
          <h3>Detalle del Recibo</h3>
          <button className="recibo-detalle-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="recibo-detalle-modal__body">
          {loading ? (
            <p className="recibo-detalle-modal__loading">Cargando recibo...</p>
          ) : !recibo ? (
            <p className="recibo-detalle-modal__error">No se pudo cargar el recibo.</p>
          ) : (
            <>
          <div className="recibo-detalle-modal__field-group">
            <div className="recibo-detalle-modal__field">
              <label>Número de Recibo:</label>
              <p>{recibo?.id}</p>
            </div>
            <div className="recibo-detalle-modal__field">
              <label>Período:</label>
              <p>{recibo?.periodo ? new Date(recibo.periodo).toLocaleDateString('es-AR') : '—'}</p>
            </div>
            <div className="recibo-detalle-modal__field">
              <label>Número de Afiliado:</label>
              <p>{formatNumeroAfiliado(recibo?.numero_afiliado)}</p>
            </div>
          </div>

          <div className="recibo-detalle-modal__field-group">
            <div className="recibo-detalle-modal__field">
              <label>Titular:</label>
              <p>{recibo?.titular_apellido}, {recibo?.titular_nombre}</p>
            </div>
            <div className="recibo-detalle-modal__field">
              <label>Obra Social:</label>
              <p>{recibo?.obra_social_nombre}</p>
            </div>
            <div className="recibo-detalle-modal__field">
              <label>Tipo de Plan:</label>
              <p>{recibo?.tipo_plan_nombre}</p>
            </div>
          </div>

          <div className="recibo-detalle-modal__field-group">
            <div className="recibo-detalle-modal__field">
              <label>Tipo de Grupo:</label>
              <p>{recibo?.tipo_de_grupo_nombre}</p>
            </div>
            <div className="recibo-detalle-modal__field">
              <label>Cobrador:</label>
              <p>{recibo?.cobrador_apellido}, {recibo?.cobrador_nombre}</p>
            </div>
          </div>

          <div className="recibo-detalle-modal__field">
            <label>Domicilio:</label>
            <p>{recibo?.domicilio || '—'}</p>
          </div>

          <div className="recibo-detalle-modal__field-group">
            <div className="recibo-detalle-modal__field">
              <label>Valor de Cuota:</label>
              <p className="recibo-detalle-modal__monto">${parseFloat(recibo?.valor_cuota || 0).toFixed(2)}</p>
            </div>
            <div className="recibo-detalle-modal__field">
              <label>Fecha de Emisión:</label>
              <p>{recibo?.fecha_emision ? new Date(recibo.fecha_emision).toLocaleDateString('es-AR') : '—'}</p>
            </div>
          </div>
            </>
          )}
        </div>

        <div className="recibo-detalle-modal__footer">
          <button className="recibo-detalle-modal__btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </>
  );
}

export default ReciboDetalleModal;
