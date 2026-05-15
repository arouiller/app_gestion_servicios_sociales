import React, { useCallback, useEffect, useState } from 'react';
import auditService from '../../../../services/auditService';
import { useConfig } from '../../../../hooks/useConfig';
import usuarioService from '../../../../services/usuarioService';
import SearchContainer from '../../../../components/SearchContainer/SearchContainer';
import Pagination from '../../../../components/Pagination/Pagination';
import useDebounce from '../../../../hooks/useDebounce';
import usePagination from '../../../../hooks/usePagination';
import useColumnResize from '../../../../hooks/useColumnResize';
import '../../../../styles/_table-standard.scss';
import './GestionAuditoria.scss';

function GestionAuditoria() {
  const { config } = useConfig();
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchText, setSearchText] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [horaDesde, setHoraDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [horaHasta, setHoraHasta] = useState('');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [selectedLogParams, setSelectedLogParams] = useState(null);

  const configItemsPerPage = config?.items_per_page || null;
  const auditEnabled = config ? (config.audit_enabled === 1 || config.audit_enabled === '1') : true;

  const debouncedSearchText = useDebounce(searchText, 2000);

  // Redimensionamiento de columnas
  const { widths, getResizeHandle } = useColumnResize('gestion-auditoria', {
    usuario: 120,
    fecha: 160,
    metodo: 90,
    endpoint: 220,
    status: 80,
    parametros: 150,
    ms: 70,
  });

  // Cargar usuarios al montar
  useEffect(() => {
    const loadUsuarios = async () => {
      try {
        const usuariosList = await usuarioService.listar();
        setUsuarios(Array.isArray(usuariosList) ? usuariosList : []);
      } catch (err) {
        console.error('Error cargando usuarios:', err);
      }
    };
    loadUsuarios();
  }, []);

  const cargar = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const params = {};
      if (debouncedSearchText) params.search = debouncedSearchText;
      if (usuarioSeleccionado) params.usuario_id = usuarioSeleccionado;
      if (fechaDesde) {
        params.fecha_desde = horaDesde ? `${fechaDesde}T${horaDesde}` : fechaDesde;
      }
      if (fechaHasta) {
        params.fecha_hasta = horaHasta ? `${fechaHasta}T${horaHasta}` : fechaHasta;
      }
      params.limit = 500; // Cargar todos para paginar en cliente
      const data = await auditService.listar(params);
      setLogs(Array.isArray(data.rows) ? data.rows : []);
      setTotalCount(data.count || 0);
    } catch (err) {
      console.error('Error al cargar auditoría:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar auditoría');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchText, usuarioSeleccionado, fechaDesde, horaDesde, fechaHasta, horaHasta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const pagination = usePagination(logs, 15, configItemsPerPage);

  const handleLimpiarFiltros = () => {
    setSearchText('');
    setUsuarioSeleccionado('');
    setFechaDesde('');
    setHoraDesde('');
    setFechaHasta('');
    setHoraHasta('');
  };

  const getStatusBadgeClass = (status) => {
    if (status >= 200 && status < 300) return 'gestion-auditoria__badge-status--ok';
    if (status >= 300 && status < 400) return 'gestion-auditoria__badge-status--redirect';
    if (status >= 400 && status < 500) return 'gestion-auditoria__badge-status--client-error';
    return 'gestion-auditoria__badge-status--server-error';
  };

  const getMethodBadgeClass = (method) => {
    switch (method) {
      case 'GET':
        return 'gestion-auditoria__badge-method--get';
      case 'POST':
        return 'gestion-auditoria__badge-method--post';
      case 'PUT':
        return 'gestion-auditoria__badge-method--put';
      case 'DELETE':
        return 'gestion-auditoria__badge-method--delete';
      default:
        return '';
    }
  };

  if (loading && logs.length === 0) {
    return <div className="gestion-auditoria__loading">Cargando auditoría...</div>;
  }

  return (
    <div className="gestion-auditoria">
      <div className="gestion-auditoria__header">
        <h2 className="gestion-auditoria__title">Auditoría del Sistema</h2>
      </div>

      {!auditEnabled && (
        <div className="gestion-auditoria__banner gestion-auditoria__banner--inactive">
          <p>⚠️ La auditoría está actualmente inactiva. Habilitarla en <strong>Configuración → Auditoría</strong></p>
        </div>
      )}

      {error && <div className="gestion-auditoria__alert gestion-auditoria__alert--error">{error}</div>}

      {!loading && (
        <div className="gestion-auditoria__filters">
          <SearchContainer
            placeholder="Buscar por endpoint..."
            value={searchText}
            onChange={setSearchText}
            count={logs.length}
            maxItems={totalCount}
          />
          <select
            className="gestion-auditoria__usuario-select"
            value={usuarioSeleccionado}
            onChange={(e) => setUsuarioSeleccionado(e.target.value)}
          >
            <option value="">Todos los usuarios</option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nombre} {usuario.apellido}
              </option>
            ))}
          </select>
          <div className="gestion-auditoria__filter-group">
            <input
              type="date"
              className="gestion-auditoria__date-input"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              placeholder="Desde"
            />
            <input
              type="time"
              className="gestion-auditoria__time-input"
              value={horaDesde}
              onChange={(e) => setHoraDesde(e.target.value)}
            />
          </div>
          <div className="gestion-auditoria__filter-group">
            <input
              type="date"
              className="gestion-auditoria__date-input"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              placeholder="Hasta"
            />
            <input
              type="time"
              className="gestion-auditoria__time-input"
              value={horaHasta}
              onChange={(e) => setHoraHasta(e.target.value)}
            />
          </div>
          <button className="gestion-auditoria__btn-limpiar" onClick={handleLimpiarFiltros}>
            Limpiar
          </button>
          <button className="gestion-auditoria__btn-refresh" onClick={cargar}>
            🔄 Refrescar
          </button>
        </div>
      )}

      {logs.length === 0 ? (
        <p className="gestion-auditoria__empty">
          {auditEnabled
            ? 'No hay registros de auditoría.'
            : 'La auditoría está deshabilitada. No hay registros disponibles.'}
        </p>
      ) : (
        <div className="table-wrapper">
          <table className="table-standard gestion-auditoria__tabla">
            <thead>
              <tr>
                <th style={{ width: widths.usuario }}>Usuario{getResizeHandle('usuario')}</th>
                <th style={{ width: widths.fecha }}>Fecha/Hora{getResizeHandle('fecha')}</th>
                <th style={{ width: widths.metodo }}>Método{getResizeHandle('metodo')}</th>
                <th style={{ width: widths.endpoint }}>Endpoint{getResizeHandle('endpoint')}</th>
                <th style={{ width: widths.status }}>Status{getResizeHandle('status')}</th>
                <th style={{ width: widths.parametros }}>Parámetros{getResizeHandle('parametros')}</th>
                <th style={{ width: widths.ms }}>ms{getResizeHandle('ms')}</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedItems.map((log) => (
                <tr key={log.id}>
                  <td>
                    {log.usuario ? `${log.usuario.apellido}, ${log.usuario.nombre}` : 'Sistema'}
                  </td>
                  <td>{new Date(log.fecha_hora).toLocaleString('es-AR')}</td>
                  <td>
                    <span className={`gestion-auditoria__badge-method ${getMethodBadgeClass(log.metodo)}`}>
                      {log.metodo}
                    </span>
                  </td>
                  <td title={log.endpoint} className="gestion-auditoria__endpoint">
                    {log.endpoint.length > 60 ? log.endpoint.substring(0, 60) + '...' : log.endpoint}
                  </td>
                  <td>
                    <span className={`gestion-auditoria__badge-status ${getStatusBadgeClass(log.status_response)}`}>
                      {log.status_response}
                    </span>
                  </td>
                  <td className="gestion-auditoria__params-cell">
                    {log.parametros_json ? (
                      <button
                        className="gestion-auditoria__btn-params"
                        onClick={() => setSelectedLogParams(log)}
                        title={log.parametros_json}
                      >
                        {log.parametros_json.substring(0, 50)}{log.parametros_json.length > 50 ? '...' : ''}
                      </button>
                    ) : (
                      <span className="gestion-auditoria__no-params">—</span>
                    )}
                  </td>
                  <td>{log.duracion_ms || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.showPagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.handleChangePage}
        />
      )}

      {/* Modal de Parámetros */}
      {selectedLogParams && (
        <div className="gestion-auditoria__modal-overlay" onClick={() => setSelectedLogParams(null)}>
          <div className="gestion-auditoria__modal" onClick={(e) => e.stopPropagation()}>
            <div className="gestion-auditoria__modal-header">
              <h3>Parámetros de la Solicitud</h3>
              <button className="gestion-auditoria__modal-close" onClick={() => setSelectedLogParams(null)}>✕</button>
            </div>
            <div className="gestion-auditoria__modal-body">
              <div className="gestion-auditoria__modal-info">
                <p><strong>Endpoint:</strong> {selectedLogParams.endpoint}</p>
                <p><strong>Método:</strong> {selectedLogParams.metodo}</p>
                <p><strong>Fecha:</strong> {new Date(selectedLogParams.fecha_hora).toLocaleString('es-AR')}</p>
              </div>
              <div className="gestion-auditoria__modal-params">
                <pre>{selectedLogParams.parametros_json ? JSON.stringify(JSON.parse(selectedLogParams.parametros_json), null, 2) : 'Sin parámetros'}</pre>
              </div>
            </div>
            <div className="gestion-auditoria__modal-footer">
              <button
                className="gestion-auditoria__modal-btn-copy"
                onClick={() => {
                  navigator.clipboard.writeText(selectedLogParams.parametros_json || '');
                  alert('Parámetros copiados al portapapeles');
                }}
              >
                📋 Copiar JSON
              </button>
              <button
                className="gestion-auditoria__modal-btn-close"
                onClick={() => setSelectedLogParams(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionAuditoria;
