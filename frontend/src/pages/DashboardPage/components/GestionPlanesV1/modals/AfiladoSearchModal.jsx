import React, { useState } from 'react';
import personasService from '../../../../../services/personasService';
import './AfiladoSearchModal.scss';

function AfiladoSearchModal({ onClose, onSelect }) {
  const [searchParams, setSearchParams] = useState({ nombre: '', apellido: '', numero_documento: '' });
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPersona, setNewPersona] = useState({
    nombre: '',
    apellido: '',
    tipo_documento: 'DNI',
    numero_documento: '',
    fecha_nacimiento: '',
    fecha_cobertura: '',
  });

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await personasService.buscar(searchParams);
      setResults(Array.isArray(data) ? data : []);
      setSearched(true);
    } catch (err) {
      console.error('Error searching personas:', err);
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (persona) => {
    onSelect(persona);
  };

  const handleCreatePersona = async () => {
    setLoading(true);
    try {
      const persona = await personasService.crear(newPersona);
      onSelect(persona);
    } catch (err) {
      console.error('Error creating persona:', err);
      alert('Error al crear afiliado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="afiliado-search-modal__overlay" onClick={onClose} />
      <div className="afiliado-search-modal">
        <div className="afiliado-search-modal__header">
          <h3>Buscar Afiliado</h3>
          <button className="afiliado-search-modal__close" onClick={onClose}>✕</button>
        </div>

        {!showCreateForm ? (
          <div className="afiliado-search-modal__body">
            <div className="afiliado-search-modal__search">
              <input
                type="text"
                placeholder="Nombre"
                value={searchParams.nombre}
                onChange={(e) => setSearchParams({ ...searchParams, nombre: e.target.value })}
              />
              <input
                type="text"
                placeholder="Apellido"
                value={searchParams.apellido}
                onChange={(e) => setSearchParams({ ...searchParams, apellido: e.target.value })}
              />
              <input
                type="text"
                placeholder="DNI"
                value={searchParams.numero_documento}
                onChange={(e) => setSearchParams({ ...searchParams, numero_documento: e.target.value })}
              />
              <button className="afiliado-search-modal__btn" onClick={handleSearch} disabled={loading}>
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            {searched && (
              <>
                {results.length === 0 ? (
                  <div className="afiliado-search-modal__empty">
                    <p>No encontramos resultados.</p>
                    <button
                      className="afiliado-search-modal__btn afiliado-search-modal__btn--secondary"
                      onClick={() => setShowCreateForm(true)}
                    >
                      + Crear nuevo afiliado
                    </button>
                  </div>
                ) : (
                  <table className="afiliado-search-modal__resultados">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>DNI</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((p) => (
                        <tr key={p.id}>
                          <td>{p.nombre}</td>
                          <td>{p.apellido}</td>
                          <td>{p.numero_documento}</td>
                          <td>
                            <button
                              className="afiliado-search-modal__btn-select"
                              onClick={() => handleSelect(p)}
                            >
                              Seleccionar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {results.length > 0 && (
                  <button
                    className="afiliado-search-modal__btn afiliado-search-modal__btn--secondary"
                    onClick={() => setShowCreateForm(true)}
                  >
                    + Crear nuevo afiliado
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="afiliado-search-modal__body">
            <div className="afiliado-search-modal__form">
              <div className="afiliado-search-modal__field">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={newPersona.nombre}
                  onChange={(e) => setNewPersona({ ...newPersona, nombre: e.target.value })}
                />
              </div>
              <div className="afiliado-search-modal__field">
                <label>Apellido *</label>
                <input
                  type="text"
                  value={newPersona.apellido}
                  onChange={(e) => setNewPersona({ ...newPersona, apellido: e.target.value })}
                />
              </div>
              <div className="afiliado-search-modal__field">
                <label>Tipo de Documento *</label>
                <select
                  value={newPersona.tipo_documento}
                  onChange={(e) => setNewPersona({ ...newPersona, tipo_documento: e.target.value })}
                >
                  <option value="DNI">DNI</option>
                  <option value="LC">LC</option>
                  <option value="LE">LE</option>
                  <option value="PASAPORTE">PASAPORTE</option>
                </select>
              </div>
              <div className="afiliado-search-modal__field">
                <label>Número de Documento *</label>
                <input
                  type="text"
                  value={newPersona.numero_documento}
                  onChange={(e) => setNewPersona({ ...newPersona, numero_documento: e.target.value })}
                />
              </div>
              <div className="afiliado-search-modal__field">
                <label>Fecha de Nacimiento *</label>
                <input
                  type="date"
                  value={newPersona.fecha_nacimiento}
                  onChange={(e) => setNewPersona({ ...newPersona, fecha_nacimiento: e.target.value })}
                />
              </div>
              <div className="afiliado-search-modal__field">
                <label>Fecha de Cobertura *</label>
                <input
                  type="date"
                  value={newPersona.fecha_cobertura}
                  onChange={(e) => setNewPersona({ ...newPersona, fecha_cobertura: e.target.value })}
                />
              </div>
            </div>

            <div className="afiliado-search-modal__footer">
              <button className="afiliado-search-modal__btn" onClick={handleCreatePersona} disabled={loading}>
                {loading ? 'Creando...' : 'Crear y Agregar'}
              </button>
              <button
                className="afiliado-search-modal__btn afiliado-search-modal__btn--secondary"
                onClick={() => setShowCreateForm(false)}
              >
                Volver
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default AfiladoSearchModal;
