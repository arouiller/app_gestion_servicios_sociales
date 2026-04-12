import React from 'react';
import LookupCRUD from '../../../../components/LookupCRUD/LookupCRUD';

const TiposDePlan = () => {
  return (
    <LookupCRUD
      titulo="Tipos de Plan"
      endpoint="/lookup/tipos-de-plan"
      campos={[
        { name: 'tipo_plan_numero', label: 'Número', tipo: 'numero_pk' },
        { name: 'tipo_plan_nombre', label: 'Nombre' },
      ]}
    />
  );
};

export default TiposDePlan;
