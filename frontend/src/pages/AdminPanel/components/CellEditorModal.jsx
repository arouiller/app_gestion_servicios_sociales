import React, { useState, useRef, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const CellEditorModal = ({ celda, placeholders = {}, onSave, onClose }) => {
  // Reemplazar espacios múltiples con &nbsp; al cargar para que ReactQuill los preserve
  const preserveMultipleSpaces = (text) => {
    return text.replace(/ {2,}/g, (match) => '&nbsp;'.repeat(match.length));
  };

  const [content, setContent] = useState(preserveMultipleSpaces(celda?.contenido || ''));
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef(null);

  // Agregar estilos para tamaños de fuente (solo una vez)
  useEffect(() => {
    if (!document.getElementById('quill-size-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'quill-size-styles';
      styleSheet.innerHTML = `
        .ql-snow .ql-picker.ql-size .ql-picker-label::before { content: "Tamaño" !important; }
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="8px"]::before { content: "8px" !important; }
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="10px"]::before { content: "10px" !important; }
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="12px"]::before { content: "12px" !important; }
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="14px"]::before { content: "14px" !important; }
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="16px"]::before { content: "16px" !important; }
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="18px"]::before { content: "18px" !important; }
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="20px"]::before { content: "20px" !important; }
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="24px"]::before { content: "24px" !important; }
        .ql-snow .ql-picker.ql-size .ql-picker-item[data-value="28px"]::before { content: "28px" !important; }

        .ql-size-8px { font-size: 8px !important; }
        .ql-size-10px { font-size: 10px !important; }
        .ql-size-12px { font-size: 12px !important; }
        .ql-size-14px { font-size: 14px !important; }
        .ql-size-16px { font-size: 16px !important; }
        .ql-size-18px { font-size: 18px !important; }
        .ql-size-20px { font-size: 20px !important; }
        .ql-size-24px { font-size: 24px !important; }
        .ql-size-28px { font-size: 28px !important; }
      `;
      document.head.appendChild(styleSheet);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Convertir &nbsp; de vuelta a espacios al guardar
  const restoreMultipleSpaces = (text) => {
    return text.replace(/(&nbsp;)+/g, (match) => ' '.repeat(match.length / 6)); // &nbsp; tiene 6 caracteres
  };

  const handleSave = () => {
    onSave(restoreMultipleSpaces(content));
  };

  const handleInsertPlaceholder = (placeholder) => {
    setContent(content + ' ' + placeholder);
  };

  // Filtrar placeholders por término de búsqueda
  const filteredPlaceholders = {};
  Object.entries(placeholders).forEach(([category, items]) => {
    const filtered = items.filter(item =>
      item.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (filtered.length > 0) {
      filteredPlaceholders[category] = filtered;
    }
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div
        ref={modalRef}
        style={{
          width: '75%',
          height: '75vh',
          backgroundColor: 'white',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          padding: '20px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px' }}>Editar Celda</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#999'
            }}
          >
            ✕
          </button>
        </div>

        {/* Contenido principal */}
        <div style={{ display: 'flex', gap: '16px', flex: 1, overflow: 'hidden' }}>
          {/* Editor de contenido */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#666' }}>
              Contenido (con formato)
            </label>
            <ReactQuill
              value={content}
              onChange={setContent}
              modules={{
                toolbar: [
                  [
                    { 'font': ['Arial', 'Courier New', 'Georgia', 'Helvetica', 'Times New Roman', 'Verdana'] },
                    { 'size': ['8px', '10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px'] }
                  ],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'align': [] }],
                  ['blockquote', 'code-block'],
                  [{ 'header': 1 }, { 'header': 2 }],
                  [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                  ['link']
                ]
              }}
              formats={['font', 'size', 'bold', 'italic', 'underline', 'strike', 'align', 'blockquote', 'code-block', 'header', 'list', 'link']}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column'
              }}
              theme="snow"
            />
          </div>

          {/* Panel de placeholders */}
          <div
            style={{
              width: '280px',
              backgroundColor: '#fff9e6',
              borderRadius: '4px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderLeft: '3px solid #ffd700'
            }}
          >
            <label style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
              📋 Placeholders
            </label>
            <input
              type="text"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                fontSize: '11px',
                padding: '6px 8px',
                border: '1px solid #ddd',
                borderRadius: '3px',
                marginBottom: '8px',
                backgroundColor: '#fff'
              }}
            />

            <div style={{ flex: 1, overflow: 'auto' }}>
              {Object.entries(filteredPlaceholders).length > 0 ? (
                Object.entries(filteredPlaceholders).map(([category, items]) => (
                  <div key={category} style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#333', marginBottom: '4px', textTransform: 'uppercase' }}>
                      {category}
                    </div>
                    {items.map((placeholder) => (
                      <button
                        key={placeholder}
                        onClick={() => handleInsertPlaceholder(placeholder)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          fontSize: '10px',
                          padding: '6px 8px',
                          marginBottom: '2px',
                          border: '1px solid #ddd',
                          borderRadius: '3px',
                          backgroundColor: '#fff',
                          color: '#333',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontFamily: 'monospace'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#ffd700';
                          e.target.style.borderColor = '#ff9800';
                          e.target.style.color = '#000';
                          e.target.style.fontWeight = 'bold';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#fff';
                          e.target.style.borderColor = '#ddd';
                          e.target.style.color = '#333';
                          e.target.style.fontWeight = 'normal';
                        }}
                      >
                        {placeholder}
                      </button>
                    ))}
                  </div>
                ))
              ) : (
                <em style={{ fontSize: '11px', color: '#999' }}>
                  {searchTerm ? 'No se encontraron placeholders' : 'No hay placeholders'}
                </em>
              )}
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#f5f5f5',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: '#28a745',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CellEditorModal;
