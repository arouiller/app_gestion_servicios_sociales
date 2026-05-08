import React from 'react';
import LookupCRUD from '../../../../components/LookupCRUD/LookupCRUD';

const Zonas = () => {
  return (
    <LookupCRUD
      titulo="Zonas"
      singularName="Zona"
      endpoint="/lookup/zonas"
      tableKey="zonas"
      requireConfirmationOnDelete={true}
      campos={[
        { name: 'id', label: 'ID', tipo: 'numero_pk', hidden: true },
        { name: 'codigo', label: 'Código', maxLength: 2 },
        { name: 'nombre', label: 'Nombre' },
      ]}
    />
  );
};

export default Zonas;
