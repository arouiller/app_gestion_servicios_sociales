import React from 'react';
import LookupCRUD from '../../../../components/LookupCRUD/LookupCRUD';

const TiposDePlan = () => {
  return (
    <LookupCRUD
      titulo="Tipos de Plan"
      singularName="Tipo de Plan"
      endpoint="/lookup/tipos-de-plan"
      tableKey="tiposDePlan"
      campos={[
        { name: 'tipo_plan_numero', label: 'Número', tipo: 'numero_pk' },
        { name: 'tipo_plan_nombre', label: 'Nombre' },
        { name: 'abreviacion', label: 'Abreviación *', maxLength: 10 },
      ]}
    />
  );
};

export default TiposDePlan;
