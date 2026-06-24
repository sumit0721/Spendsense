import React from 'react';

export default function LoadingState({ type = 'card', count, rows, className = '' }) {
  const numItems = count || rows || 1;
  const skeletons = Array.from({ length: numItems });

  if (type === 'table') {
    return (
      <div className={`w-full overflow-hidden border border-outline-variant rounded-lg bg-surface-container animate-pulse ${className}`}>
        <div className="h-10 bg-surface border-b border-outline-variant" />
        {skeletons.map((_, i) => (
          <div key={i} className="flex justify-between items-center px-md py-sm border-b border-outline-variant">
            <div className="flex items-center gap-sm">
              <div className="w-[32px] h-[32px] bg-surface rounded-lg" />
              <div className="flex flex-col gap-xs">
                <div className="w-[120px] h-3 bg-surface rounded" />
                <div className="w-[60px] h-2 bg-surface rounded" />
              </div>
            </div>
            <div className="w-[80px] h-3 bg-surface rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'chat') {
    return (
      <div className={`flex flex-col gap-md p-md animate-pulse ${className}`}>
        <div className="flex gap-sm max-w-[70%]">
          <div className="w-8 h-8 rounded-full bg-surface-container shrink-0" />
          <div className="bg-surface-container h-[60px] rounded-lg w-full" />
        </div>
        <div className="flex gap-sm max-w-[70%] self-end flex-row-reverse">
          <div className="w-8 h-8 rounded-full bg-surface-container shrink-0" />
          <div className="bg-surface-container h-[40px] rounded-lg w-full" />
        </div>
        <div className="flex gap-sm max-w-[75%]">
          <div className="w-8 h-8 rounded-full bg-surface-container shrink-0" />
          <div className="bg-surface-container h-[80px] rounded-lg w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-md ${className}`}>
      {skeletons.map((_, i) => (
        <div key={i} className="bg-surface-container border border-outline-variant rounded-lg p-md h-[120px] flex flex-col justify-between animate-pulse">
          <div className="flex flex-col gap-xs">
            <div className="w-[80px] h-3 bg-surface rounded" />
            <div className="w-[150px] h-6 bg-surface rounded" />
          </div>
          <div className="w-[100px] h-3 bg-surface rounded" />
        </div>
      ))}
    </div>
  );
}
