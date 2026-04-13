import React, { useState, useEffect } from 'react';
import planesService from '../../../../services/v1.0/planesService';
import './ListadoPlanes.scss';

const ListadoPlanes = () => {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    estado: 'ACTIVO',
    cobrador: '',
    obraSocial: '',
  });

  useEffect(() => {
    loadPlanes();
  }, [filtros]);

  const loadPlanes = async () => {
    try {
      setLoading(true);
      const data = await planesService.getPlanes({
        estado: filtros.estado || undefined,
        cobrador_numero: filtros.cobrador || undefined,
        os_numero: filtros.obraSocial || undefined,
      });
      setPlanes(data);
    } catch (error) {
      console.error('Error al cargar planes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="listado-planes">
      <h2>Listado de Planes</h2>

      <div className="filtros">
        <select
          name="estado"
          value={filtros.estado}
          onChange={handleFiltroChange}
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="SUSPENDIDO">Suspendido</option>
        </select>
      </div>

      {loading ? (
        <p>Cargando...</p>
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
                <td>{plan.TipoDePlan?.tipo_plan_nombre || 'N/A'}</td>
                <td>{plan.ObraSocial?.os_nombre || 'N/A'}</td>
                <td>{plan.TipoDeGrupo?.tipo_de_grupo_nombre || 'N/A'}</td>
                <td>${plan.valor_cuota || '0.00'}</td>
                <td className={`estado estado-${plan.estado.toLowerCase()}`}>
                  {plan.estado}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No hay planes que coincidan con los filtros</p>
      )}
    </div>
  );
};

export default ListadoPlanes;
