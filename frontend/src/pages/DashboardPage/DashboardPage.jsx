import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import DatosPersonales from './components/DatosPersonales/DatosPersonales';
import GestionAfiliados from './components/GestionAfiliados/GestionAfiliados';
import GestionGruposFamiliares from './components/GestionGruposFamiliares/GestionGruposFamiliares';
import GestionPlanes from './components/GestionPlanes/GestionPlanes';
import AdminMigraciones from './components/AdminMigraciones/AdminMigraciones';
import './DashboardPage.scss';

// ── Definición del menú según rol ────────────────────────────────────────────

function buildMenu(isAdmin) {
  const menu = [
    {
      key: 'mi-cuenta',
      label: 'Mi Cuenta',
      children: [
        { key: 'datos-personales', label: 'Datos Personales' },
      ],
    },
    { key: 'afiliados', label: 'Afiliados' },
    { key: 'grupos-familiares', label: 'Grupos Familiares' },
    { key: 'planes', label: 'Planes' },
  ];

  if (isAdmin) {
    menu.push({
      key: 'administracion',
      label: 'Administración',
      children: [{ key: 'base-datos', label: 'Base de Datos' }],
    });
  }

  return menu;
}

// ── Iconos simples (SVG inline) ──────────────────────────────────────────────

const ICONS = {
  'mi-cuenta':      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  'afiliados':           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  'grupos-familiares':   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  'planes':         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 17h7M17.5 14v7"/></svg>,
  'administracion': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
};

// ── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ menu, activeModule, onSelect, sidebarOpen, setSidebarOpen }) {
  const [expanded, setExpanded] = useState(() => {
    const init = {};
    menu.forEach((item) => { if (item.children) init[item.key] = true; });
    return init;
  });

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

// ── Render del módulo activo ─────────────────────────────────────────────────

function ModuleContent({ activeModule }) {
  switch (activeModule) {
    case 'datos-personales':   return <DatosPersonales />;
    case 'afiliados':          return <GestionAfiliados />;
    case 'grupos-familiares':  return <GestionGruposFamiliares />;
    case 'planes':             return <GestionPlanes />;
    case 'base-datos':         return <AdminMigraciones />;
    default:                   return null;
  }
}

// ── Página principal ─────────────────────────────────────────────────────────

function DashboardPage() {
  const { user, logout, isAdmin } = useAuth();
  const [activeModule, setActiveModule] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menu = buildMenu(isAdmin);
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
          menu={menu}
          activeModule={activeModule}
          onSelect={setActiveModule}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <main className="dashboard__content">
          {activeModule
            ? <ModuleContent activeModule={activeModule} />
            : <Bienvenida user={user} />
          }
        </main>
      </div>
    </div>
  );
}

export default DashboardPage;
