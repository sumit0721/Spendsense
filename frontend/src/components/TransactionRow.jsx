import React from 'react';
import {
  Utensils,
  ShoppingBag,
  Car,
  Zap,
  Film,
  Heart,
  IndianRupee,
  Briefcase
} from 'lucide-react';
import StatusChip from './StatusChip';
import AnomalyBadge from './AnomalyBadge';

const categoryIcons = {
  'Food & Dining': Utensils,
  'Shopping': ShoppingBag,
  'Transportation': Car,
  'Utilities': Zap,
  'Entertainment': Film,
  'Health': Heart,
  'Salary': Briefcase,
};

export default function TransactionRow({ transaction, onRowClick }) {
  const { merchant, amount, category, date, isAnomaly, status = 'cleared' } = transaction;

  const IconComponent = categoryIcons[category] || IndianRupee;
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <tr
      onClick={() => onRowClick?.(transaction)}
      className={`border-b border-outline-variant hover:bg-surface/50 transition-colors duration-150 ${
        isAnomaly ? 'bg-error/[0.02] border-l-4 border-l-error' : 'border-l-4 border-l-transparent'
      } ${onRowClick ? 'cursor-pointer' : ''}`}
    >
      <td className="px-md py-sm">
        <div className="flex items-center gap-sm">
          <div className={`p-xs rounded-lg ${isAnomaly ? 'bg-error/10 text-error' : 'bg-primary/5 text-primary'}`}>
            <IconComponent className="w-[18px] h-[18px]" />
          </div>
          <div>
            <span className="text-[14px] font-sans font-bold text-on-surface block">
              {merchant}
            </span>
            <span className="text-[12px] text-on-surface-variant font-medium md:hidden block">
              {formattedDate}
            </span>
          </div>
        </div>
      </td>
      <td className="px-md py-sm hidden md:table-cell">
        <span className="inline-flex items-center bg-surface border border-outline-variant px-sm py-[2px] rounded text-[12px] font-medium text-on-surface-variant">
          {category}
        </span>
      </td>
      <td className="px-md py-sm text-on-surface-variant text-[12px] font-medium hidden md:table-cell">
        {formattedDate}
      </td>
      <td className="px-md py-sm">
        <div className="flex flex-col items-end gap-[2px]">
          <span className={`text-[14px] font-sans font-bold text-on-surface tabular-nums`}>
            {amount < 0 ? `-₹` : `₹`}{Math.abs(amount).toFixed(2)}
          </span>
          <div className="flex items-center gap-[4px] mt-[2px]">
            {isAnomaly && <AnomalyBadge label="Flagged" className="scale-90 origin-right" />}
            {!isAnomaly && <StatusChip status={status} className="scale-90 origin-right" />}
          </div>
        </div>
      </td>
    </tr>
  );
}
