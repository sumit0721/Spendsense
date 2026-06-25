import { useState, useEffect } from 'react';
import { Plus, Repeat, Trash2, Pencil } from 'lucide-react';
import TopBar from '../components/TopBar';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { getRecurring, createRecurring, deleteRecurring, updateRecurring } from '../services/api';

const CATEGORIES = ['Rent', 'Groceries', 'Dining', 'Subscriptions', 'Travel', 'Education', 'Entertainment', 'Utilities', 'Shopping', 'Health', 'Other'];

export default function RecurringTransactions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await getRecurring();
      setItems(res.recurring || []);
    } catch (err) {
      console.error('Failed to fetch recurring transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems(); 
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Stop this recurring transaction? It will no longer auto-add monthly.')) return;
    try {
      await deleteRecurring(id);
      fetchItems();
    } catch (err) {
      console.error('Failed to delete recurring transaction:', err);
    }
  };

  return (
    <>
      <TopBar title="Recurring Transactions" subtitle="Bills that repeat every month">
        <Button variant="primary" size="sm" onClick={() => { setEditingItem(null); setShowModal(true); }}>
          <Plus size={16} /> Add Recurring
        </Button>
      </TopBar>

      <div className="p-6 max-w-[800px] mx-auto w-full">
        <div className="bg-anomaly-bg/40 border border-anomaly-border/30 rounded-lg p-3 mb-4 text-[13px] text-on-surface">
          These auto-create a transaction on the day of month you set, every month — for things like Netflix, rent, EMI, or your internet bill. You won't need to add them manually again.
        </div>

        {loading ? (
          <LoadingState type="cards" />
        ) : items.length === 0 ? (
          <EmptyState
            title="No recurring transactions set up"
            description="Add Netflix, rent, EMI, or any other monthly bill so it auto-adds itself every month."
            actionLabel="Add your first recurring transaction"
            onAction={() => { setEditingItem(null); setShowModal(true); }}
          />
        ) : (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl divide-y divide-outline-variant">
            {items.map((item) => (
              <div key={item._id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center">
                    <Repeat size={16} className="text-on-surface-variant" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-on-surface">{item.merchant}</p>
                    <p className="text-[12px] text-on-surface-variant">{item.category} · Day {item.dayOfMonth} of every month</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[14px] font-semibold tabular-nums text-on-surface">₹{item.amount.toFixed(2)}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setEditingItem(item); setShowModal(true); }} className="text-on-surface-variant hover:text-primary p-1">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(item._id)} className="text-on-surface-variant hover:text-error p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <CreateRecurringModal 
          onClose={() => { setShowModal(false); setEditingItem(null); }} 
          onSuccess={() => { setShowModal(false); setEditingItem(null); fetchItems(); }}
          initialData={editingItem}
        />
      )}
    </>
  );
}

function CreateRecurringModal({ onClose, onSuccess, initialData }) {
  const isEdit = !!initialData;
  const [merchant, setMerchant] = useState(initialData?.merchant || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [category, setCategory] = useState(initialData?.category || CATEGORIES[0]);
  const [dayOfMonth, setDayOfMonth] = useState(initialData?.dayOfMonth?.toString() || '1');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!merchant.trim() || !amount || parseFloat(amount) <= 0) {
      setError('Enter a name and an amount greater than zero.');
      return;
    }
    setSubmitting(true);
    try {
      const data = { merchant: merchant.trim(), amount: parseFloat(amount), category, dayOfMonth: parseInt(dayOfMonth, 10) };
      if (isEdit) {
        await updateRecurring(initialData._id, data);
      } else {
        await createRecurring(data);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} recurring transaction.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-xl p-6 w-full max-w-sm space-y-4 animate-modal-in">
        <h3 className="text-[18px] font-semibold text-on-surface">{isEdit ? 'Edit' : 'Add'} Recurring Transaction</h3>
        {error && <p className="text-[13px] text-error">{error}</p>}
        <div>
          <label className="text-[13px] font-medium text-on-surface-variant">Name</label>
          <input
            value={merchant} onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. Netflix, Rent, EMI"
            className="w-full mt-1 px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-[14px]"
          />
        </div>
        <div>
          <label className="text-[13px] font-medium text-on-surface-variant">Amount (₹)</label>
          <input
            type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-[14px]"
          />
        </div>
        <div>
          <label className="text-[13px] font-medium text-on-surface-variant">Category</label>
          <select
            value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-[14px]"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[13px] font-medium text-on-surface-variant">Day of month (1–28)</label>
          <input
            type="number" min="1" max="28" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-[14px]"
          />
          <p className="text-[11px] text-on-surface-variant mt-1">Capped at 28 to avoid issues with shorter months.</p>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </div>
  );
}
