import React, { useState } from 'react';
import '../styles/HistorialTab.scss';

function HistorialTab({ history }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (!history || history.length === 0) {
    return (
      <div className="tab-content">
        <p className="empty-state">No hay historial de migraciones registrado</p>
      </div>
    );
  }

  const totalPages = Math.ceil(history.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = history.slice(startIdx, startIdx + itemsPerPage);

  const getStatusClass = (status) => {
    if (status === 'exitosa') return 'exitosa';
    return 'fallida';
  };

  const getTypeLabel = (type) => {
    return type === 'upgrade' ? '↑ Upgrade' : '↓ Downgrade';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="tab-content historial-tab">
      <div className="table-wrapper">
        <table className="historial-table">
          <thead>
            <tr>
              <th>Versión</th>
              <th>Descripción</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Duración</th>
            </tr>
          </thead>
          <tbody>
            {paginatedHistory.map((record) => (
              <tr key={record.id} className={`status-${getStatusClass(record.estado)}`}>
                <td className="version-col">{record.version}</td>
                <td className="description-col">{record.descripcion}</td>
                <td className="type-col">{getTypeLabel(record.tipo)}</td>
                <td className="status-col">
                  <span className={`status-badge ${getStatusClass(record.estado)}`}>
                    {record.estado === 'exitosa' ? '✓ Exitosa' : '✗ Fallida'}
                  </span>
                </td>
                <td className="date-col">{formatDate(record.fecha_ejecucion)}</td>
                <td className="duration-col">
                  {record.duracion ? `${record.duracion}s` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            ← Anterior
          </button>
          <span className="pagination-info">
            Página {currentPage} de {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

export default HistorialTab;
