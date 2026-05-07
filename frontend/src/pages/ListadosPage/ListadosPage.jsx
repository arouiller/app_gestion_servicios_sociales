import React, { useState, useEffect } from 'react';
import listadosService from '../../services/listadosService';
import ListadoZona from './components/ListadoZona';
import './ListadosPage.scss';

function ListadosPage() {
  const [listado, setListado] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar listado cuando cambia búsqueda o página
  useEffect(() => {
    loadListado();
  }, [search, page]);

  const loadListado = async () => {
    try {
      setLoading(true);
      const result = await listadosService.getAll(
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

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <div className="listados-page">
      <h1>Listados de Planes</h1>

      <div className="listados-page__filters">
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
      </div>

      {error && <div className="listados-page__error">{error}</div>}

      <ListadoZona
        listado={listado}
        loading={loading}
        onPageChange={handlePageChange}
        currentPage={page}
      />
    </div>
  );
}

export default ListadosPage;
