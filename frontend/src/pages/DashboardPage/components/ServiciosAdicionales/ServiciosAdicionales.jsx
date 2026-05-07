import React from 'react';
import LookupCRUD from '../../../../components/LookupCRUD/LookupCRUD';

const ServiciosAdicionales = () => {
  return (
    <LookupCRUD
      titulo="Servicios Adicionales"
      singularName="Servicio Adicional"
      endpoint="/lookup/servicios-adicionales"
      tableKey="serviciosAdicionales"
      campos={[
        { name: 'servicio_adicional_numero', label: 'Número', tipo: 'numero_pk' },
        { name: 'servicio_adicional_nombre', label: 'Nombre' },
      ]}
    />
  );
};

export default ServiciosAdicionales;
