import React, { useState, useEffect } from 'react';
import provinciaService from '../../../../services/provinciaService';
import localidadService from '../../../../services/localidadService';
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
    if (window.confirm('¿Eliminar esta provincia?')) {
      try {
        await provinciaService.delete(id);
        loadProvincias();
      } catch (error) {
        console.error('Error deleting provincia:', error);
      }
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
    if (window.confirm('¿Eliminar esta localidad?')) {
      try {
        await localidadService.delete(id);
        loadProvincias();
      } catch (error) {
        console.error('Error deleting localidad:', error);
      }
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
    </div>
  );
};

export default GestionProvinciasZonas;
