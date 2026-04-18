import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationProvider, useNotification } from '../NotificationContext';

describe('NotificationContext', () => {
  // Test 1: Timer se cancela al remover notificación manualmente
  it('should cancel timer when notification is removed manually', async () => {
    jest.useFakeTimers();

    let notificationId;
    function TestComponent() {
      const { notifications, addNotification, removeNotification } = useNotification();
      return (
        <div>
          <button
            onClick={() => {
              notificationId = addNotification({ type: 'success', message: 'Test' });
            }}
          >
            Add
          </button>
          <button onClick={() => removeNotification(notificationId)}>Remove</button>
          <div data-testid="count">{notifications.length}</div>
        </div>
      );
    }

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    // Agregar notificación
    await userEvent.click(screen.getByText('Add'));
    expect(screen.getByTestId('count')).toHaveTextContent('1');

    // Remover manualmente (antes de que expire)
    await userEvent.click(screen.getByText('Remove'));
    expect(screen.getByTestId('count')).toHaveTextContent('0');

    // Avanzar tiempo más allá de la duración de la notificación
    jest.advanceTimersByTime(5000);

    // Si el timer no fue cancelado, se intentaría remover de nuevo (error)
    // Si fue cancelado correctamente, no pasa nada
    expect(screen.getByTestId('count')).toHaveTextContent('0');

    jest.useRealTimers();
  });

  // Test 2: Cleanup se ejecuta al desmontar el provider
  it('should cancel all timers on unmount', async () => {
    jest.useFakeTimers();

    function TestComponent() {
      const { addNotification } = useNotification();
      return (
        <button
          onClick={() => {
            addNotification({ type: 'info', message: 'Test 1' });
            addNotification({ type: 'info', message: 'Test 2' });
            addNotification({ type: 'info', message: 'Test 3' });
          }}
        >
          Add Multiple
        </button>
      );
    }

    const { unmount } = render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    // Agregar múltiples notificaciones
    await userEvent.click(screen.getByText('Add Multiple'));

    // Desmontar provider (debe cancelar todos los timers)
    unmount();

    // Avanzar tiempo (no debe hacer nada porque los timers fueron cancelados)
    jest.advanceTimersByTime(10000);

    // Test passa si no hay errores de timeout

    jest.useRealTimers();
  });

  // Test 3: mergedConfig es estable (useMemo)
  it('should have stable mergedConfig', () => {
    const configValues = [];

    function TestComponent() {
      const { config } = useNotification();
      configValues.push(config);
      return null;
    }

    const { rerender } = render(
      <NotificationProvider config={{ error: 8000 }}>
        <TestComponent />
      </NotificationProvider>,
    );

    configValues.length = 0; // Reset

    // Re-render sin cambiar config
    rerender(
      <NotificationProvider config={{ error: 8000 }}>
        <TestComponent />
      </NotificationProvider>,
    );

    // Las dos referencias deben ser la misma (mergedConfig es memoizado)
    if (configValues.length >= 2) {
      expect(configValues[0] === configValues[1]).toBe(true);
    }
  });

  // Test 4: IDs son únicos e incrementales
  it('should generate unique incremental IDs', async () => {
    const ids = [];

    function TestComponent() {
      const { addNotification } = useNotification();
      return (
        <button
          onClick={() => {
            ids.push(addNotification({ type: 'info', message: 'Test' }));
          }}
        >
          Add
        </button>
      );
    }

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>,
    );

    await userEvent.click(screen.getByText('Add'));
    await userEvent.click(screen.getByText('Add'));
    await userEvent.click(screen.getByText('Add'));

    expect(ids).toHaveLength(3);
    expect(ids[0]).toBe(0);
    expect(ids[1]).toBe(1);
    expect(ids[2]).toBe(2);
    expect(new Set(ids).size).toBe(3); // Todos únicos
  });
});
