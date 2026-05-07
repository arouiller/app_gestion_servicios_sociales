import React from 'react';
import useColumnResize from '../../../../../hooks/useColumnResize';

/**
 * HistorialTab: Tab de visualización del historial de migraciones
 * Muestra tabla de todas las migraciones ejecutadas (upgrades y downgrades)
 */
function HistorialTab({ history }) {
  // Column resize hook
  const { widths, getResizeHandle } = useColumnResize(
    'migrations-historial',
    { version: 100, descripcion: 200, tipo: 100, estado: 110, fecha: 160, duracion: 100 }
  );
  if (!history || history.length === 0) {
    return (
      <div className="migrations-dashboard__content">
        <h3>Historial de Migraciones</h3>
        <p className="migrations-dashboard__empty">No hay historial de migraciones</p>
      </div>
    );
  }

  // Sort by fecha_ejecucion descending (most recent first)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.fecha_ejecucion) - new Date(a.fecha_ejecucion)
  );

  return (
    <div className="migrations-dashboard__content">
      <h3>Historial de Migraciones</h3>
      <table className="historial-table">
        <thead>
          <tr>
            <th style={{ width: widths.version }}>Versión{getResizeHandle('version')}</th>
            <th style={{ width: widths.descripcion }}>Descripción{getResizeHandle('descripcion')}</th>
            <th style={{ width: widths.tipo }}>Tipo{getResizeHandle('tipo')}</th>
            <th style={{ width: widths.estado }}>Estado{getResizeHandle('estado')}</th>
            <th style={{ width: widths.fecha }}>Fecha de Ejecución{getResizeHandle('fecha')}</th>
            <th style={{ width: widths.duracion }}>Duración{getResizeHandle('duracion')}</th>
          </tr>
        </thead>
        <tbody>
          {sortedHistory.map((record) => (
            <tr key={record.id}>
              <td className="historial-table__version">v{record.version}</td>
              <td className="historial-table__description">
                {record.descripcion || '—'}
              </td>
              <td className="historial-table__type">
                {record.tipo === 'upgrade' ? (
                  <span className="badge-upgrade">⬆ Upgrade</span>
                ) : (
                  <span className="badge-downgrade">⬇ Downgrade</span>
                )}
              </td>
              <td className="historial-table__status">
                {record.estado === 'exitosa' ? (
                  <span className="status-badge exitosa">✓ Exitosa</span>
                ) : (
                  <span className="status-badge fallida">✗ Fallida</span>
                )}
              </td>
              <td className="historial-table__fecha">
                {new Date(record.fecha_ejecucion).toLocaleString('es-AR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </td>
              <td className="historial-table__duracion">
                {record.duracion ? `${record.duracion}s` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default HistorialTab;
