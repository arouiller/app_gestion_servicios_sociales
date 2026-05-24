import { create } from 'zustand';

const FONTS = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Helvetica'];

const makeCell = (overrides = {}) => ({
  id: crypto.randomUUID(),
  content: '',
  hidden: false,
  rowspan: 1,
  colspan: 1,
  style: {
    borderTop:    { width: 1, style: 'solid', color: '#000000' },
    borderRight:  { width: 1, style: 'solid', color: '#000000' },
    borderBottom: { width: 1, style: 'solid', color: '#000000' },
    borderLeft:   { width: 1, style: 'solid', color: '#000000' },
    fontFamily: 'Arial',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    textAlign: 'left',
    fontSize: 11,
    backgroundColor: '',
    color: '#000000',
    padding: 4,
    verticalAlign: 'top',
  },
  ...overrides,
});

const makeRow = (numCols) => ({
  id: crypto.randomUUID(),
  height: null,
  cells: Array.from({ length: numCols }, () => makeCell()),
});

const getDefaultTable = () => ({
  rows: Array.from({ length: 3 }, () => makeRow(3)),
  columnWidths: [33.33, 33.33, 33.34],
  tableStyle: { width: '100%' },
});

const defaultPageConfig = {
  size: 'A4',
  orientation: 'portrait',
  pageMargins: { top: 10, right: 10, bottom: 10, left: 10 },
  reciboMargins: { top: 4, right: 4, bottom: 4, left: 4 },
  recibosPerPage: 1,
};

const getNumCols = (table) => table.rows[0]?.cells.length ?? 0;

