import React, { useState, useEffect } from 'react';
import provinciaService from '../../../../services/provinciaService';
import zonaService from '../../../../services/zonaService';
import ProvinciaRow from './ProvinciaRow';
import ProvinciaFormModal from './ProvinciaFormModal';
import ZonaFormModal from './ZonaFormModal';
import './GestionProvinciasZonas.scss';

const GestionProvinciasZonas = () => {
  const [provincias, setProvincias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedProvincias, setExpandedProvincias] = useState({});

  // Provincia modal state
  const [provinciaModalOpen, setProvinciaModalOpen] = useState(false);
  const [selectedProvincia, setSelectedProvincia] = useState(null);

  // Zona modal state
  const [zonaModalOpen, setZonaModalOpen] = useState(false);
  const [selectedZona, setSelectedZona] = useState(null);
  const [provinciaForZona, setProvinciaForZona] = useState(null);

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

  const handleNewZona = (provincia) => {
    setProvinciaForZona(provincia);
    setSelectedZona(null);
    setZonaModalOpen(true);
  };

  const handleEditZona = (zona, provincia) => {
    setProvinciaForZona(provincia);
    setSelectedZona(zona);
    setZonaModalOpen(true);
  };

  const handleDeleteZona = async (id) => {
    if (window.confirm('¿Eliminar esta zona?')) {
      try {
        await zonaService.delete(id);
        loadProvincias();
      } catch (error) {
        console.error('Error deleting zona:', error);
      }
    }
  };

  const handleSaveZona = async (data) => {
    try {
      if (selectedZona) {
        await zonaService.update(selectedZona.id, data);
      } else {
        await zonaService.create({
          ...data,
          provincia_id: provinciaForZona.id
        });
      }
      loadProvincias();
      setZonaModalOpen(false);
    } catch (error) {
      console.error('Error saving zona:', error);
    }
  };

  if (loading) {
    return <div className="loading">Cargando provincias...</div>;
  }

  return (
    <div className="gestion-provincias-zonas">
      <div className="filter-bar">
        <h2>Provincias y Zonas</h2>
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
              onNewZona={() => handleNewZona(provincia)}
              onEditZona={(zona) => handleEditZona(zona, provincia)}
              onDeleteZona={handleDeleteZona}
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

      {zonaModalOpen && provinciaForZona && (
        <ZonaFormModal
          zona={selectedZona}
          provincia={provinciaForZona}
          onSave={handleSaveZona}
          onClose={() => setZonaModalOpen(false)}
        />
      )}
    </div>
  );
};

export default GestionProvinciasZonas;
