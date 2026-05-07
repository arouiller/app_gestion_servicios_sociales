import React, { useState, useMemo } from 'react';
import queryExecService from '../../../../services/queryExecService';
import useColumnResize from '../../../../hooks/useColumnResize';
import '../../../../styles/_table-standard.scss';
import './QueryExecPage.scss';

function QueryExecPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [columns, setColumns] = useState([]);

  // Redimensionamiento de columnas dinámico
  const defaultWidths = useMemo(() => {
    const w = {};
    columns.forEach(col => { w[col] = 150; });
    return w;
  }, [columns.length]);

  const { widths, getResizeHandle } = useColumnResize('query-exec', defaultWidths);

  const handleExecute = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setResults([]);
    setColumns([]);
    setLoading(true);

    try {
      const response = await queryExecService.executeQuery(query);

      if (!response.success) {
        setError(response.message || 'Error al ejecutar query');
        return;
      }

      // Manejar SELECT (con datos) o INSERT/UPDATE/DELETE (sin datos)
      if (response.data) {
        setResults(response.data);
        // Extraer columnas del primer resultado
        if (response.data.length > 0) {
          setColumns(Object.keys(response.data[0]));
        }
      } else {
        // Para INSERT/UPDATE/DELETE, mostrar filas afectadas
        setResults([]);
        setColumns([]);
      }

      setMessage(response.message);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al ejecutar query');
      setResults([]);
      setColumns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setColumns([]);
    setError(null);
    setMessage(null);
  };

  return (
    <div className="query-exec">
      <h2 className="query-exec__title">Ejecución de Queries SQL</h2>

      <div className="query-exec__warning">
        ⚠️ <strong>Advertencia:</strong> Se permiten SELECT, INSERT, UPDATE y DELETE. Operaciones DROP, ALTER y CREATE están prohibidas. Usa con cuidado, los cambios son permanentes.
      </div>

      <form onSubmit={handleExecute} className="query-exec__form">
        <div className="query-exec__input-group">
          <label htmlFor="query-input" className="query-exec__label">
            Query SQL:
          </label>
          <textarea
            id="query-input"
            className="query-exec__textarea"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej: SELECT * FROM personas LIMIT 10 | INSERT INTO ... | UPDATE ... | DELETE FROM ..."
            disabled={loading}
          />
        </div>

        {error && <div className="query-exec__alert query-exec__alert--error">{error}</div>}
        {message && <div className="query-exec__alert query-exec__alert--info">{message}</div>}

        <div className="query-exec__actions">
          <button
            type="submit"
            className="query-exec__btn query-exec__btn--primary"
            disabled={loading || !query.trim()}
          >
            {loading ? 'Ejecutando...' : '▶ Ejecutar'}
          </button>
          <button
            type="button"
            className="query-exec__btn query-exec__btn--secondary"
            onClick={handleClear}
            disabled={loading}
          >
            Limpiar
          </button>
        </div>
      </form>

      {results.length > 0 && (
        <div className="query-exec__results">
          <h3 className="query-exec__results-title">
            Resultados ({results.length} registros)
          </h3>

          <div className="table-wrapper">
            <table className="table-standard query-exec__table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col} style={{ width: widths[col] }}>
                      {col}{getResizeHandle(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, idx) => (
                  <tr key={idx}>
                    {columns.map((col) => (
                      <td key={`${idx}-${col}`} className="query-exec__cell">
                        {renderValue(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && results.length === 0 && !error && query && message && (
        <div className="query-exec__empty">
          <p>La query se ejecutó pero no devolvió resultados.</p>
        </div>
      )}
    </div>
  );
}

function renderValue(value) {
  if (value === null || value === undefined) {
    return <span className="query-exec__null">NULL</span>;
  }

  if (typeof value === 'boolean') {
    return <span className="query-exec__boolean">{value ? 'true' : 'false'}</span>;
  }

  if (typeof value === 'object') {
    return <span className="query-exec__object">{JSON.stringify(value)}</span>;
  }

  if (typeof value === 'string' && value.length > 100) {
    return <span title={value}>{value.substring(0, 100)}...</span>;
  }

  return String(value);
}

export default QueryExecPage;
