import React from 'react';
import ReactDOM from 'react-dom/client';
import { Quill } from 'react-quill';
import './index.scss';
import App from './App';

// Registrar formatos de Quill ANTES de que React renderice
// Esto evita el timing issue de ReactQuill
try {
  // Registrar formatos de size (valores en px)
  const Size = Quill.import('formats/size');
  if (Size) {
    Size.whitelist = ['8px', '10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px'];
    Quill.register(Size, true);
  }

  // Registrar formatos de font
  const Font = Quill.import('formats/font');
  if (Font) {
    Font.whitelist = ['Arial', 'Courier New', 'Georgia', 'Helvetica', 'Times New Roman', 'Verdana'];
    Quill.register(Font, true);
  }

  // Nota: módulo Table no está disponible en Quill 1.3.7 sin dependencias externas
} catch (err) {
  console.error('Error initializing Quill formats:', err);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
