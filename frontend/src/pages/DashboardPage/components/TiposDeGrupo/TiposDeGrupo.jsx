import React from 'react';
import LookupCRUD from '../../../../components/LookupCRUD/LookupCRUD';

const TiposDeGrupo = () => {
  return (
    <LookupCRUD
      titulo="Tipos de Grupo"
      singularName="Tipo de Grupo"
      endpoint="/lookup/tipos-de-grupo"
      campos={[
        { name: 'tipo_de_grupo_numero', label: 'Número', tipo: 'numero_pk' },
        { name: 'tipo_de_grupo_nombre', label: 'Nombre' },
      ]}
    />
  );
};

export default TiposDeGrupo;
