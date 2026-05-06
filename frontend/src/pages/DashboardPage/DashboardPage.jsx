import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { NotificationProvider, useNotification } from '../../context/NotificationContext';
import NotificationToast from '../../components/NotificationToast';
import ThemeSwitcher from '../../components/ThemeSwitcher/ThemeSwitcher';
import DatosPersonales from './components/DatosPersonales/DatosPersonales';
import MigrationsDashboard from './components/MigrationsDashboard/MigrationsDashboard';
import BusquedaAfiliados from './components/v1.0/BusquedaAfiliados';
import GestionPlanesV1 from './components/GestionPlanesV1/GestionPlanesV1';
import GestionPlanesV1ErrorBoundary from './components/GestionPlanesV1/GestionPlanesV1ErrorBoundary';
import RecibosPage from '../RecibosPage/RecibosPage';
import Cobradores from './components/Cobradores/Cobradores';
import ObrasSociales from './components/ObrasSociales/ObrasSociales';
import ServiciosAdicionales from './components/ServiciosAdicionales/ServiciosAdicionales';
import TiposDeGrupo from './components/TiposDeGrupo/TiposDeGrupo';
import TiposDePlan from './components/TiposDePlan/TiposDePlan';
import GestionUsuarios from './components/GestionUsuarios/GestionUsuarios';
import ConfiguracionNotificaciones from './components/ConfiguracionNotificaciones/ConfiguracionNotificaciones';
import GestionBugs from './components/GestionBugs/GestionBugs';
import GestionProvinciasZonas from './components/GestionProvinciasZonas/GestionProvinciasZonas';
import GestionAuditoria from './components/GestionAuditoria/GestionAuditoria';
import QueryExecPage from './components/QueryExec/QueryExecPage';
import GestionProvinciasZonas from './components/GestionProvinciasZonas/GestionProvinciasZonas';
import configService from '../../services/configService';
import './DashboardPage.scss';

// ── Iconos simples (SVG inline) ──────────────────────────────────────────────

const ICONS = {
  'mi-cuenta': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  'administracion': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/><path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>,
  'gestion': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  'requerimientos-bugs': <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="13" x2="16" y2="13"/><line x1="12" y1="17" x2="16" y2="17"/><line x1="8" y1="13" x2="8" y2="13.01"/><line x1="8" y1="17" x2="8" y2="17.01"/></svg>,
};

// ── Sidebar ──────────────────────────────────────────────────────────────────

function buildMenu(isAdmin) {
  const menu = [
    {
      key: 'gestion',
      label: 'Gestión',
      children: [
        { key: 'busqueda-afiliados', label: 'Búsqueda de Afiliados' },
        { key: 'gestion-planes-v1', label: 'Gestión de Planes' },
        { key: 'gestion-recibos', label: 'Gestión de Recibos' },
        { key: 'cobradores', label: 'Cobradores' },
        { key: 'obras-sociales', label: 'Obras Sociales' },
        { key: 'servicios-adicionales', label: 'Servicios Adicionales' },
        { key: 'tipos-de-grupo', label: 'Tipos de Grupo' },
        { key: 'tipos-de-plan', label: 'Tipos de Plan' },
      ],
    },
    {
      key: 'requerimientos-bugs',
      label: 'Requerimientos y Bugs',
      children: [
        { key: 'gestion-bugs', label: 'Requerimientos y Bugs' },
      ],
    },
    {
      key: 'mi-cuenta',
      label: 'Mi Cuenta',
      children: [
        { key: 'datos-personales', label: 'Datos Personales' },
      ],
    },
  ];

  // Sección de Administración solo para admin
  if (isAdmin) {
    menu.push({
      key: 'administracion',
      label: 'Administración',
      children: [
        { key: 'provincias-zonas', label: 'Provincias y Zonas' },
        { key: 'auditoria', label: 'Auditoría' },
        { key: 'herramienta-queries', label: 'Herramienta de Queries' },
        { key: 'gestion-usuarios', label: 'Gestión de Usuarios' },
        { key: 'configuracion-notificaciones', label: 'Configuración UI' },
        { key: 'migraciones-bd', label: 'Migraciones BD' },
        { key: 'provincias-zonas', label: 'Provincias y Zonas' },
      ],
    });
  }

  // Sección de Cerrar sesión (siempre al final)
  menu.push({
    key: 'logout',
    label: 'Cerrar sesión',
    isLogout: true,
  });

  return menu;
}

