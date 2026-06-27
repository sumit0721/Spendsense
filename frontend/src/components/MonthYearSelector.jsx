import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function MonthYearSelector({ month, year, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const now = new Date();
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  // Years from 3 years ago through the current year — adjust range if
  // the user's account is older than that.
  const years = Array.from({ length: 4 }, (_, i) => now.getFullYear() - 3 + i);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-[13px] sm:text-[14px] font-medium text-on-surface whitespace-nowrap"
      >
        <Calendar size={15} className="hidden sm:inline" />
        {isCurrentMonth ? 'This Month' : `${MONTHS[month - 1]} ${year}`}
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-surface-container-lowest border border-outline-variant rounded-xl card-shadow z-50 p-3 max-h-80 overflow-y-auto">
          <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => onChange(month, y)}
                className={`px-3 py-1 rounded-md text-[13px] font-medium whitespace-nowrap ${
                  y === year ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS.map((m, i) => {
              const monthNum = i + 1;
              const isFuture = year === now.getFullYear() && monthNum > now.getMonth() + 1;
              const isSelected = monthNum === month;
              return (
                <button
                  key={m}
                  disabled={isFuture}
                  onClick={() => { onChange(monthNum, year); setOpen(false); }}
                  className={`px-2 py-1.5 rounded-md text-[12px] font-medium ${
                    isSelected ? 'bg-primary text-on-primary'
                    : isFuture ? 'text-on-surface-variant/40 cursor-not-allowed'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {m.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
