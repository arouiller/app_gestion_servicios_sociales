import React, { useState, useEffect } from 'react';
import PreviewModal from './modals/PreviewModal';
import VersionesTab from './tabs/VersionesTab';
import HistorialTab from './tabs/HistorialTab';
import EstadisticasTab from './tabs/EstadisticasTab';
import migrationsAPI from '../../../../services/migrationsService';
import './styles/MigrationsDashboard.scss';

function MigrationsDashboard() {
  const [activeTab, setActiveTab] = useState('versiones');
  const [versions, setVersions] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
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
      const [listRes, historyRes, statsRes] = await Promise.all([
        migrationsAPI.list(),
        migrationsAPI.history(),
        migrationsAPI.stats(),
      ]);

      if (listRes.success) {
        setVersions(listRes.data.versions);
        setCurrentVersion(listRes.data.currentVersion);
      }

      if (historyRes.success) {
        setHistory(historyRes.data.history);
      }

      if (statsRes.success) {
        setStats(statsRes.data);
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
          <button
            className={`tab-btn ${activeTab === 'estadisticas' ? 'active' : ''}`}
            onClick={() => setActiveTab('estadisticas')}
          >
            Estadísticas
          </button>
        </div>

        <div className="tabs-content">
          {activeTab === 'versiones' && (
            <VersionesTab
              versions={versions}
              currentVersion={currentVersion}
              isLoading={isLoading}
              onUpgrade={handleUpgrade}
              onDowngrade={handleDowngrade}
              onReapply={handleReapply}
            />
          )}

          {activeTab === 'historial' && <HistorialTab history={history} />}

          {activeTab === 'estadisticas' && (
            <EstadisticasTab
              stats={stats}
              isLoading={isLoading}
              onRefresh={loadAllData}
            />
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
