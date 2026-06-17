import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useTemplateStore from '../../../hooks/useTemplateStore';
import '../RecibosTemplatesPage.scss';

const initTabla = () => ({
  type: 'tabla',
  filas: [
    {
      id: uuidv4(),
      celdas: [
        { id: uuidv4(), contenido: '<strong>Afiliado</strong>', ancho: 40 },
        { id: uuidv4(), contenido: '{{numero_afiliado}}', ancho: 60 }
      ]
    },
    {
      id: uuidv4(),
      celdas: [
        { id: uuidv4(), contenido: '<strong>Titular</strong>', ancho: 40 },
        { id: uuidv4(), contenido: '{{titular_apellido}}, {{titular_nombre}}', ancho: 60 }
      ]
    },
    {
      id: uuidv4(),
      celdas: [
        { id: uuidv4(), contenido: '<strong>O.S.</strong>', ancho: 40 },
        { id: uuidv4(), contenido: '{{obra_social_nombre}}', ancho: 60 }
      ]
    }
  ],
  bordeTabla: true,
  tamanoFuente: 11
});

const addFila = (tabla) => {
  if (!tabla || !tabla.filas || tabla.filas.length === 0) return tabla;
  const ultimaFila = tabla.filas[tabla.filas.length - 1];
  const nuevaCeldas = ultimaFila.celdas.map(celda => ({
    id: uuidv4(),
    contenido: '',
    ancho: celda.ancho
  }));
  return {
    ...tabla,
    filas: [
      ...tabla.filas,
      {
        id: uuidv4(),
        celdas: nuevaCeldas
      }
    ]
  };
};

const deleteFila = (tabla, rowId) => {
  if (!tabla || tabla.filas.length <= 1) return tabla;
  return {
    ...tabla,
    filas: tabla.filas.filter(f => f.id !== rowId)
  };
};

const addColumna = (tabla) => {
  if (!tabla) return tabla;
  const numCols = tabla.filas[0]?.celdas.length || 1;
  const anchoEquitativo = Math.round(100 / (numCols + 1));
  return {
    ...tabla,
    filas: tabla.filas.map(fila => ({
      ...fila,
      celdas: [
        ...fila.celdas.map(celda => ({
          ...celda,
          ancho: celda.ancho * numCols / (numCols + 1)
        })),
        { id: uuidv4(), contenido: '', ancho: anchoEquitativo }
      ]
    }))
  };
};

const deleteColumna = (tabla, colIndex) => {
  if (!tabla || tabla.filas[0].celdas.length <= 1) return tabla;
  const numCols = tabla.filas[0].celdas.length;
  return {
    ...tabla,
    filas: tabla.filas.map(fila => ({
      ...fila,
      celdas: fila.celdas
        .filter((_, idx) => idx !== colIndex)
        .map(celda => ({
          ...celda,
          ancho: celda.ancho * numCols / (numCols - 1)
        }))
    }))
  };
};

const updateCelda = (tabla, rowId, cellId, campo, valor) => {
  return {
    ...tabla,
    filas: tabla.filas.map(fila => {
      if (fila.id === rowId) {
        return {
          ...fila,
          celdas: fila.celdas.map(celda =>
            celda.id === cellId ? { ...celda, [campo]: valor } : celda
          )
        };
      }
      return fila;
    })
  };
};

