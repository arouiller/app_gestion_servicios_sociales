import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const AfililadoSelector = ({ onSelect }) => {
  const [afiliados, setAfiliados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    loadAfiliados();
  }, []);

  const loadAfiliados = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/personas?limit=100');
      if (response.data.success && response.data.data) {
        setAfiliados(response.data.data);
      } else {
        setError('No hay afiliados en el sistema');
      }
    } catch (err) {
      setError('Error cargando afiliados');
      console.warn('Error loading afiliados, using dummy data:', err.message);
    }
    setLoading(false);
  };

  const handleSelect = (e) => {
    const id = e.target.value;
    setSelectedId(id);

    if (id) {
      const selected = afiliados.find((a) => a.id === Number(id));
      if (selected) {
        onSelect(selected);
      }
    } else {
      onSelect(null);
    }
  };

  return (
    <div className="afiliado-selector">
      <label htmlFor="afiliado-select">Afiliado de Ejemplo:</label>
      <select
        id="afiliado-select"
        value={selectedId}
        onChange={handleSelect}
        disabled={loading}
        className="input"
      >
        <option value="">-- Datos de Ejemplo --</option>
        {afiliados.map((a) => (
          <option key={a.id} value={a.id}>
            {a.numero_afiliado} - {a.apellido}, {a.nombre}
          </option>
        ))}
      </select>
      {error && !afiliados.length && (
        <small className="text-muted">⚠️ {error}</small>
      )}
    </div>
  );
};

export default AfililadoSelector;
