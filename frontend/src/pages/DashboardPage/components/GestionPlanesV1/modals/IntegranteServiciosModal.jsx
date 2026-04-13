import React, { useState, useEffect } from 'react';
import integranteServiciosService from '../../../../../services/integranteServiciosService';
import './IntegranteServiciosModal.scss';

function IntegranteServiciosModal({ planIntegranteId, onClose }) {
  const [servicios, setServicios] = useState([]);
  const [selectedServicios, setSelectedServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [planIntegranteId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all available services
      const allServicios = await integranteServiciosService.listarServicios();
      setServicios(allServicios || []);

      // Load services for this integrante
      const asignados = await integranteServiciosService.obtenerServiciosIntegrante(planIntegranteId);
      setSelectedServicios(asignados.map(s => s.servicio_numero) || []);
    } catch (err) {
      console.error('Error loading services:', err);
      setError('Error al cargar los servicios');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceChange = (servicioNumero, isChecked) => {
    if (isChecked) {
      setSelectedServicios(prev => [...prev, servicioNumero]);
    } else {
      setSelectedServicios(prev => prev.filter(s => s !== servicioNumero));
    }
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      // Get current services
      const currentServicios = await integranteServiciosService.obtenerServiciosIntegrante(planIntegranteId);
      const currentNumbers = currentServicios.map(s => s.servicio_numero);

      // Delete removed services
      for (const servicioNum of currentNumbers) {
        if (!selectedServicios.includes(servicioNum)) {
          await integranteServiciosService.eliminarServicio(planIntegranteId, servicioNum);
        }
      }

      // Add new services
      for (const servicioNum of selectedServicios) {
        if (!currentNumbers.includes(servicioNum)) {
          await integranteServiciosService.agregarServicio(planIntegranteId, servicioNum);
        }
      }

      onClose();
    } catch (err) {
      console.error('Error saving services:', err);
      setError('Error al guardar los servicios');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="integrante-servicios-modal__overlay" onClick={onClose} />
      <div className="integrante-servicios-modal">
        <div className="integrante-servicios-modal__header">
          <h3>Servicios del Integrante</h3>
          <button className="integrante-servicios-modal__close" onClick={onClose}>✕</button>
        </div>

        <div className="integrante-servicios-modal__body">
          {error && <div className="integrante-servicios-modal__error">{error}</div>}

          {loading ? (
            <p>Cargando servicios...</p>
          ) : servicios.length === 0 ? (
            <p className="integrante-servicios-modal__empty">No hay servicios disponibles</p>
          ) : (
            <div className="integrante-servicios-modal__servicios-list">
              {servicios.map((servicio) => (
                <label key={servicio.servicio_numero} className="integrante-servicios-modal__servicio-item">
                  <input
                    type="checkbox"
                    checked={selectedServicios.includes(servicio.servicio_numero)}
                    onChange={(e) => handleServiceChange(servicio.servicio_numero, e.target.checked)}
                    disabled={saving}
                  />
                  <span>{servicio.servicio_nombre}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="integrante-servicios-modal__footer">
          <button
            className="integrante-servicios-modal__btn integrante-servicios-modal__btn--primary"
            onClick={handleGuardar}
            disabled={saving || loading}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            className="integrante-servicios-modal__btn integrante-servicios-modal__btn--secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
        </div>
      </div>
    </>
  );
}

export default IntegranteServiciosModal;
