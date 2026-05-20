import React from 'react';
import PropTypes from 'prop-types';
import './ResumenDesglose.scss';

const ResumenDesglose = ({ cuotaSocial, arancelPorServicio, valorCuota }) => {
  const esNegativo = arancelPorServicio < 0;
  const montoCuotaSocial = parseFloat(cuotaSocial || 0).toFixed(2);
  const montoArancel = parseFloat(arancelPorServicio || 0).toFixed(2);
  const montoTotal = parseFloat(valorCuota || 0).toFixed(2);

  return (
    <div className="recibo-desglose">
      <h4>Desglose de Cuota</h4>

      <table className="desglose-table">
        <tbody>
          <tr>
            <td className="desglose-label">Cuota Social</td>
            <td className="desglose-value">${montoCuotaSocial}</td>
          </tr>
          <tr className={esNegativo ? 'negativo' : ''}>
            <td className="desglose-label">Arancel por Servicio</td>
            <td className="desglose-value">
              ${montoArancel}
              {esNegativo && <span className="warning-icon">⚠️</span>}
            </td>
          </tr>
          <tr className="desglose-total">
            <td className="desglose-label"><strong>Valor Total Cuota</strong></td>
            <td className="desglose-value"><strong>${montoTotal}</strong></td>
          </tr>
        </tbody>
      </table>

      {esNegativo && (
        <div className="desglose-warning">
          ⚠️ Arancel negativo detectado. Revisar con administrador.
        </div>
      )}
    </div>
  );
};

ResumenDesglose.propTypes = {
  cuotaSocial: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  arancelPorServicio: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  valorCuota: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

ResumenDesglose.defaultProps = {
  cuotaSocial: 0,
  arancelPorServicio: 0,
  valorCuota: 0,
};

export default ResumenDesglose;
