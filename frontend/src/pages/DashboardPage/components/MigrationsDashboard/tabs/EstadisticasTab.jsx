import React from 'react';
import '../styles/EstadisticasTab.scss';

function EstadisticasTab({ stats, onRefresh, isLoading }) {
  if (!stats) {
    return <div className="tab-content">Cargando estadísticas...</div>;
  }

  const { currentVersion, tables } = stats;

  const totalRecords = tables.reduce((sum, table) => sum + table.registros, 0);

  return (
    <div className="tab-content estadisticas-tab">
      <div className="version-info-box">
        <h3>Versión Actual de la BD</h3>
        <div className="version-display">
          <span className="version-number">{currentVersion || 'Sin aplicar'}</span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? '⟳ Actualizando...' : '⟳ Refrescar'}
          </button>
        </div>
      </div>

      <div className="tables-info">
        <div className="tables-header">
          <h3>Estadísticas de Tablas</h3>
          <p className="total-records">Total de registros: <strong>{totalRecords.toLocaleString('es-AR')}</strong></p>
        </div>

        {tables.length === 0 ? (
          <p className="empty-state">No hay tablas disponibles</p>
        ) : (
          <div className="table-wrapper">
            <table className="tables-table">
              <thead>
                <tr>
                  <th>Tabla</th>
                  <th className="record-count-header">Registros</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((table) => (
                  <tr key={table.tabla}>
                    <td className="table-name">{table.tabla}</td>
                    <td className="record-count">
                      {table.registros.toLocaleString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default EstadisticasTab;
