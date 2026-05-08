import React, { useState, useEffect } from 'react';
import provinciaService from '../../../../services/provinciaService';
import localidadService from '../../../../services/localidadService';
import ConfirmDeleteWithRefsModal from '../../../../components/ConfirmDeleteWithRefsModal/ConfirmDeleteWithRefsModal';
import ProvinciaRow from './ProvinciaRow';
import ProvinciaFormModal from './ProvinciaFormModal';
import LocalidadFormModal from './LocalidadFormModal';
import './GestionProvinciasZonas.scss';

const GestionProvinciasZonas = () => {
  const [provincias, setProvincias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProvincias, setExpandedProvincias] = useState({});

  // Provincia modal state
  const [provinciaModalOpen, setProvinciaModalOpen] = useState(false);
  const [selectedProvincia, setSelectedProvincia] = useState(null);

  // Localidad modal state
  const [localidadModalOpen, setLocalidadModalOpen] = useState(false);
  const [selectedLocalidad, setSelectedLocalidad] = useState(null);
  const [provinciaForLocalidad, setProvinciaForLocalidad] = useState(null);

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    entidad: null,
    registroId: null,
    registroNombre: null,
    referencias: 0,
    referenciaEn: '',
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    loadProvincias();
  }, []);

  const loadProvincias = async () => {
    try {
      setLoading(true);
      const result = await provinciaService.getAll();
      setProvincias(result.data || []);
    } catch (error) {
      console.error('Error loading provincias:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (provinciaId) => {
    setExpandedProvincias(prev => ({
      ...prev,
      [provinciaId]: !prev[provinciaId]
    }));
  };

  const handleNewProvincia = () => {
    setSelectedProvincia(null);
    setProvinciaModalOpen(true);
  };

  const handleEditProvincia = (provincia) => {
    setSelectedProvincia(provincia);
    setProvinciaModalOpen(true);
  };

  const handleDeleteProvincia = async (id) => {
    try {
      const provincia = provincias.find(p => p.id === id);
      if (!provincia) return;

      // Obtener referencias
      const refData = await provinciaService.getReferencias(id);

      setDeleteModal({
        isOpen: true,
        entidad: 'provincias',
        registroId: id,
        registroNombre: provincia.nombre,
        referencias: refData.referencias || 0,
        referenciaEn: refData.referenciaEn || '',
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching provincia referencias:', error);
      alert('Error al obtener información: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSaveProvincia = async (data) => {
    try {
      if (selectedProvincia) {
        await provinciaService.update(selectedProvincia.id, data);
      } else {
        await provinciaService.create(data);
      }
      loadProvincias();
      setProvinciaModalOpen(false);
    } catch (error) {
      console.error('Error saving provincia:', error);
    }
  };

  const handleNewLocalidad = (provincia) => {
    setProvinciaForLocalidad(provincia);
    setSelectedLocalidad(null);
    setLocalidadModalOpen(true);
  };

  const handleEditLocalidad = (localidad, provincia) => {
    setProvinciaForLocalidad(provincia);
    setSelectedLocalidad(localidad);
    setLocalidadModalOpen(true);
  };

  const handleDeleteLocalidad = async (id) => {
    try {
      // Buscar localidad en el árbol de provincias
      let localidad = null;
      for (let provincia of provincias) {
        const found = provincia.localidades?.find(l => l.id === id);
        if (found) {
          localidad = found;
          break;
        }
      }
      if (!localidad) return;

      // Obtener referencias
      const refData = await localidadService.getReferencias(id);

      setDeleteModal({
        isOpen: true,
        entidad: 'localidades',
        registroId: id,
        registroNombre: localidad.nombre,
        referencias: refData.referencias || 0,
        referenciaEn: refData.referenciaEn || '',
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching localidad referencias:', error);
      alert('Error al obtener información: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSaveLocalidad = async (data) => {
    try {
      if (selectedLocalidad) {
        await localidadService.update(selectedLocalidad.id, data);
      } else {
        await localidadService.create({
          ...data,
          provincia_id: provinciaForLocalidad.id
        });
      }
      loadProvincias();
      setLocalidadModalOpen(false);
    } catch (error) {
      console.error('Error saving localidad:', error);
    }
  };

  const handleConfirmDelete = async () => {
    const { entidad, registroId } = deleteModal;

    setDeleteModal(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (entidad === 'provincias') {
        await provinciaService.delete(registroId, { force: true });
      } else if (entidad === 'localidades') {
        await localidadService.delete(registroId, { force: true });
      }

      await loadProvincias();
      setDeleteModal(prev => ({ ...prev, isOpen: false }));
    } catch (err) {
      setDeleteModal(prev => ({
        ...prev,
        error: err.response?.data?.error || err.response?.data?.message || 'Error al eliminar',
        isLoading: false,
      }));
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal(prev => ({
      ...prev,
      isOpen: false,
      registroId: null,
      error: null,
      isLoading: false,
    }));
  };

  if (loading) {
    return <div className="loading">Cargando provincias...</div>;
  }

  return (
    <div className="gestion-provincias-zonas">
      <div className="filter-bar">
        <h2>Provincias y Localidades</h2>
        <button className="btn-primary" onClick={handleNewProvincia}>
          + Nueva Provincia
        </button>
      </div>

      <div className="provincias-list">
        {provincias.length === 0 ? (
          <div className="empty-state">No hay provincias registradas</div>
        ) : (
          provincias.map(provincia => (
            <ProvinciaRow
              key={provincia.id}
              provincia={provincia}
              expanded={expandedProvincias[provincia.id]}
              onToggleExpand={() => toggleExpand(provincia.id)}
              onEdit={() => handleEditProvincia(provincia)}
              onDelete={() => handleDeleteProvincia(provincia.id)}
              onNewLocalidad={() => handleNewLocalidad(provincia)}
              onEditLocalidad={(localidad) => handleEditLocalidad(localidad, provincia)}
              onDeleteLocalidad={handleDeleteLocalidad}
            />
          ))
        )}
      </div>

      {provinciaModalOpen && (
        <ProvinciaFormModal
          provincia={selectedProvincia}
          onSave={handleSaveProvincia}
          onClose={() => setProvinciaModalOpen(false)}
        />
      )}

      {localidadModalOpen && provinciaForLocalidad && (
        <LocalidadFormModal
          localidad={selectedLocalidad}
          provincia={provinciaForLocalidad}
          onSave={handleSaveLocalidad}
          onClose={() => setLocalidadModalOpen(false)}
        />
      )}

      <ConfirmDeleteWithRefsModal
        isOpen={deleteModal.isOpen}
        entidad={deleteModal.entidad}
        registroNombre={deleteModal.registroNombre}
        referencias={deleteModal.referencias}
        referenciaEn={deleteModal.referenciaEn}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isLoading={deleteModal.isLoading}
        error={deleteModal.error}
      />
    </div>
  );
};

export default GestionProvinciasZonas;
