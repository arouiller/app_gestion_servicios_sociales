import React, { useState, useCallback } from 'react';
import personasService from '../../../../services/personasService';
import planesService from '../../../../services/planesV1Service';
import './BusquedaAfiliados.scss';

const BusquedaAfiliados = () => {
  const [searchText, setSearchText] = useState('');
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [planesPersona, setPlanesPersona] = useState([]);

  const handleSearch = useCallback(async (e) => {
    const value = e.target.value;
    setSearchText(value);
    setError(null);

    if (!value.trim()) {
      setPersonas([]);
      return;
    }

    try {
      setLoading(true);
      const resultado = await personasService.search(value);
      setPersonas(resultado);
    } catch (err) {
      setError('Error en la búsqueda');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectPersona = useCallback(async (persona) => {
    setSelectedPersona(persona);
    try {
      setLoading(true);
      // Obtener planes asociados a esta persona
      const planes = await planesService.getByPersona(persona.id);
      setPlanesPersona(planes);
    } catch (err) {
      console.error('Error al obtener planes:', err);
      setPlanesPersona([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="busqueda-afiliados">
      <h2>Búsqueda de Afiliados</h2>

      <div className="search-box">
        <input
          type="text"
          placeholder="Buscar por apellido, nombre o número de documento..."
          value={searchText}
          onChange={handleSearch}
          disabled={loading}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Tabla de resultados */}
      {personas.length > 0 && !selectedPersona && (
        <table className="personas-table">
          <thead>
            <tr>
              <th>Apellido</th>
              <th>Nombre</th>
              <th>Tipo Doc</th>
              <th>Nro Doc</th>
              <th>Fecha Nac</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {personas.map((persona) => (
              <tr key={persona.id}>
                <td>{persona.apellido}</td>
                <td>{persona.nombre}</td>
                <td>{persona.tipo_documento}</td>
                <td>{persona.numero_documento}</td>
                <td>{new Date(persona.fecha_nacimiento).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn-ver"
                    onClick={() => handleSelectPersona(persona)}
                  >
                    Ver Planes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Detalle de persona y sus planes */}
      {selectedPersona && (
        <div className="persona-detail">
          <button
            className="btn-volver"
            onClick={() => {
              setSelectedPersona(null);
              setPlanesPersona([]);
            }}
          >
            ← Volver
          </button>

          <h3>
            {selectedPersona.nombre} {selectedPersona.apellido}
          </h3>
          <p className="persona-info">
            {selectedPersona.tipo_documento} {selectedPersona.numero_documento} | Nac:{' '}
            {new Date(selectedPersona.fecha_nacimiento).toLocaleDateString()}
          </p>

          {planesPersona.length > 0 ? (
            <table className="planes-table">
              <thead>
                <tr>
                  <th>Nro Afiliado</th>
                  <th>Tipo Plan</th>
                  <th>Obra Social</th>
                  <th>Estado</th>
                  <th>Valor Cuota</th>
                </tr>
              </thead>
              <tbody>
                {planesPersona.map((plan) => (
                  <tr key={plan.plan_numero}>
                    <td>{plan.numero_afiliado}</td>
                    <td>{plan.TipoDePlan?.tipo_plan_nombre || 'N/A'}</td>
                    <td>{plan.ObraSocial?.os_nombre || 'N/A'}</td>
                    <td>{plan.estado}</td>
                    <td>${plan.valor_cuota || '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-planes">Esta persona no tiene planes asociados</p>
          )}
        </div>
      )}

      {personas.length === 0 && searchText && !loading && (
        <p className="no-results">No se encontraron resultados</p>
      )}

      {loading && <p className="loading">Buscando...</p>}
    </div>
  );
};

export default BusquedaAfiliados;
