import { AlertTriangle, Sparkles, X } from 'lucide-react';
import Button from './Button';

export default function InsightCard({
  type = 'anomaly', // 'anomaly' or 'ai'
  title,
  badge,
  message,
  actionLabel,
  onAction,
  onClose,
  className = '',
}) {
  const styles = {
    anomaly: {
      bg: 'bg-error/[0.04]',
      border: 'border-error/20',
      text: 'text-error',
      icon: AlertTriangle,
      iconBg: 'bg-error/10 text-error',
    },
    ai: {
      bg: 'bg-primary/[0.02]',
      border: 'border-primary/15',
      text: 'text-primary',
      icon: Sparkles,
      iconBg: 'bg-primary/5 text-primary',
    },
  };

  const config = styles[type] || styles.anomaly;
  const IconComponent = config.icon;

  return (
    <div
      className={`flex gap-md p-md rounded-lg border ${config.bg} ${config.border} animate-slide-in relative ${className}`}
    >
      <div className={`p-xs rounded-lg shrink-0 h-fit ${config.iconBg}`}>
        <IconComponent className="w-[18px] h-[18px]" />
      </div>
      <div className="flex-1 pr-lg flex flex-col gap-xs">
        <div className="flex items-center gap-sm flex-wrap">
          <h4 className="text-[14px] font-sans font-bold text-on-surface leading-none m-0">
            {title}
          </h4>
          {badge && (
            <span className="bg-error/10 text-error text-[10px] font-bold px-sm py-[2px] rounded-full uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
        <div className="text-[13px] text-on-surface-variant font-medium leading-relaxed mt-[2px]">
          {message}
        </div>
        {actionLabel && onAction && (
          <Button
            variant="secondary"
            className="mt-sm scale-90 origin-left"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-md right-md text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
