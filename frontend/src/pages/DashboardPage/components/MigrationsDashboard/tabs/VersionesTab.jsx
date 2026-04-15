import React from 'react';
import ActionButton from '../../../../../components/ActionButton/ActionButton';

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
            <th>Versión</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sortedVersions.map((v) => {
            const vNum = parseFloat(v.version);
            const currentNum = parseFloat(currentVersion);
            const isCurrentVersion = vNum === currentNum;
            const isPreviousVersion = vNum < currentNum;
            const isNextVersion = vNum === currentNum + 0.1 || vNum > currentNum;

            return (
              <tr key={v.version}>
                <td className="migrations-dashboard__version-number">v{v.version}</td>
                <td className="migrations-dashboard__version-desc">
                  {v.description || '—'}
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
                    {/* Downgrade button - enabled only if this is the previous version */}
                    <ActionButton
                      variant="icon"
                      icon="⬇️"
                      onClick={() => onDowngrade(v.version)}
                      disabled={vNum !== currentNum - 0.1 && vNum !== currentNum - 1 || isLoading}
                      title="Revertir a esta versión"
                    />

                    {/* Re-apply button - enabled only on current version */}
                    <ActionButton
                      variant="icon"
                      icon="🔄"
                      onClick={() => onReapply(v.version)}
                      disabled={!isCurrentVersion || isLoading}
                      title="Re-ejecutar esta versión"
                    />

                    {/* Upgrade button - enabled only if this is the next version */}
                    <ActionButton
                      variant="icon"
                      icon="⬆️"
                      onClick={() => onUpgrade(v.version)}
                      disabled={vNum !== currentNum + 0.1 && vNum !== currentNum + 1 || isLoading}
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
