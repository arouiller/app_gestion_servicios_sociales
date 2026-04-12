import React from 'react';
import '../styles/VersionesTab.scss';

function VersionesTab({
  versions,
  currentVersion,
  onUpgrade,
  onDowngrade,
  isLoading
}) {
  if (!versions || versions.length === 0) {
    return <div className="tab-content">No hay versiones disponibles</div>;
  }

  return (
    <div className="tab-content versions-tab">
      <div className="versions-info">
        <p>
          <strong>Versión actual:</strong> <span className="version-badge">{currentVersion || 'Sin aplicar'}</span>
        </p>
        <p className="text-muted">Total de versiones: {versions.length}</p>
      </div>

      <div className="versions-list">
        {versions.map((version, idx) => {
          const isApplied = version.estado === 'aplicada';
          const isNext = idx === versions.findIndex(v => v.estado === 'pendiente');
          const appliedCount = versions.filter(v => v.estado === 'aplicada').length;
          const canDowngrade = isApplied && idx === appliedCount - 1;

          return (
            <div key={version.version} className={`version-card ${isApplied ? 'applied' : 'pending'}`}>
              <div className="version-card__header">
                <span className="version-number">{version.version}</span>
                <span className={`status-badge ${isApplied ? 'applied' : 'pending'}`}>
                  {isApplied ? '✓ Aplicada' : '○ Pendiente'}
                </span>
              </div>

              <p className="version-description">{version.descripcion}</p>

              <div className="version-actions">
                {isNext && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => onUpgrade(version.version)}
                    disabled={isLoading}
                  >
                    ↑ Upgrade
                  </button>
                )}
                {canDowngrade && (
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => onDowngrade(version.version)}
                    disabled={isLoading}
                  >
                    ↓ Downgrade
                  </button>
                )}
                {!isNext && !canDowngrade && (
                  <span className="text-muted text-sm">Sin acciones disponibles</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VersionesTab;
