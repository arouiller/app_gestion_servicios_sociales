import React from 'react';
import LookupCRUD from '../../../../components/LookupCRUD/LookupCRUD';

const ObrasSociales = () => {
  return (
    <LookupCRUD
      titulo="Obras Sociales"
      endpoint="/lookup/obras-sociales"
      campos={[
        { name: 'os_numero', label: 'Número', tipo: 'numero_pk' },
        { name: 'os_nombre', label: 'Nombre' },
      ]}
    />
  );
};

export default ObrasSociales;
