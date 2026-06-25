import Card from './Card';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function MetricCard({
  label,
  value,
  trend, // string: 'up' | 'down' | 'neutral'
  trendValue, // string: '+4.5%' or 'No data yet'
  progress, // number: 0 to 100 representing percentage
  progressLabel, // string
  icon,
  className = '',
}) {
  const renderTrendIcon = () => {
    if (trend === 'up') return <ArrowUpRight className="w-3.5 h-3.5 text-success" />;
    if (trend === 'down') return <ArrowDownRight className="w-3.5 h-3.5 text-error" />;
    return <Minus className="w-3.5 h-3.5 text-secondary" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'bg-success/10 text-success';
    if (trend === 'down') return 'bg-error/10 text-error';
    return 'bg-secondary/10 text-secondary';
  };

  return (
    <Card hoverEffect={true} className={`flex flex-col gap-sm justify-between min-h-[140px] ${className}`}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-[4px]">
          <span className="text-[12px] font-sans font-bold text-secondary uppercase tracking-wider">
            {label}
          </span>
          <span className="text-[28px] font-sans font-extrabold text-on-surface tracking-tight leading-none mt-xs">
            {value}
          </span>
        </div>
        {icon && (
          <div className="p-xs bg-surface border border-outline-variant/60 text-secondary rounded-lg">
            {icon}
          </div>
        )}
      </div>

      {trendValue && (
        <div className="flex items-center gap-[6px] text-[12px] mt-xs">
          <span className={`flex items-center justify-center p-[2px] rounded ${getTrendColor()}`}>
            {renderTrendIcon()}
          </span>
          <span className="text-on-surface-variant font-medium">{trendValue}</span>
        </div>
      )}

      {typeof progress === 'number' && (
        <div className="mt-sm space-y-[4px]">
          <div className="flex justify-between text-[11px] text-on-surface-variant font-bold">
            <span>{progressLabel || 'Progress'}</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full h-[6px] bg-surface rounded-full overflow-hidden border border-outline-variant/30">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress > 100 ? 'bg-error' : 'bg-primary'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
