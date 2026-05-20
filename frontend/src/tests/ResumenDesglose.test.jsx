import { render, screen } from '@testing-library/react';
import ResumenDesglose from '../pages/DashboardPage/components/GestionPlanesV1/modals/ResumenDesglose';

describe('ResumenDesglose Component', () => {
  test('renderiza tabla de desglose con valores normales', () => {
    render(
      <ResumenDesglose
        cuotaSocial={50}
        arancelPorServicio={100}
        valorCuota={150}
      />
    );

    expect(screen.getByText('Desglose de Cuota')).toBeInTheDocument();
    expect(screen.getByText('Cuota Social')).toBeInTheDocument();
    expect(screen.getByText('Arancel por Servicio')).toBeInTheDocument();
    expect(screen.getByText('Valor Total Cuota')).toBeInTheDocument();

    // Check values are formatted with $
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });

  test('muestra advertencia cuando arancel es negativo', () => {
    render(
      <ResumenDesglose
        cuotaSocial={200}
        arancelPorServicio={-50}
        valorCuota={150}
      />
    );

    // Check warning appears
    expect(screen.getByText(/Arancel negativo detectado/i)).toBeInTheDocument();

    // Check warning icon appears
    const warningIcon = screen.queryAllByText('⚠️');
    expect(warningIcon.length).toBeGreaterThan(0);

    // Check row has negativo class by checking styles
    const arancelRow = screen.getByText('Arancel por Servicio').closest('tr');
    expect(arancelRow).toHaveClass('negativo');
  });

  test('usa 0 como default cuando props no proporcionados', () => {
    render(<ResumenDesglose />);

    // Should render default 0 values
    const zeroText = screen.getAllByText('$0.00');
    expect(zeroText.length).toBeGreaterThanOrEqual(1);

    // Should not show warning when values are 0
    expect(screen.queryByText(/negativo/i)).not.toBeInTheDocument();
  });

  test('formatea valores numéricos correctamente', () => {
    render(
      <ResumenDesglose
        cuotaSocial="75.5"
        arancelPorServicio="124.50"
        valorCuota="200.0"
      />
    );

    // Check formatting with 2 decimal places
    expect(screen.getByText('$75.50')).toBeInTheDocument();
    expect(screen.getByText('$124.50')).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toBeInTheDocument();
  });

  test('renderiza tabla con estructura correcta', () => {
    const { container } = render(
      <ResumenDesglose
        cuotaSocial={50}
        arancelPorServicio={100}
        valorCuota={150}
      />
    );

    const table = container.querySelector('.desglose-table');
    expect(table).toBeInTheDocument();

    const rows = container.querySelectorAll('.desglose-table tr');
    expect(rows).toHaveLength(3); // 3 rows: cuota social, arancel, total

    const totalRow = container.querySelector('.desglose-total');
    expect(totalRow).toBeInTheDocument();
  });

  test('muestra múltiples iconos de advertencia cuando arancel es negativo', () => {
    render(
      <ResumenDesglose
        cuotaSocial={200}
        arancelPorServicio={-50}
        valorCuota={150}
      />
    );

    // Warning in arancel row and warning box
    const warnings = screen.getAllByText('⚠️');
    expect(warnings.length).toBeGreaterThanOrEqual(2);
  });
});
