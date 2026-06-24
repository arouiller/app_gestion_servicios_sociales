import React from 'react';
import ReactDOM from 'react-dom/client';
import { Quill } from 'react-quill';
import './index.scss';
import App from './App';

// Registrar módulos de Quill ANTES de que React renderice
// Esto evita el timing issue de ReactQuill
try {
  // Registrar módulo Table nativo de Quill
  const Table = Quill.import('modules/table');
  if (Table) {
    Quill.register('modules/table', Table);
  }

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
} catch (err) {
  console.error('Error initializing Quill modules:', err);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
