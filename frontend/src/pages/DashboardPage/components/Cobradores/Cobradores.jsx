import React from 'react';
import LookupCRUD from '../../../../components/LookupCRUD/LookupCRUD';

const Cobradores = () => {
  return (
    <LookupCRUD
      titulo="Cobradores"
      endpoint="/lookup/cobradores"
      campos={[
        { name: 'cobrador_numero', label: 'Número', tipo: 'numero_pk' },
        { name: 'cobrador_apellido', label: 'Apellido' },
        { name: 'cobrador_nombre', label: 'Nombre' },
      ]}
    />
  );
};

export default Cobradores;
