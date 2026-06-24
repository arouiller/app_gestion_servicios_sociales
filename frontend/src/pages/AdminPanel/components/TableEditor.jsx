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

const addCelda = (tabla, rowId, atIndex = -1) => {
  if (!tabla) return tabla;
  const anchoTotal = tabla.anchoTotal_mm || 170;

  return {
    ...tabla,
    filas: tabla.filas.map(fila => {
      if (fila.id !== rowId) return fila;

      const numCeldasActuales = fila.celdas.length;
      const anchoEquitativo = Math.round(anchoTotal / (numCeldasActuales + 1) * 10) / 10;

      // Reducir todas las celdas proporcionalmente
      const newCeldas = fila.celdas.map(celda => ({
        ...celda,
        ancho_mm: Math.round((celda.ancho_mm || celda.ancho) * numCeldasActuales / (numCeldasActuales + 1) * 10) / 10
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

const deleteCelda = (tabla, rowId, cellId) => {
  if (!tabla) return tabla;
  const anchoTotal = tabla.anchoTotal_mm || 170;

  return {
    ...tabla,
    filas: tabla.filas.map(fila => {
      if (fila.id !== rowId) return fila;
      if (fila.celdas.length <= 1) return fila; // No eliminar si es la última celda

      const celdaAEliminar = fila.celdas.find(c => c.id === cellId);
      if (!celdaAEliminar) return fila;

      const anchoALiberar = celdaAEliminar.ancho_mm || celdaAEliminar.ancho;
      const numCeldasNuevas = fila.celdas.length - 1;

      // Redistribuir el ancho liberado entre todas las celdas restantes
      const newCeldas = fila.celdas
        .filter(c => c.id !== cellId)
        .map(celda => ({
          ...celda,
          ancho_mm: Math.round(((celda.ancho_mm || celda.ancho) + anchoALiberar / numCeldasNuevas) * 10) / 10
        }));

      return {
        ...fila,
        celdas: newCeldas
      };
    })
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
  const filaIdx = tabla.filas.findIndex(f => f.id === rowId);
  if (filaIdx === -1) return tabla;

  const fila = tabla.filas[filaIdx];
  const oldAltura = fila.altura || 15;
  const alturaDiff = altura - oldAltura;
  const numFilas = tabla.filas.length;

  const newFilas = tabla.filas.map((f, idx) => {
    if (f.id === rowId) {
      return { ...f, altura: Math.max(5, altura) };
    }

    // Si es la última fila, ajustar la anterior
    if (filaIdx === numFilas - 1 && idx === numFilas - 2) {
      return { ...f, altura: Math.max(5, (f.altura || 15) - alturaDiff) };
    }
    // Si no es la última, ajustar la última fila
    else if (filaIdx < numFilas - 1 && idx === numFilas - 1) {
      return { ...f, altura: Math.max(5, (f.altura || 15) - alturaDiff) };
    }

    return f;
  });

  return { ...tabla, filas: newFilas };
};

const updateCeldaAncho = (tabla, rowId, cellId, nuevoAncho_mm) => {
  console.log('[updateCeldaAncho] rowId:', rowId, 'cellId:', cellId, 'nuevoAncho:', nuevoAncho_mm);
  console.log('[updateCeldaAncho] tabla.filas:', tabla.filas.map(f => ({ id: f.id, celdas: f.celdas.length })));

  const filaConCelda = tabla.filas.find(f => f.id === rowId);
  if (!filaConCelda) {
    console.log('[updateCeldaAncho] ERROR: No se encontró fila con rowId', rowId);
    return tabla;
  }

  const celdaIdx = filaConCelda.celdas.findIndex(c => c.id === cellId);
  if (celdaIdx === -1) {
    console.log('[updateCeldaAncho] ERROR: No se encontró celda con cellId', cellId);
    return tabla;
  }

  const oldAncho = filaConCelda.celdas[celdaIdx].ancho_mm || filaConCelda.celdas[celdaIdx].ancho;
  const anchoDiff = nuevoAncho_mm - oldAncho;
  const numCeldasEnFila = filaConCelda.celdas.length;
  const anchoTotal = tabla.anchoTotal_mm || 170;

  console.log('[updateCeldaAncho] oldAncho:', oldAncho, 'anchoDiff:', anchoDiff, 'celdaIdx:', celdaIdx);

  // Cascada a nivel de fila: si cambias una celda, la última (o penúltima si cambias última) absorbe
  return {
    ...tabla,
    filas: tabla.filas.map(fila => {
      console.log('[updateCeldaAncho] procesando fila:', fila.id, 'rowId:', rowId, 'coincide:', fila.id === rowId);

      // IMPORTANTE: siempre crear un nuevo array de celdas (no compartir referencias)
      if (fila.id !== rowId) {
        return {
          ...fila,
          celdas: fila.celdas.map(c => ({ ...c })) // Clonar cada celda
        };
      }

      // Clonar TODAS las celdas primero
      const newCeldas = fila.celdas.map(c => ({ ...c }));

      // Modificar la celda cambiadaSRE
      newCeldas[celdaIdx] = { ...newCeldas[celdaIdx], ancho_mm: Math.max(10, nuevoAncho_mm) };

      // Si es la última celda de la fila, ajustar la penúltima
      if (celdaIdx === numCeldasEnFila - 1 && celdaIdx > 0) {
        newCeldas[celdaIdx - 1] = {
          ...newCeldas[celdaIdx - 1],
          ancho_mm: Math.max(10, (newCeldas[celdaIdx - 1].ancho_mm || newCeldas[celdaIdx - 1].ancho) - anchoDiff)
        };
      }
      // Si no es la última, ajustar la última celda de esta fila
      else if (celdaIdx < numCeldasEnFila - 1) {
        newCeldas[numCeldasEnFila - 1] = {
          ...newCeldas[numCeldasEnFila - 1],
          ancho_mm: Math.max(10, (newCeldas[numCeldasEnFila - 1].ancho_mm || newCeldas[numCeldasEnFila - 1].ancho) - anchoDiff)
        };
      }

      return { ...fila, celdas: newCeldas };
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

  const handleAddCelda = (rowId, atIndex = -1) => {
    const nuevaTabla = addCelda(tabla, rowId, atIndex);
    updateTemplate({ bloques: [nuevaTabla], isDirty: true });
  };

  const handleDeleteCelda = (rowId, cellId) => {
    const nuevaTabla = deleteCelda(tabla, rowId, cellId);
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
          {tabla.filas.length} filas (cada fila puede tener diferente número de celdas)
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

                {/* Celdas de estructura con controles por celda */}
                {fila.celdas.map((celda, celdaIdx) => (
                  <td
                    key={`cell-${celda.id}`}
                    style={{
                      width: `${((celda.ancho_mm || celda.ancho) / (tabla.anchoTotal_mm || 170)) * 100}%`,
                      height: '40px',
                      padding: '0',
                      border: '1px solid #ddd',
                      backgroundColor: '#fafafa',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    {/* Controles de celda en cada celda */}
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
                        onClick={() => handleAddCelda(fila.id, celdaIdx)}
                        title="Agregar celda antes"
                        style={{ padding: '2px 4px' }}
                      >
                        ◀
                      </button>
                      <button
                        className="btn btn-xs"
                        onClick={() => handleAddCelda(fila.id, celdaIdx + 1)}
                        title="Agregar celda después"
                        style={{ padding: '2px 4px' }}
                      >
                        ▶
                      </button>
                      {fila.celdas.length > 1 && (
                        <button
                          className="btn btn-xs btn-danger"
                          onClick={() => handleDeleteCelda(fila.id, celda.id)}
                          title="Eliminar celda"
                          style={{ padding: '2px 4px' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
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
export { initTabla, addFila, deleteFila, addCelda, deleteCelda, updateCelda, updateFilaAltura, updateCeldaAncho };
