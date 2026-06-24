import React from 'react';
import Card from './Card';

export default function ChartContainer({ title, actions, children, className = '' }) {
  return (
    <Card hoverEffect={false} className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between border-b border-outline-variant pb-xs mb-md">
        <h3 className="text-[16px] font-sans font-bold text-on-surface">
          {title}
        </h3>
        {actions && <div className="flex items-center gap-xs">{actions}</div>}
      </div>
      <div className="flex-1 w-full min-h-[250px] relative">
        {children}
      </div>
    </Card>
  );
}
