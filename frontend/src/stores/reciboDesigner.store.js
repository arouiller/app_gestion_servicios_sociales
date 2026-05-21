import { create } from 'zustand';

// Función auxiliar: convertir HTML simple a estructura grid
const parseHTMLtoGrid = (html) => {
  if (!html || typeof html !== 'string') return getEmptyGrid();

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('table');

    if (!table) return getEmptyGrid();

    const rows = [];
    table.querySelectorAll('tr').forEach((trElement) => {
      const cells = [];
      trElement.querySelectorAll('td, th').forEach((tdElement) => {
        cells.push({
          content: tdElement.textContent.trim(),
          colspan: parseInt(tdElement.getAttribute('colspan') || 1),
        });
      });
      rows.push({ cells });
    });

    return rows.length > 0 ? rows : getEmptyGrid();
  } catch (error) {
    console.error('Error parsing HTML:', error);
    return getEmptyGrid();
  }
};

// Función auxiliar: generar grid vacío
const getEmptyGrid = () => {
  return [
    { cells: Array(3).fill(null).map(() => ({ content: '', colspan: 1 })) },
    { cells: Array(3).fill(null).map(() => ({ content: '', colspan: 1 })) },
    { cells: Array(3).fill(null).map(() => ({ content: '', colspan: 1 })) },
  ];
};

// Función auxiliar: convertir grid a HTML
const gridToHTML = (grid) => {
  let html = '<table>\n';
  grid.forEach((row) => {
    html += '  <tr>\n';
    row.cells.forEach((cell) => {
      const colspanAttr = cell.colspan > 1 ? ` colspan="${cell.colspan}"` : '';
      html += `    <td${colspanAttr}>${cell.content || ''}</td>\n`;
    });
    html += '  </tr>\n';
  });
  html += '</table>';
  return html;
};

export const useReciboDesignerStore = create((set, get) => ({
  // State
  grid: getEmptyGrid(),
  pageConfig: { size: 'A4', orientation: 'portrait', margins: 8 },
  currentTemplate: null,
  isSaving: false,
  error: null,

  // Actions
  loadTemplate: (template) =>
    set({
      currentTemplate: template,
      grid: parseHTMLtoGrid(template.html),
      pageConfig: {
        size: template.pageSize,
        orientation: template.orientation,
        margins: template.margins,
      },
      error: null,
    }),

  addRow: () =>
    set((state) => {
      const newRow = {
        cells: Array(state.grid[0]?.cells.length || 3)
          .fill(null)
          .map(() => ({ content: '', colspan: 1 })),
      };
      return { grid: [...state.grid, newRow] };
    }),

  deleteRow: () =>
    set((state) => {
      if (state.grid.length <= 1) return state;
      return { grid: state.grid.slice(0, -1) };
    }),

  addColumn: () =>
    set((state) => {
      return {
        grid: state.grid.map((row) => ({
          cells: [...row.cells, { content: '', colspan: 1 }],
        })),
      };
    }),

  deleteColumn: () =>
    set((state) => {
      if (state.grid[0]?.cells.length <= 1) return state;
      return {
        grid: state.grid.map((row) => ({
          cells: row.cells.slice(0, -1),
        })),
      };
    }),

  clearGrid: () =>
    set({
      grid: getEmptyGrid(),
    }),

  updateCell: (rowIdx, cellIdx, content, colspan) =>
    set((state) => {
      const newGrid = state.grid.map((row, rIdx) =>
        rIdx === rowIdx
          ? {
              cells: row.cells.map((cell, cIdx) =>
                cIdx === cellIdx
                  ? { content, colspan: parseInt(colspan) || 1 }
                  : cell
              ),
            }
          : row
      );
      return { grid: newGrid };
    }),

  setPageConfig: (config) =>
    set((state) => ({
      pageConfig: { ...state.pageConfig, ...config },
    })),

  generateHTML: () => {
    const { grid } = get();
    return gridToHTML(grid);
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  setSaving: (isSaving) => set({ isSaving }),
}));
