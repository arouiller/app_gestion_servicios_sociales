import React from 'react';
import { FiLogIn, FiUserPlus, FiCheckSquare } from 'react-icons/fi';
import './HowItWorks.scss';

const STEPS = [
  {
    number: '01',
    icon: <FiLogIn />,
    title: 'Ingresa con tu cuenta Google',
    desc: 'Sin contraseñas que recordar. El acceso al sistema es seguro a traves de tu cuenta institucional de Google.',
  },
  {
    number: '02',
    icon: <FiUserPlus />,
    title: 'Administra afiliados y grupos',
    desc: 'Registrá nuevos afiliados, armalos en grupos familiares y asignalos al plan que corresponda segun su cobertura.',
  },
  {
    number: '03',
    icon: <FiCheckSquare />,
    title: 'Gestioná cuotas y pagos',
    desc: 'Genera las cuotas mensuales con un clic. Registrá pagos, confirmá cobros y visualizá el estado en tiempo real.',
  },
];

function HowItWorks() {
  return (
    <section className="how-it-works" id="how-it-works">
      <div className="how-it-works__container">
        <div className="how-it-works__header">
          <span className="section-badge">Como funciona</span>
          <h2 className="how-it-works__title">Empeza a usar el sistema en minutos</h2>
          <p className="how-it-works__subtitle">
            Tres pasos simples para tener el control total de tu organización.
          </p>
        </div>

        <div className="how-it-works__steps">
          {STEPS.map((step, i) => (
            <div key={i} className="step">
              <div className="step__number">{step.number}</div>
              <div className="step__icon">{step.icon}</div>
              <h3 className="step__title">{step.title}</h3>
              <p className="step__desc">{step.desc}</p>
              {i < STEPS.length - 1 && <div className="step__connector" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
