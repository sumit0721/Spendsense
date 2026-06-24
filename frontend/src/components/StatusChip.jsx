import React from 'react';

export default function StatusChip({ status = 'cleared', className = '' }) {
  const configs = {
    cleared: {
      bg: 'bg-success/10 text-success border-success/20',
      label: 'Cleared',
    },
    pending: {
      bg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      label: 'Pending',
    },
    flagged: {
      bg: 'bg-error/10 text-error border-error/20',
      label: 'Flagged',
    },
  };

  const key = status.toLowerCase();
  const config = configs[key] || configs.cleared;

  return (
    <span
      className={`inline-flex items-center justify-center px-sm py-[2px] rounded text-[11px] font-semibold border uppercase tracking-wider ${config.bg} ${className}`}
    >
      {config.label}
    </span>
  );
}
