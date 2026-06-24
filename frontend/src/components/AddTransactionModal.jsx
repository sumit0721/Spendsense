import { useState, useEffect, useRef } from 'react';
import { X, IndianRupee, Store, Tag, Calendar, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { createTransaction } from '../services/api';

// Mirror of backend Transaction model CATEGORIES
const CATEGORIES = [
  'Rent',
  'Groceries',
  'Dining',
  'Subscriptions',
  'Travel',
  'Education',
  'Entertainment',
  'Utilities',
  'Shopping',
  'Health',
  'Other',
];

const CATEGORY_ICONS = {
  Rent: '🏠',
  Groceries: '🛒',
  Dining: '🍽️',
  Subscriptions: '📱',
  Travel: '✈️',
  Education: '📚',
  Entertainment: '🎬',
  Utilities: '⚡',
  Shopping: '🛍️',
  Health: '❤️',
  Other: '📌',
};

export default function AddTransactionModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    merchant: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const overlayRef = useRef(null);
  const merchantRef = useRef(null);

  // Focus first input on mount
  useEffect(() => {
    merchantRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Close on overlay click (not modal content)
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!form.merchant.trim()) return setError('Merchant name is required.');
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      return setError('Please enter a valid positive amount.');
    if (!form.category) return setError('Please select a category.');
    if (!form.date) return setError('Please select a date.');

    setLoading(true);
    try {
      await createTransaction({
        merchant: form.merchant.trim(),
        amount: parseFloat(Number(form.amount).toFixed(2)),
        category: form.category,
        date: form.date,
        notes: form.notes.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 900);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-3 text-[15px] text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';

  const labelClass = 'block text-[13px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5';

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-[480px] bg-surface-container-lowest border border-outline-variant rounded-2xl shadow-2xl animate-modal-in overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant bg-surface-container-low">
          <div>
            <h2 className="text-[18px] font-bold text-on-surface">Add Transaction</h2>
            <p className="text-[13px] text-on-surface-variant mt-0.5">Record a new expense or income</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface hover:text-on-surface transition-colors focus:outline-none"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Success State ── */}
        {success ? (
          <div className="flex flex-col items-center justify-center py-14 gap-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle size={36} className="text-success" />
            </div>
            <div className="text-center">
              <p className="text-[17px] font-bold text-on-surface">Transaction Added!</p>
              <p className="text-[13px] text-on-surface-variant mt-1">
                Anomaly detection ran automatically.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* Merchant + Amount — side by side */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="at-merchant">Merchant</label>
                <div className="relative">
                  <Store size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                  <input
                    ref={merchantRef}
                    id="at-merchant"
                    name="merchant"
                    type="text"
                    value={form.merchant}
                    onChange={handleChange}
                    placeholder="Starbucks"
                    className={`${inputClass} pl-9`}
                    maxLength={80}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="at-amount">Amount (₹)</label>
                <div className="relative">
                  <IndianRupee size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60" />
                  <input
                    id="at-amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    className={`${inputClass} pl-9`}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className={labelClass} htmlFor="at-category">Category</label>
              <div className="relative">
                <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 z-10 pointer-events-none" />
                <select
                  id="at-category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className={`${inputClass} pl-9 appearance-none cursor-pointer`}
                  required
                >
                  <option value="" disabled>Select a category…</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_ICONS[cat]} {cat}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className={labelClass} htmlFor="at-date">Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 pointer-events-none" />
                <input
                  id="at-date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  className={`${inputClass} pl-9`}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass} htmlFor="at-notes">
                Notes <span className="normal-case font-normal text-on-surface-variant/60">(optional)</span>
              </label>
              <div className="relative">
                <FileText size={16} className="absolute left-3 top-3.5 text-on-surface-variant/60" />
                <textarea
                  id="at-notes"
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="e.g. Monthly subscription renewal"
                  rows={2}
                  maxLength={200}
                  className={`${inputClass} pl-9 resize-none`}
                />
              </div>
              <p className="text-right text-[11px] text-on-surface-variant/50 mt-1">
                {form.notes.length}/200
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-error-container text-on-error-container text-[13px] font-medium rounded-lg animate-fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Anomaly notice */}
            <p className="text-[11px] text-on-surface-variant/60 leading-relaxed">
              ⚡ Anomaly detection runs automatically at submission — unusual amounts are flagged based on your spending history.
            </p>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-3 rounded-lg border border-outline-variant text-on-surface text-[14px] font-semibold hover:bg-surface-container-low transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-lg bg-primary text-on-primary text-[14px] font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-card disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  'Add Transaction'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
