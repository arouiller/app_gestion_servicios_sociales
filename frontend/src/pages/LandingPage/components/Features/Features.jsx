import React from 'react';
import {
  FiUsers,
  FiHome,
  FiFileText,
  FiDollarSign,
  FiBell,
  FiBarChart2,
} from 'react-icons/fi';
import './Features.scss';

const FEATURES = [
  {
    icon: <FiUsers />,
    color: '#1a6b8a',
    bg: '#e8f4f8',
    title: 'Gestión de Afiliados',
    desc: 'Registrá y administrá todos tus afiliados con su información completa: datos personales, estado, tipo de afiliacion y documentacion.',
  },
  {
    icon: <FiHome />,
    color: '#27ae60',
    bg: '#e8f8ef',
    title: 'Grupos Familiares',
    desc: 'Organizá titulares y dependientes en grupos familiares. Cada grupo tiene su propio plan y sus cuotas se generan automaticamente.',
  },
  {
    icon: <FiFileText />,
    color: '#8e44ad',
    bg: '#f3e8f8',
    title: 'Planes y Cobertura',
    desc: 'Definí distintos planes con precios y coberturas diferenciadas. Asignalos a grupos familiares segun sus necesidades.',
  },
  {
    icon: <FiDollarSign />,
    color: '#e67e22',
    bg: '#fef3e8',
    title: 'Cuotas y Pagos',
    desc: 'Genera cuotas mensuales de forma automatica para todos los grupos. Registrá pagos parciales o totales y lleva el historial completo.',
  },
  {
    icon: <FiBell />,
    color: '#e74c3c',
    bg: '#fde8e8',
    title: 'Notificaciones',
    desc: 'Sistema de notificaciones configurable. Los afiliados reciben alertas de cuotas pendientes, confirmaciones de pago y avisos importantes.',
  },
  {
    icon: <FiBarChart2 />,
    color: '#2c3e50',
    bg: '#eaecee',
    title: 'Reportes y Dashboard',
    desc: 'Panel de control con graficos de recaudacion mensual, estado de cuotas, afiliados activos y metricas clave para la toma de decisiones.',
  },
];

function Features() {
  return (
    <section className="features" id="features">
      <div className="features__container">
        <div className="features__header">
          <span className="section-badge">Funcionalidades</span>
          <h2 className="features__title">
            Todo lo que necesitas
            <br />
            en un solo sistema
          </h2>
          <p className="features__subtitle">
            Diseñado para organizaciones de servicios sociales que buscan
            modernizar su gestion y mejorar la experiencia de sus afiliados.
          </p>
        </div>

        <div className="features__grid">
          {FEATURES.map((feature, i) => (
            <div key={i} className="feature-card">
              <div
                className="feature-card__icon"
                style={{ background: feature.bg, color: feature.color }}
              >
                {feature.icon}
              </div>
              <h3 className="feature-card__title">{feature.title}</h3>
              <p className="feature-card__desc">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
