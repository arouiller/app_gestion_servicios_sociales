import React, { useState, useEffect } from 'react';
import './ThemeSwitcher.scss';

function ThemeSwitcher() {
  const [currentTheme, setCurrentTheme] = useState('claro');
  const themes = ['claro', 'oscuro', 'azul', 'verde'];

  useEffect(() => {
    // Cargar tema guardado en localStorage
    const savedTheme = localStorage.getItem('selectedTheme') || 'claro';
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (theme) => {
    // Remover todas las clases de tema
    themes.forEach(t => {
      document.body.classList.remove(`theme-${t}`);
    });
    // Agregar la clase del nuevo tema
    document.body.classList.add(`theme-${theme}`);
    // Guardar en localStorage
    localStorage.setItem('selectedTheme', theme);
    setCurrentTheme(theme);
  };

  return (
    <div className="theme-switcher">
      {themes.map((theme) => (
        <button
          key={theme}
          className={`theme-switcher__btn theme-switcher__btn--${theme} ${currentTheme === theme ? 'active' : ''}`}
          onClick={() => applyTheme(theme)}
          title={`Tema ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
          aria-label={`Cambiar a tema ${theme}`}
        />
      ))}
    </div>
  );
}

export default ThemeSwitcher;
