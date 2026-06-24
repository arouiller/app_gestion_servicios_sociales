import React, { useState, useRef, useEffect } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Registrar formatos de size (solo una vez)
if (!Quill.import('formats/size').whitelist) {
  const Size = Quill.import('formats/size');
  Size.whitelist = ['8px', '10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px'];
  Quill.register(Size, true);
}

// Registrar formatos de font (solo una vez)
if (!Quill.import('formats/font').whitelist) {
  const Font = Quill.import('formats/font');
  Font.whitelist = ['Arial', 'Courier New', 'Georgia', 'Helvetica', 'Times New Roman', 'Verdana'];
  Quill.register(Font, true);
}

const CellEditorModal = ({ celda, placeholders = {}, onSave, onClose }) => {
  const [content, setContent] = useState(celda?.contenido || '');
  const [searchTerm, setSearchTerm] = useState('');
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSave = () => {
    onSave(content);
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
                  [{ 'font': ['Arial', 'Courier New', 'Georgia', 'Helvetica', 'Times New Roman', 'Verdana'] }],
                  [{ 'size': ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px'] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  ['blockquote', 'code-block'],
                  [{ 'header': 1 }, { 'header': 2 }],
                  [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                  ['link']
                ]
              }}
              formats={['font', 'size', 'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block', 'header', 'list', 'link']}
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
