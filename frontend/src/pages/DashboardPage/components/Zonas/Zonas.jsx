import React from 'react';
import LookupCRUD from '../../../../components/LookupCRUD/LookupCRUD';

const Zonas = () => {
  return (
    <LookupCRUD
      titulo="Zonas"
      singularName="Zona"
      endpoint="/lookup/zonas"
      campos={[
        { name: 'id', label: 'ID', tipo: 'numero_pk', disabled: true },
        { name: 'codigo', label: 'Código', tipo: 'texto', maxLength: 2 },
        { name: 'nombre', label: 'Nombre', tipo: 'texto' },
      ]}
    />
  );
};

export default Zonas;
