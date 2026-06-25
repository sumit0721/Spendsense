import Button from './Button';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  message, // fallback alias
  actionLabel,
  onAction,
  className = '',
}) {
  const displayDesc = description || message;
  return (
    <div className={`flex flex-col items-center justify-center text-center p-xl bg-surface-container border border-dashed border-outline-variant rounded-lg max-w-md mx-auto ${className}`}>
      {Icon && (
        <div className="p-sm bg-surface rounded-full text-secondary mb-md">
          <Icon className="w-[32px] h-[32px]" />
        </div>
      )}
      <h3 className="text-[18px] font-sans font-bold text-on-surface mb-xs">
        {title}
      </h3>
      <p className="text-[14px] text-on-surface-variant font-medium mb-lg max-w-sm">
        {displayDesc}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