const TableEditor = ({ placeholders = {} }) => {
  const currentTemplate = useTemplateStore((state) => state.currentTemplate);
  const updateTemplate = useTemplateStore((state) => state.updateTemplate);
  const [editingCellId, setEditingCellId] = useState(null);
  const [showPlaceholderPopover, setShowPlaceholderPopover] = useState(null);

  // Inicializar tabla si no existe
  const tabla = currentTemplate.bloques?.[0]?.type === 'tabla'
    ? currentTemplate.bloques[0]
    : initTabla();

  // Asegurar que tabla esté en bloques
  if (!currentTemplate.bloques || !currentTemplate.bloques[0] || currentTemplate.bloques[0].type !== 'tabla') {
    updateTemplate({ bloques: [tabla] });
  }

  const handleAddFila = () => {
    const nuevaTabla = addFila(tabla);
    updateTemplate({ bloques: [nuevaTabla], isDirty: true });
  };

  const handleDeleteFila = (rowId) => {
    const nuevaTabla = deleteFila(tabla, rowId);
    updateTemplate({ bloques: [nuevaTabla], isDirty: true });
  };

  const handleAddColumna = () => {
    const nuevaTabla = addColumna(tabla);
    updateTemplate({ bloques: [nuevaTabla], isDirty: true });
  };

  const handleDeleteColumna = (colIndex) => {
    const nuevaTabla = deleteColumna(tabla, colIndex);
    updateTemplate({ bloques: [nuevaTabla], isDirty: true });
  };

  const handleCeldaChange = (rowId, cellId, valor) => {
    const nuevaTabla = updateCelda(tabla, rowId, cellId, 'contenido', valor);
    updateTemplate({ bloques: [nuevaTabla] });
  };

  const handleInsertPlaceholder = (rowId, cellId, placeholder) => {
    const celda = tabla.filas
      .find(f => f.id === rowId)?.celdas
      .find(c => c.id === cellId);
    if (celda) {
      const nuevoContenido = celda.contenido + ' ' + placeholder;
      handleCeldaChange(rowId, cellId, nuevoContenido);
    }
    setShowPlaceholderPopover(null);
  };

  const numCols = tabla.filas[0]?.celdas.length || 1;

  return (
    <div className="table-editor">
      <h4>Edición de Tabla</h4>

      <div className="table-toolbar">
        <button className="btn btn-sm btn-primary" onClick={handleAddFila} title="Agregar fila">
          + Fila
        </button>
        <button className="btn btn-sm btn-primary" onClick={handleAddColumna} title="Agregar columna">
          + Columna
        </button>
        <small style={{ marginLeft: '12px', color: '#666' }}>
          {tabla.filas.length} filas × {numCols} columnas
        </small>
      </div>

      <div className="table-editor-grid" style={{ marginTop: '12px' }}>
        {/* Header de columnas con opciones */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${numCols}, 1fr)`, gap: '4px', marginBottom: '8px' }}>
          {tabla.filas[0]?.celdas.map((_, colIndex) => (
            <div
              key={`col-header-${colIndex}`}
              style={{
                position: 'relative',
                minHeight: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#666',
                paddingX: '4px'
              }}
            >
              <span>Col {colIndex + 1}</span>
              {numCols > 1 && (
                <button
                  className="btn-close-mini"
                  onClick={() => handleDeleteColumna(colIndex)}
                  title="Eliminar columna"
                  style={{ padding: '0', width: '16px', height: '16px' }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Grid de celdas */}
        {tabla.filas.map((fila, rowIndex) => (
          <div
            key={`row-${fila.id}`}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${numCols}, 1fr)`,
              gap: '4px',
              marginBottom: '8px',
              alignItems: 'start',
              position: 'relative'
            }}
          >
            {fila.celdas.map((celda) => (
              <div
                key={`celda-${celda.id}`}
                style={{
                  position: 'relative',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  padding: '4px',
                  minHeight: '60px',
                  backgroundColor: editingCellId === celda.id ? '#f0f8ff' : '#fff',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
                onClick={() => setEditingCellId(celda.id)}
              >
                {editingCellId === celda.id ? (
                  <div style={{ position: 'relative' }}>
                    <textarea
                      autoFocus
                      value={celda.contenido}
                      onChange={(e) => handleCeldaChange(fila.id, celda.id, e.target.value)}
                      onBlur={() => setEditingCellId(null)}
                      style={{
                        width: '100%',
                        minHeight: '50px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        padding: '4px',
                        border: '1px solid #4dabf7',
                        borderRadius: '3px',
                        boxSizing: 'border-box'
                      }}
                      placeholder="Contenido (HTML o {{placeholder}})"
                    />
                    <button
                      className="btn btn-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPlaceholderPopover(
                          showPlaceholderPopover === celda.id ? null : celda.id
                        );
                      }}
                      style={{ marginTop: '4px', fontSize: '10px' }}
                    >
                      Insertar placeholder
                    </button>

                    {/* Popover de placeholders */}
                    {showPlaceholderPopover === celda.id && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: '0',
                          backgroundColor: 'white',
                          border: '1px solid #ccc',
                          borderRadius: '4px',
                          padding: '8px',
                          zIndex: 100,
                          maxWidth: '300px',
                          maxHeight: '200px',
                          overflow: 'auto',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {Object.entries(placeholders).map(([category, items]) => (
                          <div key={category} style={{ marginBottom: '8px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>
                              {category}
                            </div>
                            {items.map((placeholder) => (
                              <button
                                key={placeholder}
                                className="btn btn-xs"
                                onClick={() => handleInsertPlaceholder(fila.id, celda.id, placeholder)}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  textAlign: 'left',
                                  marginBottom: '2px',
                                  fontSize: '10px',
                                  padding: '4px 8px'
                                }}
                              >
                                {placeholder}
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      wordBreak: 'break-word',
                      fontSize: '10px',
                      maxHeight: '50px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      lineHeight: '1.3'
                    }}
                  >
                    {celda.contenido ? (
                      <div dangerouslySetInnerHTML={{ __html: celda.contenido }} />
                    ) : (
                      <em style={{ color: '#999' }}>vacío</em>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Botón eliminar fila */}
            {tabla.filas.length > 1 && (
              <button
                className="btn-close-mini"
                onClick={() => handleDeleteFila(fila.id)}
                title="Eliminar fila"
                style={{
                  position: 'absolute',
                  right: '-24px',
                  top: '0',
                  padding: '0',
                  width: '20px',
                  height: '20px'
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '12px', fontSize: '11px', color: '#999' }}>
        <p>💡 Haz click en una celda para editar. Usa &lt;strong&gt;, &lt;em&gt;, etc. para HTML.</p>
        <p>💡 Inserta placeholders entre dobles llaves: {'{{numero_afiliado}}'}, {'{{obra_social_nombre}}'}, etc.</p>
      </div>
    </div>
  );
};

export default TableEditor;
export { initTabla, addFila, deleteFila, addColumna, deleteColumna, updateCelda };
