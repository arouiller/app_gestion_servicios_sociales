import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminMigraciones from './components/AdminMigraciones/AdminMigraciones';
import './DashboardPage.scss';

function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const initials = user
    ? `${user.nombre?.[0] ?? ''}${user.apellido?.[0] ?? ''}`.toUpperCase()
    : '?';

  return (
    <div className="dashboard">
      {/* Topbar */}
      <header className="dashboard__topbar">
        <div className="dashboard__brand">
          <span className="dashboard__brand-icon">GS</span>
          <span className="dashboard__brand-name">GestSocial</span>
        </div>
        <div className="dashboard__user">
          <div className="dashboard__avatar" title={`${user?.nombre} ${user?.apellido}`}>
            {initials}
          </div>
          <div className="dashboard__user-info">
            <span className="dashboard__user-name">{user?.nombre} {user?.apellido}</span>
            <span className={`dashboard__user-rol dashboard__user-rol--${user?.rol}`}>
              {user?.rol === 'admin' ? 'Administrador' : 'Usuario'}
            </span>
          </div>
          <button className="dashboard__logout-btn" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="dashboard__main">
        <div className="dashboard__welcome-card">
          <div className="dashboard__welcome-avatar">{initials}</div>
          <div>
            <h1 className="dashboard__welcome-title">
              Bienvenido, {user?.nombre}!
            </h1>
            <p className="dashboard__welcome-sub">
              Accediste correctamente al sistema de gestión de servicios sociales.
            </p>
          </div>
        </div>

        <div className="dashboard__info-grid">
          <div className="dashboard__info-card">
            <span className="dashboard__info-label">Email</span>
            <span className="dashboard__info-value">{user?.email}</span>
          </div>
          <div className="dashboard__info-card">
            <span className="dashboard__info-label">Rol</span>
            <span className={`dashboard__badge dashboard__badge--${user?.rol}`}>
              {user?.rol === 'admin' ? 'Administrador' : 'Usuario'}
            </span>
          </div>
          <div className="dashboard__info-card">
            <span className="dashboard__info-label">Estado</span>
            <span className="dashboard__badge dashboard__badge--activo">Activo</span>
          </div>
        </div>

        <div className="dashboard__notice">
          <div className="dashboard__notice-icon">🚧</div>
          <div>
            <strong>Panel en construcción</strong>
            <p>
              El módulo completo de gestión (afiliados, planes, cuotas y pagos)
              está siendo desarrollado. La autenticación está funcionando correctamente.
            </p>
          </div>
        </div>

        {user?.rol === 'admin' && <AdminMigraciones />}
      </main>
    </div>
  );
}

export default DashboardPage;
