import React from 'react';
import { StructureControls } from './StructureControls';
import { PlaceholderSelector } from './PlaceholderSelector';
import { InlineEditor } from './InlineEditor';
import { PageControls } from './PageControls';
import { SaveActions } from './SaveActions';

export const ReciboDesignerToolbar = () => {
  return (
    <div className="recibo-designer__toolbar">
      <h2 style={{ fontSize: '14px', marginBottom: '15px', color: '#333' }}>
        Herramientas
      </h2>
      <StructureControls />
      <PlaceholderSelector />
      <PageControls />
      <SaveActions />
      <InlineEditor />
    </div>
  );
};
