import React from 'react';

class GestionPlanesV1ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('GestionPlanesV1 Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: '#d32f2f' }}>Error en Gestión de Planes</h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            Ocurrió un error al cargar el módulo:
          </p>
          <pre
            style={{
              background: '#f5f5f5',
              padding: '1rem',
              borderRadius: '4px',
              textAlign: 'left',
              overflow: 'auto',
              maxHeight: '300px',
            }}
          >
            {this.state.error?.toString()}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              marginTop: '1rem',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Recargar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GestionPlanesV1ErrorBoundary;
