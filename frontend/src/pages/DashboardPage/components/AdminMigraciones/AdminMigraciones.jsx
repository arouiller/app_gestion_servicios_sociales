import React, { useCallback, useEffect, useState } from 'react';
import migracionesService from '../../../../services/migracionesService';
import './AdminMigraciones.scss';

function AdminMigraciones() {
  const [stats, setStats] = useState(null);
  const [migrations, setMigrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [statsData, migrationsData] = await Promise.all([
        migracionesService.getStats(),
        migracionesService.list(),
      ]);
      setStats(statsData);
      setMigrations(migrationsData);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar datos de la base de datos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpgrade = async () => {
    setActionLoading(true);
    setMessage(null);
    setError(null);
    try {
      const result = await migracionesService.upgrade();
      setMessage({ type: 'success', text: result.message });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al aplicar migración.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDowngrade = async () => {
    setActionLoading(true);
    setMessage(null);
    setError(null);
    try {
      const result = await migracionesService.downgrade();
      setMessage({ type: 'warning', text: result.message });
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al revertir migración.');
    } finally {
      setActionLoading(false);
    }
  };

  const hasPending = migrations.some((m) => m.estado === 'pendiente');
  const hasApplied = migrations.some((m) => m.estado === 'aplicada');

  if (loading) {
    return (
      <div className="admin-migraciones">
        <div className="admin-migraciones__loading">Cargando información de la base de datos...</div>
      </div>
    );
  }

  return (
    <div className="admin-migraciones">
      <h2 className="admin-migraciones__title">Administración de Base de Datos</h2>

      {error && <div className="admin-migraciones__alert admin-migraciones__alert--error">{error}</div>}
      {message && (
        <div className={`admin-migraciones__alert admin-migraciones__alert--${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Versión actual */}
      <section className="admin-migraciones__section">
        <h3 className="admin-migraciones__section-title">Versión actual</h3>
        <div className="admin-migraciones__version-badge">
          {stats?.currentVersion ?? <span className="admin-migraciones__version-none">Sin migraciones aplicadas</span>}
        </div>
      </section>

      {/* Tablas y registros */}
      <section className="admin-migraciones__section">
        <h3 className="admin-migraciones__section-title">Tablas de la base de datos</h3>
        {stats?.tables?.length === 0 ? (
          <p className="admin-migraciones__empty">No hay tablas en la base de datos.</p>
        ) : (
          <div className="admin-migraciones__tables-grid">
            {stats?.tables?.map(({ tabla, registros }) => (
              <div key={tabla} className="admin-migraciones__table-card">
                <span className="admin-migraciones__table-name">{tabla}</span>
                <span className="admin-migraciones__table-count">{registros.toLocaleString()}</span>
                <span className="admin-migraciones__table-label">registros</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Versiones disponibles */}
      <section className="admin-migraciones__section">
        <h3 className="admin-migraciones__section-title">Versiones disponibles</h3>
        <div className="admin-migraciones__migrations-table">
          <div className="admin-migraciones__migrations-header">
            <span>Versión</span>
            <span>Descripción</span>
            <span>Estado</span>
          </div>
          {migrations.length === 0 ? (
            <p className="admin-migraciones__empty">No hay migraciones disponibles.</p>
          ) : (
            migrations.map((m) => (
              <div key={m.version} className="admin-migraciones__migrations-row">
                <span className="admin-migraciones__migration-version">{m.version}</span>
                <span className="admin-migraciones__migration-desc">{m.descripcion}</span>
                <span className={`admin-migraciones__estado admin-migraciones__estado--${m.estado}`}>
                  {m.estado === 'aplicada' ? 'Aplicada' : 'Pendiente'}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Acciones */}
      <section className="admin-migraciones__section">
        <h3 className="admin-migraciones__section-title">Acciones</h3>
        <div className="admin-migraciones__actions">
          <button
            className="admin-migraciones__btn admin-migraciones__btn--upgrade"
            onClick={handleUpgrade}
            disabled={actionLoading || !hasPending}
            title={!hasPending ? 'No hay migraciones pendientes' : 'Aplicar la siguiente versión'}
          >
            {actionLoading ? 'Procesando...' : 'Upgrade'}
          </button>
          <button
            className="admin-migraciones__btn admin-migraciones__btn--downgrade"
            onClick={handleDowngrade}
            disabled={actionLoading || !hasApplied}
            title={!hasApplied ? 'No hay migraciones para revertir' : 'Revertir la última versión aplicada'}
          >
            {actionLoading ? 'Procesando...' : 'Downgrade'}
          </button>
        </div>
        <p className="admin-migraciones__actions-hint">
          Upgrade aplica la siguiente versión pendiente. Downgrade revierte únicamente la última versión aplicada.
        </p>
      </section>
    </div>
  );
}

export default AdminMigraciones;
