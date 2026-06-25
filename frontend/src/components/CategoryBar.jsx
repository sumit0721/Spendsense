
export default function CategoryBar({
  category,
  label,
  amount,
  percentage,
  limit,
  isAnomaly = false,
  color = 'bg-primary',
}) {
  const displayLabel = category || label || 'General';
  const isOverLimit = (limit && amount > limit) || isAnomaly;

  return (
    <div className="flex flex-col gap-[6px]">
      <div className="flex justify-between items-baseline text-[13px] font-medium text-on-surface">
        <span className="font-bold">{displayLabel}</span>
        <div className="flex items-center gap-[4px] tabular-nums text-[12px]">
          <span className="font-bold">₹{(amount || 0).toFixed(2)}</span>
          {limit ? (
            <span className="text-secondary">/ ₹{(limit || 0).toFixed(2)}</span>
          ) : (
            <span className="text-secondary">({(percentage || 0).toFixed(0)}%)</span>
          )}
        </div>
      </div>
      
      <div className="w-full h-[8px] bg-surface rounded-full overflow-hidden border border-outline-variant/30">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isOverLimit ? 'bg-error' : color
          }`}
          style={{ width: `${Math.min(percentage || 0, 100)}%` }}
        />
      </div>
      
      {isOverLimit && (
        <span className="text-[11px] font-semibold text-error uppercase tracking-wider self-end mt-[-2px]">
          {isAnomaly ? 'Anomaly Detected' : 'Over Budget'}
        </span>
      )}
    </div>
  );
}
