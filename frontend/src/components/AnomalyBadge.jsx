import { AlertCircle } from 'lucide-react';

export default function AnomalyBadge({ label = 'Anomaly Detected', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-[4px] bg-accent/10 border border-accent/20 text-accent text-[11px] font-semibold px-sm py-[3px] rounded-full uppercase tracking-wider animate-pulse ${className}`}
    >
      <AlertCircle className="w-[12px] h-[12px]" />
      {label}
    </span>
  );
}
