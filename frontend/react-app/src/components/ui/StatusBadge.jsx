import React from 'react';
import { getSystemStatusBadge } from '../../utils/formatters.js';

const StatusBadge = ({ status, size = 'sm' }) => {
  const badge = getSystemStatusBadge(status);
  const sizeClass = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${badge.className}`}>
      {badge.label}
    </span>
  );
};

export default StatusBadge;
