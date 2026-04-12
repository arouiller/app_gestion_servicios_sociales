import React, { useState, useEffect, useCallback } from 'react';
import VersionesTab from './tabs/VersionesTab';
import HistorialTab from './tabs/HistorialTab';
import EstadisticasTab from './tabs/EstadisticasTab';
import PreviewModal from './modals/PreviewModal';
import migrationsAPI from './services/migrationsService';
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

  const loadAllData = useCallback(async () => {
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
  }, []);

  const handleUpgrade = useCallback(async (version) => {
    try {
      setError(null);
      const previewRes = await migrationsAPI.preview(version, 'upgrade');
      if (previewRes.success) {
        setPreview({ ...previewRes.data, open: true });
      } else {
        setError(previewRes.message || 'Error al obtener preview');
      }
    } catch (err) {
      console.error('Error getting preview:', err);
      setError(err.message || 'Error al obtener preview');
    }
  }, []);

  const handleDowngrade = useCallback(async (version) => {
    try {
      setError(null);
      const previewRes = await migrationsAPI.preview(version, 'downgrade');
      if (previewRes.success) {
        setPreview({ ...previewRes.data, open: true });
      } else {
        setError(previewRes.message || 'Error al obtener preview');
      }
    } catch (err) {
      console.error('Error getting preview:', err);
      setError(err.message || 'Error al obtener preview');
    }
  }, []);

  const handleConfirmExecution = useCallback(async (direction) => {
    try {
      setIsLoading(true);
      setError(null);

      const executeRes = await migrationsAPI.execute(direction);

      if (executeRes.success) {
        setSuccess(`${executeRes.data.message} (${executeRes.data.duration}s)`);
        setPreview(null);

        // Reload all data after successful migration
        setTimeout(() => {
          loadAllData();
          setSuccess(null);
        }, 1500);
      } else {
        setError(executeRes.message || 'Error al ejecutar migración');
      }
    } catch (err) {
      console.error('Error executing migration:', err);
      setError(err.message || 'Error al ejecutar migración');
    } finally {
      setIsLoading(false);
    }
  }, [loadAllData]);

  const handleClosePreview = useCallback(() => {
    if (!isLoading) {
      setPreview(null);
      setError(null);
    }
  }, [isLoading]);

  const handleRefreshStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const statsRes = await migrationsAPI.stats();
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Error refreshing stats:', err);
      setError('Error al actualizar estadísticas');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
              onUpgrade={handleUpgrade}
              onDowngrade={handleDowngrade}
              isLoading={isLoading}
            />
          )}
          {activeTab === 'historial' && (
            <HistorialTab history={history} />
          )}
          {activeTab === 'estadisticas' && (
            <EstadisticasTab
              stats={stats}
              onRefresh={handleRefreshStats}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {preview && (
        <PreviewModal
          isOpen={preview.open !== false}
          preview={preview}
          onConfirm={handleConfirmExecution}
          onCancel={handleClosePreview}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

export default MigrationsDashboard;
