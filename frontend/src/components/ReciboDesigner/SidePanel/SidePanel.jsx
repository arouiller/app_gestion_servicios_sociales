import React, { useState } from 'react';
import { CellStylePanel } from './CellStylePanel';
import { BorderStylePanel } from './BorderStylePanel';
import { PlaceholderPanel } from './PlaceholderPanel';
import { PageConfigPanel } from './PageConfigPanel';
import { SavePanel } from './SavePanel';

export const SidePanel = () => {
  const [activeTab, setActiveTab] = useState('celda');

  const tabs = [
    { id: 'celda', label: 'Celda' },
    { id: 'bordes', label: 'Bordes' },
    { id: 'placeholders', label: 'Placeholders' },
    { id: 'pagina', label: 'Página' },
    { id: 'guardar', label: 'Guardar' },
  ];

  return (
    <div style={{
      width: '280px',
      flexShrink: 0,
      borderLeft: '1px solid #e2e8f0',
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e2e8f0',
        overflowX: 'auto',
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              minWidth: '50px',
              padding: '8px 4px',
              fontSize: '11px',
              fontWeight: 500,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
              color: activeTab === tab.id ? '#2563eb' : '#64748b',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
      }}>
        {activeTab === 'celda' && <CellStylePanel />}
        {activeTab === 'bordes' && <BorderStylePanel />}
        {activeTab === 'placeholders' && <PlaceholderPanel />}
        {activeTab === 'pagina' && <PageConfigPanel />}
        {activeTab === 'guardar' && <SavePanel />}
      </div>
    </div>
  );
};
