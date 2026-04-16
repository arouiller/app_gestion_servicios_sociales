import React, { useState, useEffect } from 'react';
import './GestionUsuarios.scss';
import usuariosService from '../../../../services/usuariosService';
import UsuarioFormModal from './modals/UsuarioFormModal';

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const data = await usuariosService.list();
      setUsuarios(data);
    } catch (error) {
      console.error('Error loading usuarios:', error);
      alert('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearUsuario = () => {
    setEditingUsuario(null);
    setShowFormModal(true);
  };

  const handleFormSubmit = async (email) => {
    try {
      await usuariosService.crear(email);
      setShowFormModal(false);
      loadUsuarios();
    } catch (error) {
      console.error('Error creating usuario:', error);
      alert('Error al crear usuario: ' + error.response?.data?.message || error.message);
    }
  };

  const handleCambiarRol = async (id, nuevoRol) => {
    if (!window.confirm(`¿Cambiar rol a "${nuevoRol}"?`)) return;

    try {
      await usuariosService.cambiarRol(id, nuevoRol);
      loadUsuarios();
    } catch (error) {
      console.error('Error changing rol:', error);
      alert('Error al cambiar rol: ' + error.response?.data?.message || error.message);
    }
  };

  const handleBlanquearPassword = async (id) => {
    if (!window.confirm('¿Blanquear contraseña de este usuario?')) return;

    try {
      await usuariosService.blanquearPassword(id);
      loadUsuarios();
    } catch (error) {
      console.error('Error blanquear password:', error);
      alert('Error al blanquear contraseña: ' + error.response?.data?.message || error.message);
    }
  };

  return (
    <div className="gestion-usuarios">
      <div className="gestion-usuarios__header">
        <h2>Gestión de Usuarios</h2>
        <button
          className="gestion-usuarios__btn-nuevo"
          onClick={handleCrearUsuario}
        >
          ➕ Nuevo Usuario
        </button>
      </div>

      {loading && <p className="gestion-usuarios__loading">Cargando usuarios...</p>}

      {!loading && usuarios.length === 0 && (
        <p className="gestion-usuarios__empty">No hay usuarios registrados</p>
      )}

      {!loading && usuarios.length > 0 && (
        <div className="gestion-usuarios__table-wrapper">
          <table className="gestion-usuarios__table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>{usuario.email}</td>
                  <td>{usuario.nombre || '—'}</td>
                  <td>{usuario.apellido || '—'}</td>
                  <td>{usuario.rol}</td>
                  <td>
                    {usuario.password_blanqueada ? (
                      <span className="gestion-usuarios__badge-warning">
                        Requiere cambio
                      </span>
                    ) : (
                      <span className="gestion-usuarios__badge-success">
                        Activo
                      </span>
                    )}
                  </td>
                  <td className="gestion-usuarios__actions">
                    {usuario.rol === 'usuario' ? (
                      <button
                        className="gestion-usuarios__btn-action"
                        title="Cambiar a admin"
                        onClick={() => handleCambiarRol(usuario.id, 'admin')}
                      >
                        👑
                      </button>
                    ) : (
                      <button
                        className="gestion-usuarios__btn-action"
                        title="Cambiar a usuario"
                        onClick={() => handleCambiarRol(usuario.id, 'usuario')}
                      >
                        👤
                      </button>
                    )}
                    <button
                      className="gestion-usuarios__btn-action"
                      title="Blanquear contraseña"
                      onClick={() => handleBlanquearPassword(usuario.id)}
                    >
                      🔑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showFormModal && (
        <UsuarioFormModal
          onSubmit={handleFormSubmit}
          onClose={() => setShowFormModal(false)}
        />
      )}
    </div>
  );
}
