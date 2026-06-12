import React from 'react';

/**
 * Renderiza un bloque de forma estática (read-only)
 * Usado para mostrar bloques en Recibo 2, 3, 4, etc.
 */
const StaticBlockPreview = ({ blockName, blockData }) => {
  if (!blockData) return null;

  switch (blockName) {
    case 'encabezado':
      return (
        <div className="static-block encabezado" style={{ fontSize: '10px' }}>
          {blockData.empresa_nombre && <div style={{ fontWeight: 'bold' }}>{blockData.empresa_nombre}</div>}
          {blockData.empresa_direccion && <div>{blockData.empresa_direccion}</div>}
          {blockData.empresa_telefono && <div>{blockData.empresa_telefono}</div>}
        </div>
      );

    case 'afiliado':
      return (
        <div className="static-block afiliado" style={{ fontSize: '9px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {blockData.filas?.map((fila, idx) => (
                <tr key={idx}>
                  <td style={{ paddingRight: '8px' }}>{fila.etiqueta}:</td>
                  <td>{fila.placeholder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'detalles':
      return (
        <div className="static-block detalles" style={{ fontSize: '9px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
            <tbody>
              {blockData.filas?.map((fila, idx) => (
                <tr key={idx} style={{ borderTop: '1px solid #ccc' }}>
                  <td style={{ padding: '2px 4px' }}>{fila.etiqueta}</td>
                  <td style={{ padding: '2px 4px', textAlign: 'right' }}>{fila.placeholder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'pie':
      return (
        <div className="static-block pie" style={{ fontSize: '8px' }}>
          {blockData.aclaracion && <div>{blockData.aclaracion}</div>}
          {blockData.mostrar_linea_firma && <div style={{ marginTop: '4px', borderTop: '1px solid #000', marginBottom: '2px', height: '12px' }} />}
          {blockData.texto_legal && <div style={{ fontSize: '7px', marginTop: '2px' }}>{blockData.texto_legal}</div>}
        </div>
      );

    default:
      return null;
  }
};

export default StaticBlockPreview;
