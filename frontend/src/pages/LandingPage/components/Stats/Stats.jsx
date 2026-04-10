import React from 'react';
import './Stats.scss';

const STATS = [
  { value: '100%', label: 'Web y mobile', desc: 'Acceso desde cualquier dispositivo' },
  { value: '0', label: 'Instalacion requerida', desc: 'Solo necesitas un navegador' },
  { value: '24/7', label: 'Disponibilidad', desc: 'Sistema siempre disponible' },
  { value: 'OAuth', label: 'Acceso seguro', desc: 'Login con Google, sin passwords' },
];

function Stats() {
  return (
    <section className="stats" id="stats">
      <div className="stats__container">
        <div className="stats__header">
          <span className="section-badge">Ventajas</span>
          <h2 className="stats__title">Moderno, simple y seguro</h2>
        </div>
        <div className="stats__grid">
          {STATS.map((stat, i) => (
            <div key={i} className="stats__item">
              <div className="stats__value">{stat.value}</div>
              <div className="stats__label">{stat.label}</div>
              <div className="stats__desc">{stat.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Stats;
