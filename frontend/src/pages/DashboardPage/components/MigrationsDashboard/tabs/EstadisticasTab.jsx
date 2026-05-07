import React, { useState } from 'react';
import ActionButton from '../../../../../components/ActionButton/ActionButton';
import useColumnResize from '../../../../../hooks/useColumnResize';

/**
 * EstadisticasTab: Tab de visualización de estadísticas de BD
 * Muestra versión actual, tabla de conteos y botón de refresco
 */
function EstadisticasTab({ stats, isLoading, onRefresh }) {
  const [localLoading, setLocalLoading] = useState(false);

  // Column resize hook
  const { widths, getResizeHandle } = useColumnResize(
    'migrations-estadisticas',
    { tabla: 200, cantidad: 180 }
  );

  const handleRefresh = async () => {
    setLocalLoading(true);
    try {
      await onRefresh();
    } finally {
      setLocalLoading(false);
    }
  };

  if (!stats) {
    return (
      <div className="migrations-dashboard__content">
        <h3>Estadísticas de Base de Datos</h3>
        <p className="migrations-dashboard__empty">No hay datos de estadísticas</p>
      </div>
    );
  }

  const tables = stats.tables || [];
  const sortedTables = [...tables].sort((a, b) => a.tableName.localeCompare(b.tableName));

  return (
    <div className="migrations-dashboard__content">
      <div className="estadisticas-header">
        <div className="version-badge">
          <strong>Versión actual:</strong>
          <span className="version-number">v{stats.currentVersion}</span>
        </div>
        <ActionButton
          variant="primary"
          onClick={handleRefresh}
          disabled={isLoading || localLoading}
          title="Refrescar datos de estadísticas"
        >
          {localLoading ? '⟳ Refrescando...' : '⟳ Refrescar'}
        </ActionButton>
      </div>

      <h4>Conteo de Registros por Tabla</h4>
      {sortedTables.length === 0 ? (
        <p className="migrations-dashboard__empty">No hay tablas en la base de datos</p>
      ) : (
        <table className="estadisticas-table">
          <thead>
            <tr>
              <th style={{ width: widths.tabla }}>Tabla{getResizeHandle('tabla')}</th>
              <th style={{ width: widths.cantidad }} className="estadisticas-table__count">Cantidad de Registros{getResizeHandle('cantidad')}</th>
            </tr>
          </thead>
          <tbody>
            {sortedTables.map((table) => (
              <tr key={table.tableName}>
                <td className="estadisticas-table__name">{table.tableName}</td>
                <td className="estadisticas-table__count">
                  {table.recordCount.toLocaleString('es-AR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="estadisticas-footer">
        <small>Última actualización: {new Date().toLocaleString('es-AR')}</small>
      </div>
    </div>
  );
}

export default EstadisticasTab;
