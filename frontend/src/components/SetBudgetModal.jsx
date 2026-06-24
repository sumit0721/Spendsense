import React, { useState, useEffect } from 'react';
import { X, Save, IndianRupee } from 'lucide-react';
import Button from './Button';
import { getBudget, setBudget } from '../services/api';

const CATEGORIES = [
  'Rent', 'Groceries', 'Dining', 'Subscriptions', 'Travel',
  'Education', 'Entertainment', 'Utilities', 'Shopping', 'Health', 'Other',
];

export default function SetBudgetModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [totalLimit, setTotalLimit] = useState('');
  const [categoryLimits, setCategoryLimits] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBudget = async () => {
      try {
        const res = await getBudget();
        if (res.budget) {
          setTotalLimit(res.budget.totalLimit.toString());
          setCategoryLimits(res.budget.categoryLimits || {});
        }
      } catch (err) {
        console.error('Failed to fetch budget:', err);
      }
    };
    fetchBudget();
  }, []);

  const handleCategoryChange = (category, value) => {
    setCategoryLimits(prev => ({
      ...prev,
      [category]: value ? parseFloat(value) : null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!totalLimit || isNaN(totalLimit) || Number(totalLimit) <= 0) {
      setError('Please enter a valid total monthly budget.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const date = new Date();
      // Clean up category limits to remove null/empty values
      const cleanedCategoryLimits = {};
      Object.entries(categoryLimits).forEach(([k, v]) => {
        if (v && !isNaN(v) && v > 0) {
          cleanedCategoryLimits[k] = v;
        }
      });

      await setBudget({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        totalLimit: parseFloat(totalLimit),
        categoryLimits: cleanedCategoryLimits
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save budget. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="bg-surface dark:bg-dark-surface rounded-2xl w-full max-w-lg shadow-2xl border border-outline-variant/20 dark:border-dark-outline-variant flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-center p-5 border-b border-outline-variant/40 dark:border-dark-outline-variant shrink-0">
          <h2 className="text-[18px] font-bold text-on-surface">Manage Monthly Budget</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-error"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto">
          {error && (
            <div className="p-3 text-[13px] font-medium text-error bg-error-container rounded-lg border border-error/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[13px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
              Overall Monthly Limit <span className="text-error">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                <IndianRupee size={16} />
              </div>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                className="w-full pl-9 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="e.g. 50000"
                value={totalLimit}
                onChange={(e) => setTotalLimit(e.target.value)}
              />
            </div>
            <p className="text-[12px] text-on-surface-variant opacity-80">
              The total amount you plan to spend this month across all categories.
            </p>
          </div>

          <div className="border-t border-outline-variant/40 pt-4">
            <label className="text-[13px] font-bold uppercase tracking-wider text-on-surface-variant mb-4 block">
              Category Limits (Optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CATEGORIES.map(category => (
                <div key={category} className="flex flex-col gap-1">
                  <span className="text-[13px] font-medium text-on-surface">{category}</span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-on-surface-variant">
                      <IndianRupee size={14} />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full pl-7 pr-3 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary text-[14px]"
                      placeholder="Limit"
                      value={categoryLimits[category] || ''}
                      onChange={(e) => handleCategoryChange(category, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 mt-2 shrink-0">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              <Save size={18} className={loading ? 'opacity-50' : ''} />
              {loading ? 'Saving...' : 'Save Budget'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
