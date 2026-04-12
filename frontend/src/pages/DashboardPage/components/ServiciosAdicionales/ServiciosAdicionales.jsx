import React from 'react';
import LookupCRUD from '../../../../components/LookupCRUD/LookupCRUD';

const ServiciosAdicionales = () => {
  return (
    <LookupCRUD
      titulo="Servicios Adicionales"
      endpoint="/lookup/servicios-adicionales"
      campos={[
        { name: 'servicio_adicional_numero', label: 'Número', tipo: 'numero_pk' },
        { name: 'servicio_adicional_nombre', label: 'Nombre' },
      ]}
    />
  );
};

export default ServiciosAdicionales;
