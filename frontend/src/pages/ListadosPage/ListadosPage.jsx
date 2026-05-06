import React, { useState, useEffect } from 'react';
import zonaService from '../../services/zonaService';
import listadosService from '../../services/listadosService';
import ListadoZona from './components/ListadoZona';
import './ListadosPage.scss';

function ListadosPage() {
  const [zonas, setZonas] = useState([]);
  const [selectedZona, setSelectedZona] = useState(null);
  const [listado, setListado] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar zonas al montar
  useEffect(() => {
    loadZonas();
  }, []);

  const loadZonas = async () => {
    try {
      const result = await zonaService.getAll();
      setZonas(result.data || []);
    } catch (err) {
      console.error('Error loading zonas:', err);
      setError('Error al cargar zonas');
    }
  };

  // Cargar listado cuando cambia zona, búsqueda o página
  useEffect(() => {
    if (selectedZona) {
      loadListado();
    }
  }, [selectedZona, search, page]);

  const loadListado = async () => {
    if (!selectedZona) return;

    try {
      setLoading(true);
      const result = await listadosService.getPorZona(
        selectedZona,
        search,
        page,
        10
      );
      setListado(result);
      setError(null);
    } catch (err) {
      console.error('Error loading listado:', err);
      setError('Error al cargar listado');
    } finally {
      setLoading(false);
    }
  };

  const handleZonaChange = (e) => {
    setSelectedZona(parseInt(e.target.value) || null);
    setPage(1);
    setSearch('');
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div className="listados-page">
      <h1>Listados por Zona</h1>

      <div className="listados-page__filters">
        <div className="listados-page__filter-group">
          <label htmlFor="zona-select">Seleccionar Zona:</label>
          <select
            id="zona-select"
            value={selectedZona || ''}
            onChange={handleZonaChange}
          >
            <option value="">-- Seleccionar zona --</option>
            {zonas.map((zona) => (
              <option key={zona.id} value={zona.id}>
                {zona.nombre} ({zona.provincia?.nombre})
              </option>
            ))}
          </select>
        </div>

        {selectedZona && (
          <div className="listados-page__filter-group">
            <label htmlFor="search-input">Buscar:</label>
            <input
              id="search-input"
              type="text"
              placeholder="Plan #, Tipo, ..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        )}
      </div>

      {error && <div className="listados-page__error">{error}</div>}

      {selectedZona && (
        <ListadoZona
          listado={listado}
          loading={loading}
          onPageChange={handlePageChange}
          currentPage={page}
        />
      )}
    </div>
  );
}

export default ListadosPage;
