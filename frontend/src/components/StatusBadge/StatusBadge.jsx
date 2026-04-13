import React from 'react';
import './StatusBadge.scss';

function StatusBadge({ status, label = null }) {
  const statusLabel = label || status;
  const statusClass = `status-badge status-badge--${status.toLowerCase()}`;

  return (
    <span className={statusClass}>
      {statusLabel}
    </span>
  );
}

export default StatusBadge;
