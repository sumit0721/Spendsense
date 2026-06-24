import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

export default function Pagination({ currentPage, page, totalPages, onPageChange }) {
  const activePage = currentPage || page || 1;

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-outline-variant pt-sm mt-md w-full">
      <div className="text-[12px] text-on-surface-variant font-medium">
        Page <span className="font-bold text-on-surface">{activePage}</span> of{' '}
        <span className="font-bold text-on-surface">{totalPages}</span>
      </div>
      
      <div className="flex items-center gap-xs">
        <Button
          variant="secondary"
          className="p-[6px] rounded-lg"
          disabled={activePage === 1}
          onClick={() => onPageChange(activePage - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => {
            // Only show direct neighbours, first and last page
            return (
              p === 1 ||
              p === totalPages ||
              Math.abs(p - activePage) <= 1
            );
          })
          .map((p, index, array) => {
            // Handle ellipsis
            const showEllipsis = index > 0 && p - array[index - 1] > 1;
            
            return (
              <React.Fragment key={p}>
                {showEllipsis && (
                  <span className="px-xs text-[12px] font-semibold text-secondary">
                    ...
                  </span>
                )}
                <Button
                  variant={p === activePage ? 'primary' : 'secondary'}
                  className="px-sm py-[4px] min-w-[32px] text-[12px] rounded-lg font-bold"
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </Button>
              </React.Fragment>
            );
          })}

        <Button
          variant="secondary"
          className="p-[6px] rounded-lg"
          disabled={activePage === totalPages}
          onClick={() => onPageChange(activePage + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
