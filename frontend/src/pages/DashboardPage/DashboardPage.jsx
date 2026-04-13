import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DatosPersonales from './components/DatosPersonales/DatosPersonales';
import MigrationsDashboard from './components/MigrationsDashboard/MigrationsDashboard';
import BusquedaAfiliados from './components/v1.0/BusquedaAfiliados';
import ListadoPlanes from './components/v1.0/ListadoPlanes';
import PlanesPorCobrador from './components/v1.0/PlanesPorCobrador';
import Cobradores from './components/Cobradores/Cobradores';
import ObrasSociales from './components/ObrasSociales/ObrasSociales';
import ServiciosAdicionales from './components/ServiciosAdicionales/ServiciosAdicionales';
import TiposDeGrupo from './components/TiposDeGrupo/TiposDeGrupo';
import TiposDePlan from './components/TiposDePlan/TiposDePlan';
import './DashboardPage.scss';

// ── Iconos simples (SVG inline) ──────────────────────────────────────────────

const ICONS = {
  'mi-cuenta': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  'administracion': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>,
  'gestion': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
};

// ── Sidebar ──────────────────────────────────────────────────────────────────

function buildMenu(isAdmin) {
  const menu = [
    {
      key: 'mi-cuenta',
      label: 'Mi Cuenta',
      children: [
        { key: 'datos-personales', label: 'Datos Personales' },
      ],
    },
    {
      key: 'gestion',
      label: 'Gestión',
      children: [
        { key: 'busqueda-afiliados', label: 'Búsqueda de Afiliados' },
        { key: 'listado-planes', label: 'Listado de Planes' },
        { key: 'planes-por-cobrador', label: 'Planes por Cobrador' },
        ...(isAdmin ? [
          { key: 'cobradores', label: 'Cobradores' },
          { key: 'obras-sociales', label: 'Obras Sociales' },
          { key: 'servicios-adicionales', label: 'Servicios Adicionales' },
          { key: 'tipos-de-grupo', label: 'Tipos de Grupo' },
          { key: 'tipos-de-plan', label: 'Tipos de Plan' },
        ] : []),
      ],
    },
  ];

  if (isAdmin) {
    menu.push({
      key: 'administracion',
      label: 'Administración',
      children: [
        { key: 'migraciones-bd', label: 'Migraciones BD' },
      ],
    });
  }

  return menu;
}

function Sidebar({ activeModule, onSelect, sidebarOpen, setSidebarOpen, menu }) {
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
          {menu.map((item) => (
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
  const [activeModule, setActiveModule] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menu = buildMenu(user?.rol === 'admin');

  const initials = `${user?.nombre?.[0] ?? ''}${user?.apellido?.[0] ?? ''}`.toUpperCase();

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
          menu={menu}
        />

        <main className="dashboard__content">
          {activeModule === 'datos-personales' && <DatosPersonales />}
          {activeModule === 'busqueda-afiliados' && <BusquedaAfiliados />}
          {activeModule === 'listado-planes' && <ListadoPlanes />}
          {activeModule === 'planes-por-cobrador' && <PlanesPorCobrador />}
          {activeModule === 'migraciones-bd' && <MigrationsDashboard />}
          {activeModule === 'cobradores' && <Cobradores />}
          {activeModule === 'obras-sociales' && <ObrasSociales />}
          {activeModule === 'servicios-adicionales' && <ServiciosAdicionales />}
          {activeModule === 'tipos-de-grupo' && <TiposDeGrupo />}
          {activeModule === 'tipos-de-plan' && <TiposDePlan />}
          {!activeModule && <Bienvenida user={user} />}
        </main>
      </div>
    </div>
  );
}

export default DashboardPage;
