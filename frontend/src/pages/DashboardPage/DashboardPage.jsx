import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DatosPersonales from './components/DatosPersonales/DatosPersonales';
import Cobradores from './components/Cobradores/Cobradores';
import TiposDePlan from './components/TiposDePlan/TiposDePlan';
import ObrasSociales from './components/ObrasSociales/ObrasSociales';
import ServiciosAdicionales from './components/ServiciosAdicionales/ServiciosAdicionales';
import TiposDeGrupo from './components/TiposDeGrupo/TiposDeGrupo';
import GestionPlanes from './components/GestionPlanes/GestionPlanes';
import MigrationsDashboard from './components/MigrationsDashboard/MigrationsDashboard';
import './DashboardPage.scss';

// ── Iconos simples (SVG inline) ──────────────────────────────────────────────

const ICONS = {
  'mi-cuenta': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
};

// ── Sidebar ──────────────────────────────────────────────────────────────────

const MENU = [
  {
    key: 'mi-cuenta',
    label: 'Mi Cuenta',
    children: [
      { key: 'datos-personales', label: 'Datos Personales' },
      { key: 'cobradores', label: 'Cobradores' },
      { key: 'tiposPlan', label: 'Tipos de Plan' },
      { key: 'obrasSociales', label: 'Obras Sociales' },
      { key: 'serviciosAdicionales', label: 'Servicios Adicionales' },
      { key: 'tiposGrupo', label: 'Tipos de Grupo' },
      { key: 'planes', label: 'Planes' },
    ],
  },
];

function Sidebar({ activeModule, onSelect, sidebarOpen, setSidebarOpen, user }) {
  const [expanded, setExpanded] = useState({ 'mi-cuenta': true });

  const toggleExpand = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelect = (key) => {
    onSelect(key);
    setSidebarOpen(false);
  };

  return (
    <>
      {sidebarOpen && (
        <div className="dashboard__sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`dashboard__sidebar${sidebarOpen ? ' dashboard__sidebar--open' : ''}`}>
        <nav className="dashboard__nav">
          {MENU.map((item) => (
            <div key={item.key} className="dashboard__nav-group">
              {item.children ? (
                <>
                  <button
                    className="dashboard__nav-section"
                    onClick={() => toggleExpand(item.key)}
                  >
                    <span className="dashboard__nav-icon">{ICONS[item.key]}</span>
                    <span className="dashboard__nav-label">{item.label}</span>
                    <span className={`dashboard__nav-chevron${expanded[item.key] ? ' dashboard__nav-chevron--open' : ''}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                    </span>
                  </button>
                  {expanded[item.key] && (
                    <div className="dashboard__nav-children">
                      {item.children.map((child) => (
                        <button
                          key={child.key}
                          className={`dashboard__nav-item${activeModule === child.key ? ' dashboard__nav-item--active' : ''}`}
                          onClick={() => handleSelect(child.key)}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button
                  className={`dashboard__nav-section${activeModule === item.key ? ' dashboard__nav-section--active' : ''}`}
                  onClick={() => handleSelect(item.key)}
                >
                  <span className="dashboard__nav-icon">{ICONS[item.key]}</span>
                  <span className="dashboard__nav-label">{item.label}</span>
                </button>
              )}
            </div>
          ))}
          {user?.rol === 'admin' && (
            <>
              <div style={{ margin: '10px 0', height: '1px', background: '#ddd' }} />
              <div className="dashboard__nav-group">
                <button
                  className={`dashboard__nav-section${activeModule === 'migraciones' ? ' dashboard__nav-section--active' : ''}`}
                  onClick={() => handleSelect('migraciones')}
                >
                  <span className="dashboard__nav-label" style={{ paddingLeft: '8px' }}>⚙️ Migraciones BD</span>
                </button>
              </div>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}

// ── Bienvenida ───────────────────────────────────────────────────────────────

function Bienvenida({ user }) {
  const initials = `${user?.nombre?.[0] ?? ''}${user?.apellido?.[0] ?? ''}`.toUpperCase();
  return (
    <div className="dashboard__welcome">
      <div className="dashboard__welcome-avatar">{initials}</div>
      <div>
        <h1 className="dashboard__welcome-title">Bienvenido, {user?.nombre}!</h1>
        <p className="dashboard__welcome-sub">
          Seleccioná una opción del menú para comenzar.
        </p>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────

function DashboardPage() {
  const { user, logout } = useAuth();
  const [activeModule, setActiveModule] = useState('datos-personales');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const modules = {
    'datos-personales': { label: 'Datos Personales', component: DatosPersonales },
    cobradores: { label: 'Cobradores', component: Cobradores },
    tiposPlan: { label: 'Tipos de Plan', component: TiposDePlan },
    obrasSociales: { label: 'Obras Sociales', component: ObrasSociales },
    serviciosAdicionales: { label: 'Servicios Adicionales', component: ServiciosAdicionales },
    tiposGrupo: { label: 'Tipos de Grupo', component: TiposDeGrupo },
    planes: { label: 'Planes', component: GestionPlanes },
    migraciones: { label: 'Migraciones BD', component: MigrationsDashboard },
  };

  const initials = `${user?.nombre?.[0] ?? ''}${user?.apellido?.[0] ?? ''}`.toUpperCase();

  // Prevent non-admins from viewing migraciones
  const safeActiveModule = (activeModule === 'migraciones' && user?.rol !== 'admin') ? 'datos-personales' : activeModule;
  const ActiveComponent = modules[safeActiveModule]?.component || DatosPersonales;

  return (
    <div className="dashboard">
      {/* Topbar */}
      <header className="dashboard__topbar">
        <div className="dashboard__topbar-left">
          <button
            className="dashboard__hamburger"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="dashboard__brand">
            <span className="dashboard__brand-icon">GS</span>
            <span className="dashboard__brand-name">GestSocial</span>
          </div>
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
          <button className="dashboard__logout-btn" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Body: sidebar + contenido */}
      <div className="dashboard__body">
        <Sidebar
          activeModule={activeModule}
          onSelect={setActiveModule}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          user={user}
        />

        <main className="dashboard__content">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}

export default DashboardPage;
