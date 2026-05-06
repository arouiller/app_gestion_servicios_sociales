import React from 'react';
import '../ListadosPage.scss';

function ListadoZona({ listado, loading, onPageChange, currentPage }) {
  if (!listado) return null;

  const { data: planes, pagination } = listado;

  if (loading) {
    return <div className="listado-zona__loading">Cargando...</div>;
  }

  if (!planes || planes.length === 0) {
    return <div className="listado-zona__empty">Sin planes en esta zona</div>;
  }

  return (
    <div className="listado-zona">
      <div className="listado-zona__table-container">
        <table className="listado-zona__table">
          <thead>
            <tr>
              <th>Plan #</th>
              <th>Tipo</th>
              <th>Cuota (ARS)</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Fecha Nac.</th>
              <th>Edad</th>
              <th>DNI</th>
            </tr>
          </thead>
          <tbody>
            {planes.map((plan) => (
              <React.Fragment key={plan.plan_numero}>
                {plan.PlanIntegrantes && plan.PlanIntegrantes.length > 0 ? (
                  plan.PlanIntegrantes.map((integrante, idx) => (
                    <tr key={`${plan.plan_numero}-${integrante.id}`}>
                      {idx === 0 && (
                        <>
                          <td rowSpan={plan.PlanIntegrantes.length}>
                            {plan.plan_numero}
                          </td>
                          <td rowSpan={plan.PlanIntegrantes.length}>
                            {plan.TipoDePlan?.tipo_plan_nombre}
                          </td>
                          <td rowSpan={plan.PlanIntegrantes.length}>
                            ${plan.valor_cuota}
                          </td>
                        </>
                      )}
                      <td>{integrante.Persona?.nombre || '-'}</td>
                      <td>{integrante.Persona?.apellido || '-'}</td>
                      <td>
                        {integrante.Persona?.fecha_nacimiento
                          ? new Date(
                              integrante.Persona.fecha_nacimiento
                            ).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>
                        {integrante.Persona?.fecha_nacimiento
                          ? Math.floor(
                              (new Date() -
                                new Date(
                                  integrante.Persona.fecha_nacimiento
                                )) /
                                (365.25 * 24 * 60 * 60 * 1000)
                            )
                          : '-'}
                      </td>
                      <td>{integrante.Persona?.numero_documento || '-'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td>{plan.plan_numero}</td>
                    <td>{plan.TipoDePlan?.tipo_plan_nombre}</td>
                    <td>${plan.valor_cuota}</td>
                    <td colSpan="5">Sin afiliados</td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="listado-zona__pagination">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Anterior
          </button>
          <span>
            Página {currentPage} de {pagination.pages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === pagination.pages}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

export default ListadoZona;
