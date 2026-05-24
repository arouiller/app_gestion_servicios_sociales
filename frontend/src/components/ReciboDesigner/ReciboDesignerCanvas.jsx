import React from 'react';
import { useReciboDesignerStore } from '../../stores/reciboDesigner.store';
import { EditableTable } from './EditableTable/EditableTable';

const PAGE_SIZES_MM = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  Carta: { width: 216, height: 279 },
  Personalizado: { width: 210, height: 297 },
};

const MM_TO_PX = 3.7795;
const SCALE = 0.8;

export const ReciboDesignerCanvas = () => {
  const pageConfig = useReciboDesignerStore((s) => s.pageConfig);

  const pageSize = PAGE_SIZES_MM[pageConfig.size] || PAGE_SIZES_MM.A4;
  const isLandscape = pageConfig.orientation === 'landscape';
  const width = isLandscape ? pageSize.height : pageSize.width;
  const height = isLandscape ? pageSize.width : pageSize.height;

  const widthPx = width * MM_TO_PX * SCALE;
  const heightPx = height * MM_TO_PX * SCALE;

  const { pageMargins, reciboMargins } = pageConfig;
  const marginsPx = {
    top: pageMargins.top * MM_TO_PX * SCALE,
    right: pageMargins.right * MM_TO_PX * SCALE,
    bottom: pageMargins.bottom * MM_TO_PX * SCALE,
    left: pageMargins.left * MM_TO_PX * SCALE,
  };

  const reciboMarginsPx = {
    top: reciboMargins.top * MM_TO_PX * SCALE,
    right: reciboMargins.right * MM_TO_PX * SCALE,
    bottom: reciboMargins.bottom * MM_TO_PX * SCALE,
    left: reciboMargins.left * MM_TO_PX * SCALE,
  };

  const renderPage = (index) => (
    <div
      key={index}
      className="paper"
      style={{
        width: `${widthPx}px`,
        height: `${heightPx}px`,
        backgroundColor: 'white',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: `${marginsPx.top}px ${marginsPx.right}px ${marginsPx.bottom}px ${marginsPx.left}px`,
      }}
    >
      <div
        style={{
          padding: `${reciboMarginsPx.top}px ${reciboMarginsPx.right}px ${reciboMarginsPx.bottom}px ${reciboMarginsPx.left}px`,
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* EditableTable solo es editable en la primera página */}
        {index === 0 ? (
          <EditableTable />
        ) : (
          <div
            style={{
              flex: 1,
              overflow: 'auto',
            }}
          >
            {/* Preview read-only de la tabla para páginas adicionales */}
            <TablePreview />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        flex: 1,
        overflow: 'auto',
      }}
    >
      {Array.from({ length: pageConfig.recibosPerPage }, (_, i) => renderPage(i))}
    </div>
  );
};

// Componente auxiliar para preview read-only
const TablePreview = () => {
  const table = useReciboDesignerStore((s) => s.table);

  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
      }}
    >
      <colgroup>
        {table.columnWidths.map((w, i) => (
          <col key={i} style={{ width: `${w}%` }} />
        ))}
      </colgroup>
      <tbody>
        {table.rows.map((row) => (
          <tr key={row.id} style={{ height: row.height ? `${row.height}px` : undefined }}>
            {row.cells.map((cell) => {
              if (cell.hidden) return null;

              const s = cell.style;
              const border = (b) => `${b.width}px ${b.style} ${b.color}`;
              const styleStr = [
                `border-top:${border(s.borderTop)}`,
                `border-right:${border(s.borderRight)}`,
                `border-bottom:${border(s.borderBottom)}`,
                `border-left:${border(s.borderLeft)}`,
                `font-family:${s.fontFamily}`,
                `font-weight:${s.fontWeight}`,
                `font-style:${s.fontStyle}`,
                `text-decoration:${s.textDecoration}`,
                `text-align:${s.textAlign}`,
                `font-size:${s.fontSize}px`,
                `padding:${s.padding}px`,
                `vertical-align:${s.verticalAlign}`,
                `color:${s.color}`,
                s.backgroundColor ? `background-color:${s.backgroundColor}` : '',
              ]
                .filter(Boolean)
                .join(';');

              const cs = cell.colspan > 1 ? ` colspan="${cell.colspan}"` : '';
              const rs = cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : '';

              return (
                <td key={cell.id} colSpan={cell.colspan} rowSpan={cell.rowspan} style={{ ...styleAttr(styleStr) }}>
                  {cell.content}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const styleAttr = (styleStr) => {
  const obj = {};
  styleStr.split(';').forEach((decl) => {
    const [key, value] = decl.split(':').map((s) => s.trim());
    if (key && value) {
      const camelKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      obj[camelKey] = value;
    }
  });
  return obj;
};
