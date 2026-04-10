import React from 'react';
import {
  FiUsers,
  FiCheckCircle,
  FiShield,
} from 'react-icons/fi';
import './Hero.scss';

const TRUST_BADGES = [
  { icon: <FiUsers />, text: 'Grupos familiares' },
  { icon: <FiCheckCircle />, text: 'Pagos al día' },
  { icon: <FiShield />, text: 'Acceso seguro' },
];

function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero__bg">
        <div className="hero__bg-shape hero__bg-shape--1" />
        <div className="hero__bg-shape hero__bg-shape--2" />
        <div className="hero__bg-shape hero__bg-shape--3" />
      </div>

      <div className="hero__container">
        <div className="hero__content">
          <span className="hero__badge">Sistema de Gestión</span>

          <h1 className="hero__title">
            Gestioná tus servicios
            <br />
            <span className="hero__title-accent">sociales sin complicaciones</span>
          </h1>

          <p className="hero__subtitle">
            Administrá afiliados, grupos familiares, planes y cuotas desde un solo
            lugar. Automatizá la generación de cuotas mensuales y llevá el control
            total de los pagos de tu organización.
          </p>

          <div className="hero__actions">
            <a href="/login" className="btn btn--white btn--lg">
              Ingresar al sistema
            </a>
            <a href="#how-it-works" className="btn btn--white-outline btn--lg">
              Ver cómo funciona
            </a>
          </div>

          <div className="hero__badges">
            {TRUST_BADGES.map((badge, i) => (
              <div key={i} className="hero__trust-badge">
                <span className="hero__trust-icon">{badge.icon}</span>
                <span>{badge.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero__visual">
          <div className="hero__card hero__card--main">
            <div className="hero__card-header">
              <div className="hero__card-dot hero__card-dot--red" />
              <div className="hero__card-dot hero__card-dot--yellow" />
              <div className="hero__card-dot hero__card-dot--green" />
              <span className="hero__card-title">Panel de control</span>
            </div>
            <div className="hero__card-body">
              <div className="hero__stat-row">
                <div className="hero__stat-box">
                  <span className="hero__stat-value">248</span>
                  <span className="hero__stat-label">Afiliados activos</span>
                </div>
                <div className="hero__stat-box">
                  <span className="hero__stat-value">94%</span>
                  <span className="hero__stat-label">Cuotas al dia</span>
                </div>
              </div>
              <div className="hero__chart-placeholder">
                <div className="hero__chart-bar" style={{ height: '60%' }} />
                <div className="hero__chart-bar" style={{ height: '80%' }} />
                <div className="hero__chart-bar" style={{ height: '55%' }} />
                <div className="hero__chart-bar" style={{ height: '95%' }} />
                <div className="hero__chart-bar" style={{ height: '70%' }} />
                <div className="hero__chart-bar" style={{ height: '85%' }} />
              </div>
              <div className="hero__chart-label">Recaudacion mensual</div>
            </div>
          </div>

          <div className="hero__card hero__card--notification">
            <div className="hero__notif-dot" />
            <div>
              <div className="hero__notif-title">Cuota generada</div>
              <div className="hero__notif-sub">Plan Familiar — Abril 2026</div>
            </div>
          </div>

          <div className="hero__card hero__card--user">
            <div className="hero__user-avatar">MG</div>
            <div>
              <div className="hero__user-name">Maria Gonzalez</div>
              <div className="hero__user-plan">Plan Familiar · Titular</div>
            </div>
            <span className="hero__user-badge">Activo</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