function Sidebar({ activeModule, onSelect, sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed, menu, onLogout }) {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleExpand = (key) => {
    setExpandedSection(expandedSection === key ? null : key);
  };

  const handleSelect = (key) => {
    onSelect(key);
    // Solo cerrar sidebar en mobile (cuando está abierto como drawer)
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {sidebarOpen && (
        <div className="dashboard__sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`dashboard__sidebar${sidebarOpen ? ' dashboard__sidebar--open' : ''}${sidebarCollapsed ? ' dashboard__sidebar--collapsed' : ''}`}>
        <nav className="dashboard__nav">
          {menu.map((item) => {
            if (item.isLogout) {
              return (
                <div key={item.key} className="dashboard__nav-group dashboard__nav-group--logout">
                  <button
                    className="dashboard__nav-section dashboard__nav-section--logout"
                    onClick={() => {
                      onLogout();
                      if (sidebarOpen) {
                        setSidebarOpen(false);
                      }
                    }}
                  >
                    <span className="dashboard__nav-label">{item.label}</span>
                  </button>
                </div>
              );
            }

            return (
              <div key={item.key} className="dashboard__nav-group">
                {item.children ? (
                  <>
                    <button
                      className="dashboard__nav-section"
                      onClick={() => toggleExpand(item.key)}
                    >
                      <span className="dashboard__nav-icon">{ICONS[item.key]}</span>
                      <span className="dashboard__nav-label">{item.label}</span>
                      <span className={`dashboard__nav-chevron${expandedSection === item.key ? ' dashboard__nav-chevron--open' : ''}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                      </span>
                    </button>
                    {expandedSection === item.key && (
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
            );
          })}
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

// ── Página principal con contenido ──────────────────────────────────────────

function DashboardPageContent() {
  const { user, logout } = useAuth();
  const [activeModule, setActiveModule] = useState('gestion-planes-v1');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const menu = buildMenu(user?.rol === 'admin');

  const initials = `${user?.nombre?.[0] ?? ''}${user?.apellido?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="dashboard">
      <NotificationToast />
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
          <ThemeSwitcher />
          <button
            className="dashboard__help-btn"
            onClick={() => window.open('/docs', '_blank')}
            title="Abrir documentación (nueva pestaña)"
            aria-label="Abrir documentación de ayuda"
          >
            ?
          </button>
        </div>
      </header>

      {/* Body: sidebar + contenido */}
      <div className="dashboard__body">
        <button
          className="dashboard__sidebar-collapse-btn"
          onClick={() => setSidebarCollapsed((v) => !v)}
          title={sidebarCollapsed ? "Expandir menú" : "Contraer menú"}
          aria-label="Toggle menú lateral"
        >
          {sidebarCollapsed ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 6l6 6-6 6"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M15 6l-6 6 6 6"/>
            </svg>
          )}
        </button>
        <Sidebar
          activeModule={activeModule}
          onSelect={setActiveModule}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          menu={menu}
          onLogout={logout}
        />

        <main className="dashboard__content">
          {activeModule === 'datos-personales' && <DatosPersonales />}
          {activeModule === 'busqueda-afiliados' && <BusquedaAfiliados />}
          {activeModule === 'gestion-planes-v1' && (
            <GestionPlanesV1ErrorBoundary>
              <GestionPlanesV1 />
            </GestionPlanesV1ErrorBoundary>
          )}
          {activeModule === 'gestion-recibos' && <RecibosPage />}
          {activeModule === 'gestion-bugs' && <GestionBugs />}
          {activeModule === 'auditoria' && <GestionAuditoria />}
          {activeModule === 'herramienta-queries' && <QueryExecPage />}
          {activeModule === 'gestion-usuarios' && <GestionUsuarios />}
          {activeModule === 'configuracion-notificaciones' && <ConfiguracionNotificaciones />}
          {activeModule === 'migraciones-bd' && <MigrationsDashboard />}
          {activeModule === 'provincias-zonas' && <GestionProvinciasZonas />}
          {activeModule === 'cobradores' && <Cobradores />}
          {activeModule === 'obras-sociales' && <ObrasSociales />}
          {activeModule === 'servicios-adicionales' && <ServiciosAdicionales />}
          {activeModule === 'tipos-de-grupo' && <TiposDeGrupo />}
          {activeModule === 'tipos-de-plan' && <TiposDePlan />}
          {activeModule === 'provincias-zonas' && <GestionProvinciasZonas />}
          {!activeModule && <Bienvenida user={user} />}
        </main>
      </div>
    </div>
  );
}

// ── Componente wrapper con NotificationProvider ──────────────────────────────

function DashboardPageWithNotification() {
  const { addNotification } = useNotification();

  useEffect(() => {
    window.__notificationContext = { addNotification };
    return () => delete window.__notificationContext;
  }, [addNotification]);

  return <DashboardPageContent />;
}

// ── Componente wrapper principal que carga configuración ─────────────────────

export default function DashboardPage() {
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await configService.getConfiguracion();
        setConfig(data);
      } catch (error) {
        console.error('Error al cargar configuración:', error);
        setConfig({});
      } finally {
        setLoadingConfig(false);
      }
    };

    loadConfig();
  }, []);

  if (loadingConfig) return <div>Cargando configuración...</div>;

  return (
    <NotificationProvider config={config}>
      <DashboardPageWithNotification />
    </NotificationProvider>
  );
}
