import React, { useState, useEffect } from 'react';
import provinciaService from '../../../../services/provinciaService';
import ProvinciaFormModal from './ProvinciaFormModal';
import ZonaFormModal from './ZonaFormModal';
import ProvinciaRow from './ProvinciaRow';
import './GestionProvinciasZonas.scss';

const GestionProvinciasZonas = () => {
  const [provincias, setProvincias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [provinciaModalOpen, setProvinciaModalOpen] = useState(false);
  const [zonaModalOpen, setZonaModalOpen] = useState(false);
  const [editingProvincia, setEditingProvincia] = useState(null);
  const [selectedProvincia, setSelectedProvincia] = useState(null);
  const [editingZona, setEditingZona] = useState(null);
  const [expandedProvincias, setExpandedProvincias] = useState({});

  useEffect(() => {
    loadProvincias();
  }, []);

  const loadProvincias = async () => {
    try {
      setLoading(true);
      const data = await provinciaService.getAll();
      setProvincias(data);
    } catch (error) {
      console.error('Error loading provincias:', error);
      alert('Error al cargar provincias');
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
    setEditingProvincia(null);
    setProvinciaModalOpen(true);
  };

  const handleEditProvincia = (provincia) => {
    setEditingProvincia(provincia);
    setProvinciaModalOpen(true);
  };

  const handleProvinciaModalClose = () => {
    setProvinciaModalOpen(false);
    setEditingProvincia(null);
  };

  const handleProvinciaModalSave = async (provinciaData) => {
    try {
      if (editingProvincia) {
        await provinciaService.update(editingProvincia.id, provinciaData);
        alert('Provincia actualizada exitosamente');
      } else {
        await provinciaService.create(provinciaData);
        alert('Provincia creada exitosamente');
      }
      loadProvincias();
      handleProvinciaModalClose();
    } catch (error) {
      console.error('Error saving provincia:', error);
      alert(error.response?.data?.message || 'Error al guardar provincia');
    }
  };

  const handleDeleteProvincia = async (provincia) => {
    if (window.confirm(`¿Eliminar provincia "${provincia.nombre}"?`)) {
      try {
        await provinciaService.delete(provincia.id);
        alert('Provincia eliminada exitosamente');
        loadProvincias();
      } catch (error) {
        console.error('Error deleting provincia:', error);
        alert(error.response?.data?.message || 'Error al eliminar provincia');
      }
    }
  };

  const handleNewZona = (provincia) => {
    setSelectedProvincia(provincia);
    setEditingZona(null);
    setZonaModalOpen(true);
  };

  const handleEditZona = (zona, provincia) => {
    setSelectedProvincia(provincia);
    setEditingZona(zona);
    setZonaModalOpen(true);
  };

  const handleZonaModalClose = () => {
    setZonaModalOpen(false);
    setEditingZona(null);
    setSelectedProvincia(null);
  };

  const handleZonaModalSave = async (zonaData) => {
    try {
      if (editingZona) {
        await provinciaService.update(editingZona.id, zonaData);
        alert('Zona actualizada exitosamente');
      } else {
        // Para crear zona, necesitamos llamar a zonaService, pero aquí usaremos relación
        const zonaWithProvincia = {
          ...zonaData,
          provincia_id: selectedProvincia.id
        };
        // Crear zona en backend
        const response = await fetch('/api/zonas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(zonaWithProvincia)
        });
        if (!response.ok) throw new Error('Error creating zona');
        alert('Zona creada exitosamente');
      }
      loadProvincias();
      handleZonaModalClose();
    } catch (error) {
      console.error('Error saving zona:', error);
      alert(error.message || 'Error al guardar zona');
    }
  };

  const handleDeleteZona = async (zona) => {
    if (window.confirm(`¿Eliminar zona "${zona.nombre}"?`)) {
      try {
        const response = await fetch(`/api/zonas/${zona.id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Error deleting zona');
        alert('Zona eliminada exitosamente');
        loadProvincias();
      } catch (error) {
        console.error('Error deleting zona:', error);
        alert(error.message || 'Error al eliminar zona');
      }
    }
  };

  if (loading) return <div className="loading">Cargando provincias...</div>;

  return (
    <div className="gestion-provincias-zonas">
      <div className="filter-bar">
        <h2>Gestión de Provincias y Zonas</h2>
        <button className="btn btn-primary" onClick={handleNewProvincia}>
          + Nueva Provincia
        </button>
      </div>

      <div className="provincias-list">
        {provincias.length === 0 ? (
          <p className="empty-state">No hay provincias registradas</p>
        ) : (
          provincias.map(provincia => (
            <ProvinciaRow
              key={provincia.id}
              provincia={provincia}
              isExpanded={expandedProvincias[provincia.id] || false}
              onToggleExpand={() => toggleExpand(provincia.id)}
              onEdit={() => handleEditProvincia(provincia)}
              onDelete={() => handleDeleteProvincia(provincia)}
              onAddZona={() => handleNewZona(provincia)}
              onEditZona={(zona) => handleEditZona(zona, provincia)}
              onDeleteZona={handleDeleteZona}
            />
          ))
        )}
      </div>

      {provinciaModalOpen && (
        <ProvinciaFormModal
          provincia={editingProvincia}
          onClose={handleProvinciaModalClose}
          onSave={handleProvinciaModalSave}
        />
      )}

      {zonaModalOpen && selectedProvincia && (
        <ZonaFormModal
          zona={editingZona}
          provincia={selectedProvincia}
          onClose={handleZonaModalClose}
          onSave={handleZonaModalSave}
        />
      )}
    </div>
  );
};

export default GestionProvinciasZonas;
