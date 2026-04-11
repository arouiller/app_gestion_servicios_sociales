import React, { useCallback, useEffect, useState } from 'react';
import afiliadosService from '../../../../services/afiliadosService';
import GrupoDetalleModal from '../GrupoDetalleModal/GrupoDetalleModal';
import './GestionGruposFamiliares.scss';

// ── Componente principal ──────────────────────────────────────────────────────

function GestionGruposFamiliares() {
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [grupoDetalleId, setGrupoDetalleId] = useState(null);
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await afiliadosService.listarGrupos();
      setGrupos(data);
    } catch {
      setError('Error al cargar los grupos familiares.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const gruposFiltrados = grupos.filter((g) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      g.nombre.toLowerCase().includes(q) ||
      (g.titular && `${g.titular.nombre} ${g.titular.apellido}`.toLowerCase().includes(q))
    );
  });

  return (
    <div className="grupos-fam">
      <div className="grupos-fam__header">
        <h2 className="grupos-fam__title">Grupos Familiares</h2>
      </div>

      {error && <div className="grupos-fam__alert grupos-fam__alert--error">{error}</div>}

      <div className="grupos-fam__filtros">
        <input
          className="grupos-fam__filtro-input"
          placeholder="Buscar por nombre del grupo o titular..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grupos-fam__loading">Cargando grupos familiares...</div>
      ) : gruposFiltrados.length === 0 ? (
        <p className="grupos-fam__empty">No se encontraron grupos familiares.</p>
      ) : (
        <div className="grupos-fam__tabla-wrapper">
          <table className="grupos-fam__tabla">
            <thead>
              <tr>
                <th>Nombre del grupo</th>
                <th>Titular</th>
                <th>Miembros</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gruposFiltrados.map((g) => (
                <tr key={g.id}>
                  <td className="grupos-fam__nombre-cell">{g.nombre}</td>
                  <td>
                    {g.titular
                      ? `${g.titular.nombre} ${g.titular.apellido}`
                      : <span className="grupos-fam__sin-titular">Sin titular</span>}
                  </td>
                  <td className="grupos-fam__cantidad">{g.total_miembros}</td>
                  <td>
                    <span className={`grupos-fam__estado grupos-fam__estado--${g.estado}`}>
                      {g.estado}
                    </span>
                  </td>
                  <td>
                    <button
                      className="grupos-fam__btn-icon grupos-fam__btn-icon--view"
                      onClick={() => setGrupoDetalleId(g.id)}
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grupos-fam__total">
        {!loading && `${gruposFiltrados.length} grupo${gruposFiltrados.length !== 1 ? 's' : ''}`}
      </div>

      {grupoDetalleId && (
        <GrupoDetalleModal
          grupoId={grupoDetalleId}
          onClose={() => setGrupoDetalleId(null)}
          onRefresh={cargar}
        />
      )}
    </div>
  );
}

export default GestionGruposFamiliares;
