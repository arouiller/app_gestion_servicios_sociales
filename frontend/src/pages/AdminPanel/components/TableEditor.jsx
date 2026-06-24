import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import useTemplateStore from '../../../hooks/useTemplateStore';
import CellEditorModal from './CellEditorModal';
import '../RecibosTemplatesPage.scss';

const initTabla = () => ({
  type: 'tabla',
  anchoTotal_mm: 170, // Ancho total en mm
  filas: [
    {
      id: uuidv4(),
      altura: 15,
      celdas: [
        { id: uuidv4(), contenido: '', ancho_mm: 85 },
        { id: uuidv4(), contenido: '', ancho_mm: 85 }
      ]
    },
    {
      id: uuidv4(),
      altura: 15,
      celdas: [
        { id: uuidv4(), contenido: '', ancho_mm: 85 },
        { id: uuidv4(), contenido: '', ancho_mm: 85 }
      ]
    },
    {
      id: uuidv4(),
      altura: 15,
      celdas: [
        { id: uuidv4(), contenido: '', ancho_mm: 85 },
        { id: uuidv4(), contenido: '', ancho_mm: 85 }
      ]
    }
  ],
  bordeTabla: true,
  tamanoFuente: 11
});

const addFila = (tabla, atIndex = -1) => {
  if (!tabla || !tabla.filas || tabla.filas.length === 0) return tabla;
  const ultimaFila = tabla.filas[tabla.filas.length - 1];
  const nuevaCeldas = ultimaFila.celdas.map(celda => ({
    id: uuidv4(),
    contenido: '',
    ancho_mm: celda.ancho_mm || celda.ancho
  }));
  const nuevaFila = {
    id: uuidv4(),
    altura: ultimaFila.altura || 15,
    celdas: nuevaCeldas
  };

  if (atIndex >= 0 && atIndex <= tabla.filas.length) {
    return {
      ...tabla,
      filas: [
        ...tabla.filas.slice(0, atIndex),
        nuevaFila,
        ...tabla.filas.slice(atIndex)
      ]
    };
  }

  return {
    ...tabla,
    filas: [...tabla.filas, nuevaFila]
  };
};

const deleteFila = (tabla, rowId) => {
  if (!tabla || tabla.filas.length <= 1) return tabla;
  return {
    ...tabla,
    filas: tabla.filas.filter(f => f.id !== rowId)
  };
};

