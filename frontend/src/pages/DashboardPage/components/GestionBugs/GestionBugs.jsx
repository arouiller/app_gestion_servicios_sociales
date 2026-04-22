import React, { useCallback, useEffect, useState } from 'react';
import bugsService from '../../../../services/bugsService';
import SearchContainer from '../../../../components/SearchContainer/SearchContainer';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import IconButton from '../../../../components/IconButton/IconButton';
import StatusBadge from '../../../../components/StatusBadge/StatusBadge';
import Pagination from '../../../../components/Pagination/Pagination';
import useDebounce from '../../../../hooks/useDebounce';
import usePagination from '../../../../hooks/usePagination';
import BugFormModal from './modals/BugFormModal';
import BugDetalleModal from './modals/BugDetalleModal';
import '../../../../styles/_table-standard.scss';
import './GestionBugs.scss';

function GestionBugs() {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detalleModalId, setDetalleModalId] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [searchText, setSearchText] = useState('');
  const [forceSearchNow, setForceSearchNow] = useState(false);

  const debouncedSearchText = useDebounce(searchText, 2000);

  const cargar = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const params = {};
      if (filtroEstado) params.estado = filtroEstado;
      if (debouncedSearchText) params.search = debouncedSearchText;
      const data = await bugsService.listar(params);
      setBugs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar bugs:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar bugs');
      setBugs([]);
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, debouncedSearchText]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const mostrarMensaje = (texto, tipo = 'success') => {
    if (tipo === 'success') {
      setSuccess(texto);
      setTimeout(() => setSuccess(null), 4000);
    } else if (tipo === 'error') {
      setError(texto);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setForceSearchNow(true);
      setTimeout(() => setForceSearchNow(false), 0);
    }
  };

  const handleFormSave = () => {
    setFormModalOpen(false);
    mostrarMensaje('Bug reportado exitosamente', 'success');
    cargar();
  };

  const handleEstadoChanged = () => {
    cargar();
  };

  const effectiveSearchText = forceSearchNow ? searchText : debouncedSearchText;
  const bugsFiltered = bugs
    .filter((bug) => {
      const searchLower = effectiveSearchText.toLowerCase();
      return (
        bug.numero?.toLowerCase().includes(searchLower) ||
        bug.titulo?.toLowerCase().includes(searchLower) ||
        bug.descripcion?.toLowerCase().includes(searchLower) ||
        bug.usuario?.nombre?.toLowerCase().includes(searchLower) ||
        bug.usuario?.apellido?.toLowerCase().includes(searchLower)
      );
    });

  const pagination = usePagination(bugsFiltered, 15);

  // Reiniciar paginación cuando se filtra
  useEffect(() => {
    pagination.resetPage();
  }, [effectiveSearchText, filtroEstado]);

  if (loading) {
    return <div className="gestion-bugs__loading">Cargando bugs...</div>;
  }

  return (
    <div className="gestion-bugs">
      <div className="gestion-bugs__header">
        <h2 className="gestion-bugs__title">Gestión de Bugs</h2>
        <ActionButton variant="primary" icon="+" onClick={() => setFormModalOpen(true)}>
          Reportar Bug
        </ActionButton>
      </div>

      {error && <div className="gestion-bugs__alert gestion-bugs__alert--error">{error}</div>}
      {success && <div className="gestion-bugs__alert gestion-bugs__alert--success">{success}</div>}

      {bugs.length > 0 && (
        <div className="gestion-bugs__filters">
          <select
            className="gestion-bugs__filter-estado"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="REGISTRADO">Registrado</option>
            <option value="DESARROLLADO">Desarrollado</option>
            <option value="DESESTIMADO">Desestimado</option>
            <option value="CERRADO">Cerrado</option>
          </select>

          <SearchContainer
            placeholder="Buscar por número, título, descripción o autor..."
            value={searchText}
            onChange={setSearchText}
            onKeyDown={handleSearchKeyDown}
            count={bugsFiltered.length}
            maxItems={bugsFiltered.length}
          />
        </div>
      )}

      {bugs.length === 0 ? (
        <p className="gestion-bugs__empty">No hay bugs reportados.</p>
      ) : (
        <div className="table-wrapper">
          <table className="table-standard gestion-bugs__tabla">
            <thead>
              <tr>
                <th>Número</th>
                <th>Título</th>
                <th>Reportado por</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedItems.map((bug) => (
                <tr key={bug.id}>
                  <td>{bug.numero}</td>
                  <td>{bug.titulo || '—'}</td>
                  <td>{bug.usuario?.apellido}, {bug.usuario?.nombre}</td>
                  <td>{new Date(bug.fecha_creacion).toLocaleDateString('es-AR')}</td>
                  <td>
                    <StatusBadge status={bug.estado.toLowerCase()} />
                  </td>
                  <td className="table-actions">
                    <IconButton
                      icon="view"
                      title="Ver detalle"
                      onClick={() => setDetalleModalId(bug.id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.showPagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.handleChangePage}
          onItemsPerPageChange={pagination.handleChangeItemsPerPage}
        />
      )}

      {formModalOpen && (
        <BugFormModal onClose={() => setFormModalOpen(false)} onSave={handleFormSave} />
      )}

      {detalleModalId && (
        <BugDetalleModal
          bugId={detalleModalId}
          onClose={() => setDetalleModalId(null)}
          onEstadoChanged={handleEstadoChanged}
        />
      )}
    </div>
  );
}

export default GestionBugs;
