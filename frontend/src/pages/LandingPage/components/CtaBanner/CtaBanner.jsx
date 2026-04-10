import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';
import './CtaBanner.scss';

function CtaBanner() {
  return (
    <section className="cta-banner">
      <div className="cta-banner__container">
        <div className="cta-banner__content">
          <h2 className="cta-banner__title">
            Listo para modernizar
            <br />
            tu gestion de servicios sociales?
          </h2>
          <p className="cta-banner__subtitle">
            Ingresa al sistema con tu cuenta Google institucional y empeza
            a gestionar afiliados, planes y pagos hoy mismo.
          </p>
          <div className="cta-banner__actions">
            <Link to="/login" className="btn btn--white btn--lg">
              Ingresar ahora
              <FiArrowRight />
            </Link>
          </div>
        </div>
        <div className="cta-banner__decoration">
          <div className="cta-banner__circle cta-banner__circle--1" />
          <div className="cta-banner__circle cta-banner__circle--2" />
          <div className="cta-banner__circle cta-banner__circle--3" />
        </div>
      </div>
    </section>
  );
}

export default CtaBanner;
