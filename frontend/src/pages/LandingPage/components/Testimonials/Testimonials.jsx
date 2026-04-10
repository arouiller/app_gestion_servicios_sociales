import React from 'react';
import { FiStar } from 'react-icons/fi';
import './Testimonials.scss';

const TESTIMONIALS = [
  {
    initials: 'CR',
    name: 'Carlos Rodriguez',
    role: 'Director Administrativo',
    org: 'Mutual La Esperanza',
    text: 'Pasamos de manejar todo en planillas de Excel a tener un sistema centralizado. La generacion automatica de cuotas nos ahorra horas de trabajo todos los meses.',
  },
  {
    initials: 'LM',
    name: 'Laura Martinez',
    role: 'Coordinadora de Afiliados',
    org: 'Obra Social del Comercio',
    text: 'Por fin un sistema que entiende como funciona una mutual. Los grupos familiares, los planes por grupo y el historial de pagos son exactamente lo que necesitabamos.',
  },
  {
    initials: 'JP',
    name: 'Jorge Perez',
    role: 'Tesorero',
    org: 'Asociacion Civil Solidaria',
    text: 'El dashboard de cobranzas nos da una vision clara del estado financiero en tiempo real. El acceso con Google hace que el equipo adopte el sistema sin resistencia.',
  },
];

function Testimonials() {
  return (
    <section className="testimonials">
      <div className="testimonials__container">
        <div className="testimonials__header">
          <span className="section-badge">Testimonios</span>
          <h2 className="testimonials__title">Lo que dicen nuestros usuarios</h2>
        </div>

        <div className="testimonials__grid">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="testimonial-card">
              <div className="testimonial-card__stars">
                {[...Array(5)].map((_, j) => (
                  <FiStar key={j} className="testimonial-card__star" />
                ))}
              </div>
              <p className="testimonial-card__text">"{t.text}"</p>
              <div className="testimonial-card__author">
                <div className="testimonial-card__avatar">{t.initials}</div>
                <div>
                  <div className="testimonial-card__name">{t.name}</div>
                  <div className="testimonial-card__role">
                    {t.role} · {t.org}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
