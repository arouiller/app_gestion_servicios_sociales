import React, { useState, useEffect } from 'react';
import ActionButton from '../../../../components/ActionButton/ActionButton';
import PreviewModal from './modals/PreviewModal';
import migrationsAPI from './services/migrationsService';
import './styles/MigrationsDashboard.scss';

function MigrationsDashboard() {
  const [activeTab, setActiveTab] = useState('versiones');
  const [versions, setVersions] = useState([]);
  const [history, setHistory] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(null);

  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  // Auto-dismiss success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadAllData = async () => {
    try {
      setError(null);
      const [listRes, historyRes] = await Promise.all([
        migrationsAPI.list(),
        migrationsAPI.history(),
      ]);

      if (listRes.success) {
        setVersions(listRes.data.versions);
        setCurrentVersion(listRes.data.currentVersion);
      }

      if (historyRes.success) {
        setHistory(historyRes.data.history);
      }
    } catch (err) {
      console.error('Error loading migration data:', err);
      setError('Error al cargar datos de migraciones');
    }
  };

  const handleMigration = async (version, direction) => {
    try {
      setError(null);
      const previewRes = await migrationsAPI.preview(version, direction);
      if (previewRes.success) {
        setPreview({ ...previewRes.data, open: true, direction });
      } else {
        setError(previewRes.message || 'Error al obtener preview');
      }
    } catch (err) {
      console.error('Error getting preview:', err);
      setError(err.message || 'Error al obtener preview');
    }
  };

  const handleUpgrade = (version) => handleMigration(version, 'upgrade');
  const handleDowngrade = (version) => handleMigration(version, 'downgrade');
  const handleReapply = (version) => handleMigration(version, 'reapply');

  const handleClosePreview = () => {
    if (!isLoading) {
      setPreview(null);
      setError(null);
    }
  };

  const handleConfirm = async (direction) => {
    if (!preview) return;

    try {
      setError(null);
      setIsLoading(true);

      const result = await migrationsAPI.execute(preview.version, direction);

      if (result.success) {
        setSuccess(`Migración ${direction} v${preview.version} ejecutada exitosamente`);
        setPreview(null);
        // Reload data
        await loadAllData();
      } else {
        setError(result.message || 'Error al ejecutar migración');
      }
    } catch (err) {
      console.error('Error executing migration:', err);
      setError(err.message || 'Error al ejecutar migración');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="migrations-dashboard">
      {/* Error banner */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button
            className="alert-close"
            onClick={() => setError(null)}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div className="alert alert-success">
          <span>✓ {success}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === 'versiones' ? 'active' : ''}`}
            onClick={() => setActiveTab('versiones')}
          >
            Versiones
          </button>
          <button
            className={`tab-btn ${activeTab === 'historial' ? 'active' : ''}`}
            onClick={() => setActiveTab('historial')}
          >
            Historial
          </button>
        </div>

        <div className="tabs-content">
          {activeTab === 'versiones' && (
            <div className="migrations-dashboard__content">
              <h3>Versiones Disponibles</h3>
              {versions.length === 0 ? (
                <p className="migrations-dashboard__empty">No hay versiones disponibles</p>
              ) : (
                <table className="migrations-dashboard__versions-table">
                  <thead>
                    <tr>
                      <th>Versión</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.map((v) => (
                      <tr key={v.version}>
                        <td className="migrations-dashboard__version-number">v{v.version}</td>
                        <td className="migrations-dashboard__version-status">
                          {currentVersion === v.version ? (
                            <span className="migrations-dashboard__current">Actual</span>
                          ) : currentVersion > v.version ? (
                            <span className="migrations-dashboard__previous">Anterior</span>
                          ) : (
                            <span className="migrations-dashboard__available">Disponible</span>
                          )}
                        </td>
                        <td className="migrations-dashboard__version-action">
                          <div className="migrations-dashboard__action-buttons">
                            {/* Downgrade button - enabled only on previous version */}
                            <ActionButton
                              variant="icon"
                              icon="⬇️"
                              onClick={() => handleDowngrade(v.version)}
                              disabled={currentVersion - 1 !== v.version || isLoading}
                              title={currentVersion - 1 === v.version ? 'Revertir a esta versión' : 'Downgrade no disponible'}
                            />

                            {/* Re-apply button - enabled only on current version */}
                            <ActionButton
                              variant="icon"
                              icon="🔄"
                              onClick={() => handleReapply(v.version)}
                              disabled={currentVersion !== v.version || isLoading}
                              title={currentVersion === v.version ? 'Re-ejecutar esta versión' : 'Re-apply no disponible'}
                            />

                            {/* Upgrade button - enabled only on next version */}
                            <ActionButton
                              variant="icon"
                              icon="⬆️"
                              onClick={() => handleUpgrade(v.version)}
                              disabled={currentVersion + 1 !== v.version || isLoading}
                              title={currentVersion + 1 === v.version ? 'Actualizar a esta versión' : 'Upgrade no disponible'}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'historial' && (
            <div className="tab-content">
              {history.length === 0 ? (
                <p>No hay historial de migraciones</p>
              ) : (
                <table className="historial-table">
                  <thead>
                    <tr>
                      <th>Versión</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => (
                      <tr key={record.id}>
                        <td>{record.version}</td>
                        <td>{record.tipo === 'upgrade' ? '↑ Upgrade' : '↓ Downgrade'}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              record.estado === 'exitosa' ? 'exitosa' : 'fallida'
                            }`}
                          >
                            {record.estado === 'exitosa' ? '✓ Exitosa' : '✗ Fallida'}
                          </span>
                        </td>
                        <td>{new Date(record.fecha_ejecucion).toLocaleString('es-AR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {preview && (
        <PreviewModal
          isOpen={preview.open !== false}
          preview={preview}
          onConfirm={handleConfirm}
          onCancel={handleClosePreview}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

export default MigrationsDashboard;
