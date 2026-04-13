import React, { useState, useEffect } from 'react';
import lookupService from '../../../../services/lookupService';
import planesService from '../../../../services/planesService';
import './PlanesPorCobrador.scss';

const PlanesPorCobrador = () => {
  const [cobradores, setCobradores] = useState([]);
  const [selectedCobrador, setSelectedCobrador] = useState('');
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCobradores();
  }, []);

  const loadCobradores = async () => {
    try {
      const data = await lookupService.getByEntity('cobradores');
      setCobradores(data);
    } catch (error) {
      console.error('Error al cargar cobradores:', error);
    }
  };

  const handleCobradoSelect = async (cobradorNum) => {
    setSelectedCobrador(cobradorNum);
    if (!cobradorNum) {
      setPlanes([]);
      return;
    }

    try {
      setLoading(true);
      const data = await planesService.getPlanes({
        cobrador_numero: cobradorNum,
      });
      setPlanes(data);
    } catch (error) {
      console.error('Error al cargar planes:', error);
      setPlanes([]);
    } finally {
      setLoading(false);
    }
  };

  const selectedCobradore = cobradores.find(
    (c) => c.cobrador_numero === parseInt(selectedCobrador)
  );

  return (
    <div className="planes-por-cobrador">
      <h2>Planes por Cobrador</h2>

      <div className="selector">
        <label>Seleccionar Cobrador:</label>
        <select
          value={selectedCobrador}
          onChange={(e) => handleCobradoSelect(e.target.value)}
        >
          <option value="">-- Elegir cobrador --</option>
          {cobradores.map((cobrador) => (
            <option key={cobrador.cobrador_numero} value={cobrador.cobrador_numero}>
              {cobrador.cobrador_apellido}, {cobrador.cobrador_nombre}
            </option>
          ))}
        </select>
      </div>

      {selectedCobradore && (
        <div className="cobrador-info">
          <h3>
            {selectedCobradore.cobrador_apellido},{' '}
            {selectedCobradore.cobrador_nombre}
          </h3>
        </div>
      )}

      {loading ? (
        <p>Cargando planes...</p>
      ) : planes.length > 0 ? (
        <table className="planes-table">
          <thead>
            <tr>
              <th>Nro Afiliado</th>
              <th>Tipo Plan</th>
              <th>Obra Social</th>
              <th>Tipo Grupo</th>
              <th>Valor Cuota</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {planes.map((plan) => (
              <tr key={plan.plan_numero}>
                <td>{plan.numero_afiliado}</td>
                <td>{plan.tipo_plan_nombre}</td>
                <td>{plan.obra_social_nombre}</td>
                <td>{plan.tipo_grupo_nombre}</td>
                <td>${plan.valor_cuota}</td>
                <td className={`estado estado-${plan.estado.toLowerCase()}`}>
                  {plan.estado}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : selectedCobrador ? (
        <p>No hay planes para este cobrador</p>
      ) : (
        <p>Selecciona un cobrador para ver sus planes</p>
      )}
    </div>
  );
};

export default PlanesPorCobrador;