const addColumna = (tabla, atIndex = -1) => {
  if (!tabla) return tabla;
  const numCols = tabla.filas[0]?.celdas.length || 1;
  const anchoTotal = tabla.anchoTotal_mm || 170;
  const anchoEquitativo = Math.round(anchoTotal / (numCols + 1) * 10) / 10;

  return {
    ...tabla,
    filas: tabla.filas.map(fila => {
      const newCeldas = fila.celdas.map(celda => ({
        ...celda,
        ancho_mm: (celda.ancho_mm || celda.ancho) * numCols / (numCols + 1)
      }));
      const nuevaCelda = { id: uuidv4(), contenido: '', ancho_mm: anchoEquitativo };

      if (atIndex >= 0 && atIndex <= newCeldas.length) {
        return {
          ...fila,
          celdas: [
            ...newCeldas.slice(0, atIndex),
            nuevaCelda,
            ...newCeldas.slice(atIndex)
          ]
        };
      }

      return {
        ...fila,
        celdas: [...newCeldas, nuevaCelda]
      };
    })
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

const updateFilaAltura = (tabla, rowId, altura) => {
  return {
    ...tabla,
    filas: tabla.filas.map(fila =>
      fila.id === rowId ? { ...fila, altura: Math.max(5, altura) } : fila
    )
  };
};

const updateCeldaAncho = (tabla, rowId, cellId, nuevoAncho_mm) => {
  return {
    ...tabla,
    filas: tabla.filas.map(fila => {
      if (fila.id === rowId) {
        const celdaIdx = fila.celdas.findIndex(c => c.id === cellId);
        if (celdaIdx === -1) return fila;

        const oldAncho = fila.celdas[celdaIdx].ancho_mm || fila.celdas[celdaIdx].ancho;
        const anchoDiff = nuevoAncho_mm - oldAncho;

        const newCeldas = [...fila.celdas];
        newCeldas[celdaIdx] = { ...newCeldas[celdaIdx], ancho_mm: Math.max(10, nuevoAncho_mm) };

        // Si hay siguiente celda, restarle el cambio (mantener ancho total fijo)
        if (celdaIdx + 1 < newCeldas.length) {
          const siguienteCelda = newCeldas[celdaIdx + 1];
          newCeldas[celdaIdx + 1] = { ...siguienteCelda, ancho_mm: Math.max(10, (siguienteCelda.ancho_mm || siguienteCelda.ancho) - anchoDiff) };
        }

        return { ...fila, celdas: newCeldas };
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
  const [modalCell, setModalCell] = useState(null);

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

  const handleCellDoubleClick = (rowId, cellId) => {
    const fila = tabla.filas.find(f => f.id === rowId);
    const celda = fila?.celdas.find(c => c.id === cellId);
    if (celda) {
      setModalCell({ rowId, cellId, contenido: celda.contenido });
    }
  };

  const handleModalSave = (nuevoContenido) => {
    if (modalCell) {
      handleCeldaChange(modalCell.rowId, modalCell.cellId, nuevoContenido);
      setModalCell(null);
    }
  };

  const numCols = tabla.filas[0]?.celdas.length || 1;

  // Obtener celda actual del modal
  const modalCelda = modalCell
    ? tabla.filas
        .find(f => f.id === modalCell.rowId)
        ?.celdas.find(c => c.id === modalCell.cellId)
    : null;

  return (
    <div className="table-editor">
      <h4>Edición de Tabla</h4>

      <div className="table-toolbar" style={{ marginBottom: '12px' }}>
        <small style={{ color: '#666', fontWeight: 'bold' }}>
          {tabla.filas.length} filas × {numCols} columnas
        </small>
      </div>

      {/* Tabla simple de estructura */}
      <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {tabla.filas.map((fila, rowIndex) => (
              <tr key={`row-${fila.id}`} style={{ borderBottom: '1px solid #eee' }}>
                {/* Columna de controles de fila */}
                <td
                  style={{
                    width: '40px',
                    padding: '4px',
                    backgroundColor: '#f9f9f9',
                    textAlign: 'center',
                    fontSize: '11px',
                    borderRight: '1px solid #eee'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button
                      className="btn btn-xs"
                      onClick={() => {
                        const nuevaTabla = addFila(tabla, rowIndex);
                        updateTemplate({ bloques: [nuevaTabla], isDirty: true });
                      }}
                      title="Agregar fila arriba"
                      style={{ padding: '2px 4px', fontSize: '9px' }}
                    >
                      ▲
                    </button>
                    <button
                      className="btn btn-xs"
                      onClick={() => {
                        const nuevaTabla = addFila(tabla, rowIndex + 1);
                        updateTemplate({ bloques: [nuevaTabla], isDirty: true });
                      }}
                      title="Agregar fila abajo"
                      style={{ padding: '2px 4px', fontSize: '9px' }}
                    >
                      ▼
                    </button>
                    {tabla.filas.length > 1 && (
                      <button
                        className="btn btn-xs btn-danger"
                        onClick={() => handleDeleteFila(fila.id)}
                        title="Eliminar fila"
                        style={{ padding: '2px 4px', fontSize: '9px' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </td>

                {/* Celdas de estructura */}
                {fila.celdas.map((celda, colIndex) => (
                  <td
                    key={`cell-${celda.id}`}
                    style={{
                      width: `${celda.ancho}%`,
                      height: '40px',
                      padding: '0',
                      border: '1px solid #ddd',
                      backgroundColor: '#fafafa',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    {/* Controles de columna en la primera fila */}
                    {rowIndex === 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-24px',
                          left: '0',
                          right: '0',
                          height: '20px',
                          display: 'flex',
                          gap: '2px',
                          justifyContent: 'center',
                          alignItems: 'center',
                          backgroundColor: '#f0f0f0',
                          borderBottom: '1px solid #ddd',
                          fontSize: '9px'
                        }}
                      >
                        <button
                          className="btn btn-xs"
                          onClick={() => {
                            const nuevaTabla = addColumna(tabla, colIndex);
                            updateTemplate({ bloques: [nuevaTabla], isDirty: true });
                          }}
                          title="Agregar columna antes"
                          style={{ padding: '2px 4px' }}
                        >
                          ◀
                        </button>
                        <button
                          className="btn btn-xs"
                          onClick={() => {
                            const nuevaTabla = addColumna(tabla, colIndex + 1);
                            updateTemplate({ bloques: [nuevaTabla], isDirty: true });
                          }}
                          title="Agregar columna después"
                          style={{ padding: '2px 4px' }}
                        >
                          ▶
                        </button>
                        {numCols > 1 && (
                          <button
                            className="btn btn-xs btn-danger"
                            onClick={() => handleDeleteColumna(colIndex)}
                            title="Eliminar columna"
                            style={{ padding: '2px 4px' }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de edición */}
      {modalCelda && (
        <CellEditorModal
          celda={modalCelda}
          placeholders={placeholders}
          onSave={handleModalSave}
          onClose={() => setModalCell(null)}
        />
      )}
    </div>
  );
};

export default TableEditor;
export { initTabla, addFila, deleteFila, addColumna, deleteColumna, updateCelda, updateFilaAltura, updateCeldaAncho };
