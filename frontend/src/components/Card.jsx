
export default function Card({ children, className = '', onClick, hoverEffect = true }) {
  return (
    <div
      onClick={onClick}
      className={`bg-surface-container-lowest dark:bg-dark-surface-container-lowest border border-outline-variant dark:border-dark-outline-variant rounded-lg p-md shadow-card transition-all duration-300 ${
        hoverEffect ? 'hover:translate-y-[-2px] hover:shadow-lg' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