export const useReciboDesignerStore = create((set, get) => ({
  table: getDefaultTable(),
  pageConfig: defaultPageConfig,
  currentTemplate: null,
  selection: { mode: 'none', anchor: null, focus: null },
  activeCellPos: null,
  activeCellRef: null,
  isSaving: false,
  isDirty: false,
  error: null,

  // ════════════════════════════════════════════════════════════════
  // Acciones básicas
  // ════════════════════════════════════════════════════════════════

  setActiveCell: (pos, ref) => {
    set({ activeCellPos: pos, activeCellRef: { current: ref?.current } });
  },

  updateCellContent: (row, col, content) => {
    set((state) => {
      const newTable = JSON.parse(JSON.stringify(state.table));
      if (newTable.rows[row]?.cells[col]) {
        newTable.rows[row].cells[col].content = content;
      }
      return { table: newTable, isDirty: true };
    });
  },

  updateCellStyle: (row, col, partialStyle) => {
    set((state) => {
      const newTable = JSON.parse(JSON.stringify(state.table));
      if (newTable.rows[row]?.cells[col]) {
        newTable.rows[row].cells[col].style = {
          ...newTable.rows[row].cells[col].style,
          ...partialStyle,
        };
      }
      return { table: newTable, isDirty: true };
    });
  },

  setColumnWidths: (widths) => {
    set((state) => ({
      table: { ...state.table, columnWidths: widths },
      isDirty: true,
    }));
  },

  setRowHeight: (rowIndex, height) => {
    set((state) => {
      const newTable = JSON.parse(JSON.stringify(state.table));
      if (newTable.rows[rowIndex]) {
        newTable.rows[rowIndex].height = height;
      }
      return { table: newTable, isDirty: true };
    });
  },

  setPageConfig: (partial) => {
    set((state) => {
      const newPageConfig = { ...state.pageConfig, ...partial };
      if (partial.pageMargins) {
        newPageConfig.pageMargins = { ...state.pageConfig.pageMargins, ...partial.pageMargins };
      }
      if (partial.reciboMargins) {
        newPageConfig.reciboMargins = { ...state.pageConfig.reciboMargins, ...partial.reciboMargins };
      }
      return { pageConfig: newPageConfig, isDirty: true };
    });
  },

  setSelection: (selection) => {
    set({ selection });
  },

  // ════════════════════════════════════════════════════════════════
  // Operaciones de estructura: filas y columnas
  // ════════════════════════════════════════════════════════════════

  addRowAfter: (rowIndex) => {
    set((state) => {
      const newTable = JSON.parse(JSON.stringify(state.table));
      const numCols = getNumCols(newTable);
      const newRow = makeRow(numCols);

      // Ajustar rowspans de celdas que cruzan la posición
      for (let c = 0; c < numCols; c++) {
        for (let r = rowIndex; r >= 0; r--) {
          const cell = newTable.rows[r].cells[c];
          if (cell && !cell.hidden && r + cell.rowspan > rowIndex) {
            cell.rowspan++;
            break;
          }
        }
      }

      newTable.rows.splice(rowIndex + 1, 0, newRow);
      return { table: newTable, isDirty: true };
    });
  },

  addRowBefore: (rowIndex) => {
    set((state) => {
      const newTable = JSON.parse(JSON.stringify(state.table));
      const numCols = getNumCols(newTable);
      const newRow = makeRow(numCols);

      for (let c = 0; c < numCols; c++) {
        for (let r = rowIndex - 1; r >= 0; r--) {
          const cell = newTable.rows[r].cells[c];
          if (cell && !cell.hidden && r + cell.rowspan > rowIndex - 1) {
            cell.rowspan++;
            break;
          }
        }
      }

      newTable.rows.splice(rowIndex, 0, newRow);
      return { table: newTable, isDirty: true };
    });
  },

  deleteRow: (rowIndex) => {
    set((state) => {
      if (state.table.rows.length <= 1) return state;

      const newTable = JSON.parse(JSON.stringify(state.table));
      const numCols = getNumCols(newTable);

      // Reducir rowspans de celdas que se extienden más allá de la fila a eliminar
      for (let c = 0; c < numCols; c++) {
        for (let r = rowIndex - 1; r >= 0; r--) {
          const cell = newTable.rows[r].cells[c];
          if (cell && !cell.hidden && r + cell.rowspan > rowIndex) {
            cell.rowspan--;
            break;
          }
        }
      }

      newTable.rows.splice(rowIndex, 1);
      return { table: newTable, isDirty: true };
    });
  },

  addColumnAfter: (colIndex) => {
    set((state) => {
      const newTable = JSON.parse(JSON.stringify(state.table));
      const numCols = getNumCols(newTable);

      // Insertar celda nueva en cada fila
      newTable.rows.forEach((row) => {
        row.cells.splice(colIndex + 1, 0, makeCell());
      });

      // Ajustar colspans
      newTable.rows.forEach((row) => {
        for (let c = colIndex; c >= 0; c--) {
          const cell = row.cells[c];
          if (cell && !cell.hidden && c + cell.colspan > colIndex) {
            cell.colspan++;
            break;
          }
        }
      });

      // Recalcular columnWidths
      const totalWidth = newTable.columnWidths.reduce((sum, w) => sum + w, 0);
      const newWidths = [...newTable.columnWidths];
      newWidths.splice(colIndex + 1, 0, 100 / (numCols + 1));
      newTable.columnWidths = newWidths.map((w) => (w * totalWidth) / (totalWidth + 100 / (numCols + 1)));

      return { table: newTable, isDirty: true };
    });
  },

  addColumnBefore: (colIndex) => {
    set((state) => {
      const newTable = JSON.parse(JSON.stringify(state.table));
      const numCols = getNumCols(newTable);

      newTable.rows.forEach((row) => {
        row.cells.splice(colIndex, 0, makeCell());
      });

      newTable.rows.forEach((row) => {
        for (let c = colIndex - 1; c >= 0; c--) {
          const cell = row.cells[c];
          if (cell && !cell.hidden && c + cell.colspan > colIndex - 1) {
            cell.colspan++;
            break;
          }
        }
      });

      const totalWidth = newTable.columnWidths.reduce((sum, w) => sum + w, 0);
      const newWidths = [...newTable.columnWidths];
      newWidths.splice(colIndex, 0, 100 / (numCols + 1));
      newTable.columnWidths = newWidths.map((w) => (w * totalWidth) / (totalWidth + 100 / (numCols + 1)));

      return { table: newTable, isDirty: true };
    });
  },

  deleteColumn: (colIndex) => {
    set((state) => {
      const numCols = getNumCols(state.table);
      if (numCols <= 1) return state;

      const newTable = JSON.parse(JSON.stringify(state.table));

      // Reducir colspans
      newTable.rows.forEach((row) => {
        for (let c = colIndex - 1; c >= 0; c--) {
          const cell = row.cells[c];
          if (cell && !cell.hidden && c + cell.colspan > colIndex) {
            cell.colspan--;
            break;
          }
        }
      });

      // Eliminar celda de cada fila
      newTable.rows.forEach((row) => {
        row.cells.splice(colIndex, 1);
      });

      // Recalcular columnWidths
      const newWidths = [...newTable.columnWidths];
      newWidths.splice(colIndex, 1);
      const totalWidth = newWidths.reduce((sum, w) => sum + w, 0);
      newTable.columnWidths = newWidths.map((w) => (w / totalWidth) * 100);

      return { table: newTable, isDirty: true };
    });
  },

  // ════════════════════════════════════════════════════════════════
  // Merge y split
  // ════════════════════════════════════════════════════════════════

  mergeCells: (r1, c1, r2, c2) => {
    set((state) => {
      const newTable = JSON.parse(JSON.stringify(state.table));

      // Validar que no haya merges que salgan del rectángulo
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          const cell = newTable.rows[r]?.cells[c];
          if (
            cell &&
            !cell.hidden &&
            (r + cell.rowspan - 1 > r2 || c + cell.colspan - 1 > c2)
          ) {
            return state; // Merge inválido
          }
        }
      }

      // Recolectar contenidos
      const contents = [];
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          const cell = newTable.rows[r]?.cells[c];
          if (cell && !cell.hidden && cell.content) {
            contents.push(cell.content);
          }
        }
      }

      // Aplicar merge
      const masterCell = newTable.rows[r1].cells[c1];
      masterCell.rowspan = r2 - r1 + 1;
      masterCell.colspan = c2 - c1 + 1;
      masterCell.content = contents.join(' ');

      // Marcar celdas como hidden
      for (let r = r1; r <= r2; r++) {
        for (let c = c1; c <= c2; c++) {
          if (!(r === r1 && c === c1)) {
            newTable.rows[r].cells[c].hidden = true;
            newTable.rows[r].cells[c].rowspan = 1;
            newTable.rows[r].cells[c].colspan = 1;
            newTable.rows[r].cells[c].content = '';
          }
        }
      }

      return { table: newTable, isDirty: true };
    });
  },

  splitCell: (row, col) => {
    set((state) => {
      const newTable = JSON.parse(JSON.stringify(state.table));
      const cell = newTable.rows[row]?.cells[col];

      if (!cell) return state;

      const { rowspan: r, colspan: c } = cell;

      cell.rowspan = 1;
      cell.colspan = 1;

      for (let ri = row; ri < row + r; ri++) {
        for (let ci = col; ci < col + c; ci++) {
          if (!(ri === row && ci === col)) {
            newTable.rows[ri].cells[ci].hidden = false;
            newTable.rows[ri].cells[ci].rowspan = 1;
            newTable.rows[ri].cells[ci].colspan = 1;
            newTable.rows[ri].cells[ci].content = '';
          }
        }
      }

      return { table: newTable, isDirty: true };
    });
  },

  // ════════════════════════════════════════════════════════════════
  // Serialización y deserialización
  // ════════════════════════════════════════════════════════════════

  generateHTML: () => {
    const { table, pageConfig } = get();
    const colWidths = table.columnWidths;

    let tableHtml = '<table style="width:100%;border-collapse:collapse;">';
    tableHtml += '<colgroup>';
    colWidths.forEach((w) => {
      tableHtml += `<col style="width:${w}%">`;
    });
    tableHtml += '</colgroup><tbody>';

    table.rows.forEach((row) => {
      const heightStyle = row.height ? `height:${row.height}px;` : '';
      tableHtml += `<tr style="${heightStyle}">`;

      row.cells.forEach((cell) => {
        if (cell.hidden) return;

        const s = cell.style;
        const border = (b) =>
          `${b.width}px ${b.style} ${b.color}`;
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

        tableHtml += `<td${cs}${rs} style="${styleStr}">${cell.content}</td>`;
      });

      tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table>';

    // Envolver con márgenes del recibo
    const { reciboMargins } = pageConfig;
    const wrapperStyle = `padding:${reciboMargins.top}mm ${reciboMargins.right}mm ${reciboMargins.bottom}mm ${reciboMargins.left}mm;`;
    const html = `<div style="${wrapperStyle}">${tableHtml}</div>`;

    return html;
  },

  parseHTMLtoTable: (html) => {
    if (!html || !html.trim()) {
      set({ table: getDefaultTable() });
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const table = doc.querySelector('table');

      if (!table) {
        set({ table: getDefaultTable() });
        return;
      }

      let rows = Array.from(table.querySelectorAll('tbody > tr'));
      if (rows.length === 0) {
        rows = Array.from(table.querySelectorAll('tr'));
      }

      if (rows.length === 0) {
        set({ table: getDefaultTable() });
        return;
      }

      const numCols = Math.max(...rows.map((row) => row.querySelectorAll('td, th').length), 3);
      const cellCursor = rows.map(() => Array(numCols).fill(0));

      const newTable = {
        rows: rows.map((trEl, rowIdx) => {
          const cells = Array(numCols);

          for (let c = 0; c < numCols; c++) {
            if (cellCursor[rowIdx][c] > 0) {
              cellCursor[rowIdx][c]--;
              cells[c] = makeCell({ hidden: true });
              continue;
            }

            const tdEls = Array.from(trEl.querySelectorAll('td, th'));
            const tdEl = tdEls.find((td, idx) => {
              let colCount = 0;
              for (let i = 0; i < idx; i++) {
                colCount += parseInt(tdEls[i].getAttribute('colspan') || '1');
              }
              return colCount === c;
            });

            if (tdEl && c < numCols) {
              const rowspan = parseInt(tdEl.getAttribute('rowspan') || '1');
              const colspan = parseInt(tdEl.getAttribute('colspan') || '1');

              const cell = makeCell({
                content: tdEl.textContent || '',
                rowspan,
                colspan,
              });

              // Parsear style inline
              const style = tdEl.getAttribute('style') || '';
              const parseStyleValue = (styleStr) => {
                const styleObj = {};
                styleStr.split(';').forEach((decl) => {
                  const [key, value] = decl.split(':').map((s) => s.trim());
                  if (key && value) styleObj[key] = value;
                });
                return styleObj;
              };

              const inlineStyle = parseStyleValue(style);

              if (inlineStyle['font-family']) cell.style.fontFamily = inlineStyle['font-family'].replace(/['"]/g, '');
              if (inlineStyle['font-weight']) cell.style.fontWeight = inlineStyle['font-weight'];
              if (inlineStyle['font-style']) cell.style.fontStyle = inlineStyle['font-style'];
              if (inlineStyle['text-decoration']) cell.style.textDecoration = inlineStyle['text-decoration'];
              if (inlineStyle['text-align']) cell.style.textAlign = inlineStyle['text-align'];
              if (inlineStyle['font-size']) cell.style.fontSize = parseInt(inlineStyle['font-size']) || 11;
              if (inlineStyle['color']) cell.style.color = inlineStyle['color'];
              if (inlineStyle['background-color']) cell.style.backgroundColor = inlineStyle['background-color'];
              if (inlineStyle['padding']) cell.style.padding = parseInt(inlineStyle['padding']) || 4;
              if (inlineStyle['vertical-align']) cell.style.verticalAlign = inlineStyle['vertical-align'];

              const parseBorder = (borderStr) => {
                if (!borderStr || borderStr === 'none') {
                  return { width: 0, style: 'none', color: '#000000' };
                }
                const parts = borderStr.split(' ');
                return {
                  width: parseInt(parts[0]) || 1,
                  style: parts[1] || 'solid',
                  color: parts[2] || '#000000',
                };
              };

              if (inlineStyle['border-top']) cell.style.borderTop = parseBorder(inlineStyle['border-top']);
              if (inlineStyle['border-right']) cell.style.borderRight = parseBorder(inlineStyle['border-right']);
              if (inlineStyle['border-bottom']) cell.style.borderBottom = parseBorder(inlineStyle['border-bottom']);
              if (inlineStyle['border-left']) cell.style.borderLeft = parseBorder(inlineStyle['border-left']);

              cells[c] = cell;

              for (let r = rowIdx; r < rowIdx + rowspan && r < rows.length; r++) {
                for (let col = c; col < c + colspan && col < numCols; col++) {
                  if (r !== rowIdx || col !== c) {
                    if (!cellCursor[r]) cellCursor[r] = Array(numCols).fill(0);
                    cellCursor[r][col]++;
                  }
                }
              }
            } else {
              cells[c] = makeCell({ hidden: true });
            }
          }

          return {
            id: crypto.randomUUID(),
            height: null,
            cells,
          };
        }),
        columnWidths: Array(numCols)
          .fill(0)
          .map(() => 100 / numCols),
        tableStyle: { width: '100%' },
      };

      set({ table: newTable });
    } catch (error) {
      console.error('Error parsing HTML:', error);
      set({ table: getDefaultTable() });
    }
  },

  loadTemplate: (template) => {
    if (!template) {
      set({
        table: getDefaultTable(),
        pageConfig: defaultPageConfig,
        currentTemplate: null,
        isDirty: false,
      });
      return;
    }

    const html = template.html || '';
    const parsePageConfig = (marginJson) => {
      if (!marginJson) return defaultPageConfig;
      try {
        const parsed = typeof marginJson === 'string' ? JSON.parse(marginJson) : marginJson;
        return { ...defaultPageConfig, ...parsed };
      } catch {
        return defaultPageConfig;
      }
    };

    get().parseHTMLtoTable(html);

    set({
      currentTemplate: {
        id: template.id,
        nombre: template.nombre,
        templateGroupId: template.templateGroupId,
        versionNumber: template.versionNumber,
        activo: template.activo,
      },
      pageConfig: parsePageConfig(template.margins),
      isDirty: false,
      error: null,
    });
  },

  // ════════════════════════════════════════════════════════════════
  // Estado
  // ════════════════════════════════════════════════════════════════

  setSaving: (isSaving) => set({ isSaving }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
