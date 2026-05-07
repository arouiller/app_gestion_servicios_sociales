import React from 'react';
import LookupCRUD from '../../../../components/LookupCRUD/LookupCRUD';

const ObrasSociales = () => {
  return (
    <LookupCRUD
      titulo="Obras Sociales"
      singularName="Obra Social"
      endpoint="/lookup/obras-sociales"
      tableKey="obrasSociales"
      campos={[
        { name: 'os_numero', label: 'Número', tipo: 'numero_pk' },
        { name: 'os_nombre', label: 'Nombre' },
      ]}
    />
  );
};

export default ObrasSociales;
