import React from 'react';
import ActionButton from '../../../../../components/ActionButton/ActionButton';
import useColumnResize from '../../../../../hooks/useColumnResize';

/**
 * VersionesTab: Tab de visualización de versiones disponibles
 * Muestra lista de versiones con estado y botones de acción (upgrade/downgrade/reapply)
 */
function VersionesTab({
  versions,
  currentVersion,
  isLoading,
  onUpgrade,
  onDowngrade,
  onReapply,
}) {
  // Column resize hook
  const { widths, getResizeHandle } = useColumnResize(
    'migrations-versiones',
    { version: 100, descripcion: 220, estado: 140, acciones: 160 }
  );
  if (!versions || versions.length === 0) {
    return (
      <div className="migrations-dashboard__content">
        <h3>Versiones Disponibles</h3>
        <p className="migrations-dashboard__empty">No hay versiones disponibles</p>
      </div>
    );
  }

  // Sort versions in descending order for display
  const sortedVersions = [...versions].sort(
    (a, b) => parseFloat(b.version) - parseFloat(a.version)
  );

  return (
    <div className="migrations-dashboard__content">
      <h3>Versiones Disponibles</h3>
      <table className="migrations-dashboard__versions-table">
        <thead>
          <tr>
            <th style={{ width: widths.version }}>Versión{getResizeHandle('version')}</th>
            <th style={{ width: widths.descripcion }}>Descripción{getResizeHandle('descripcion')}</th>
            <th style={{ width: widths.estado }}>Estado{getResizeHandle('estado')}</th>
            <th style={{ width: widths.acciones }}>Acciones{getResizeHandle('acciones')}</th>
          </tr>
        </thead>
        <tbody>
          {sortedVersions.map((v) => {
            // Usar el campo 'estado' del API en lugar de recalcular localmente
            const isCurrentVersion = v.estado === 'aplicada';
            const isPreviousVersion = v.estado === 'pasada';
            const isNextVersion = v.estado === 'pendiente';

            return (
              <tr key={v.version}>
                <td className="migrations-dashboard__version-number">v{v.version}</td>
                <td className="migrations-dashboard__version-desc">
                  {v.descripcion || '—'}
                </td>
                <td className="migrations-dashboard__version-status">
                  {isCurrentVersion ? (
                    <span className="migrations-dashboard__current">✓ Actual</span>
                  ) : isPreviousVersion ? (
                    <span className="migrations-dashboard__previous">⬇ Anterior</span>
                  ) : (
                    <span className="migrations-dashboard__available">⬆ Disponible</span>
                  )}
                </td>
                <td className="migrations-dashboard__version-action">
                  <div className="migrations-dashboard__action-buttons">
                    {/* Downgrade button - enabled only if this is the current version */}
                    <ActionButton
                      variant="icon"
                      icon="⬇️"
                      onClick={() => onDowngrade(v.version)}
                      disabled={v.estado !== 'aplicada' || isLoading}
                      title="Revertir a esta versión"
                    />

                    {/* Re-apply button - enabled only on current version */}
                    <ActionButton
                      variant="icon"
                      icon="🔄"
                      onClick={() => onReapply(v.version)}
                      disabled={v.estado !== 'aplicada' || isLoading}
                      title="Re-ejecutar esta versión"
                    />

                    {/* Upgrade button - enabled only if this is a pending version */}
                    <ActionButton
                      variant="icon"
                      icon="⬆️"
                      onClick={() => onUpgrade(v.version)}
                      disabled={v.estado !== 'pendiente' || isLoading}
                      title="Actualizar a esta versión"
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default VersionesTab;
