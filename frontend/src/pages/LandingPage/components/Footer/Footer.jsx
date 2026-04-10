import React from 'react';
import './Footer.scss';

function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="footer__container">
        <div className="footer__top">
          <div className="footer__brand">
            <div className="footer__logo">
              <span className="footer__logo-icon">GS</span>
              <span className="footer__logo-text">GestSocial</span>
            </div>
            <p className="footer__tagline">
              Sistema de gestión de servicios sociales.<br />
              Simple, moderno y seguro.
            </p>
          </div>

          <div className="footer__links-group">
            <h4 className="footer__links-title">Sistema</h4>
            <ul className="footer__links">
              <li><a href="#features">Funcionalidades</a></li>
              <li><a href="#how-it-works">Como funciona</a></li>
              <li><a href="/login">Ingresar</a></li>
            </ul>
          </div>

          <div className="footer__links-group">
            <h4 className="footer__links-title">Tecnología</h4>
            <ul className="footer__links">
              <li><a href="#">React + Node.js</a></li>
              <li><a href="#">MySQL</a></li>
              <li><a href="#">OAuth 2.0 Google</a></li>
            </ul>
          </div>

          <div className="footer__links-group">
            <h4 className="footer__links-title">Soporte</h4>
            <ul className="footer__links">
              <li><a href="#">Documentacion</a></li>
              <li><a href="#">Contacto</a></li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <p className="footer__copy">
            &copy; {new Date().getFullYear()} GestSocial. Sistema de gestion de servicios sociales.
          </p>
          <p className="footer__stack">
            Construido con React · Express.js · MySQL
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
