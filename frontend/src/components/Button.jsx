import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = 'px-md py-sm font-sans font-medium text-[14px] rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 flex items-center justify-center gap-xs disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary text-on-primary hover:bg-primary/95 shadow-card hover:translate-y-[-1px] active:translate-y-[0px]',
    secondary: 'bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface hover:text-primary active:bg-outline-variant/10',
    danger: 'bg-error text-white hover:bg-error/95 shadow-card hover:translate-y-[-1px] active:translate-y-[0px]',
    ghost: 'text-on-surface-variant hover:bg-surface hover:text-primary',
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
