import { useState, useEffect } from 'react';
import { Plus, Target, Trash2 } from 'lucide-react';
import TopBar from '../components/TopBar';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { getGoals, createGoal, updateGoalProgress, deleteGoal } from '../services/api';

export default function SavingsGoals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [addingTo, setAddingTo] = useState(null); // goal._id currently getting a deposit

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await getGoals();
      setGoals(res.goals || []);
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this savings goal? This cannot be undone.')) return;
    try {
      await deleteGoal(id);
      fetchGoals();
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const handleAddFunds = async (id, amount) => {
    try {
      const res = await updateGoalProgress(id, amount);
      if (res.justCompleted) {
        // Notification panel reads anomaly flags today; goal completion
        // is a separate, client-side-only signal for now (no new backend
        // notification model was scoped) — this alert is a placeholder
        // for a real toast/notification entry, flag to Antigravity if
        // you want this wired into NotificationPanel instead.
        alert(`🎉 Goal "${res.goal.name}" completed!`);
      }
      fetchGoals();
    } catch (err) {
      console.error('Failed to update goal progress:', err);
    }
  };

  return (
    <>
      <TopBar title="Savings Goals" subtitle="Track what you're saving toward">
        <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> New Goal
        </Button>
      </TopBar>

      <div className="p-6 max-w-[1000px] mx-auto w-full space-y-4">
        {loading ? (
          <LoadingState type="cards" />
        ) : goals.length === 0 ? (
          <EmptyState
            title="No savings goals yet"
            description="Set a target — like a new laptop or an emergency fund — and track your progress toward it."
            actionLabel="Create your first goal"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.savedAmount / goal.targetAmount) * 100));
            return (
              <div key={goal._id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 card-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                      <Target size={18} className="text-on-primary-container" />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-semibold text-on-surface">{goal.name}</h3>
                      <p className="text-[13px] text-on-surface-variant">
                        ₹{goal.savedAmount.toLocaleString()} of ₹{goal.targetAmount.toLocaleString()}
                        {goal.isCompleted && <span className="ml-2 text-success font-medium">Completed</span>}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(goal._id)} className="text-on-surface-variant hover:text-error p-1">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="w-full h-2.5 bg-surface-container-low rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all ${goal.isCompleted ? 'bg-success' : 'bg-primary'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-medium text-on-surface-variant">{pct}% complete</span>
                  {!goal.isCompleted && (
                    addingTo === goal._id ? (
                      <AddFundsInline
                        onSubmit={(amt) => { handleAddFunds(goal._id, amt); setAddingTo(null); }}
                        onCancel={() => setAddingTo(null)}
                      />
                    ) : (
                      <button onClick={() => setAddingTo(goal._id)} className="text-[13px] font-medium text-primary hover:underline">
                        Add funds
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showCreateModal && (
        <CreateGoalModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); fetchGoals(); }}
        />
      )}
    </>
  );
}

function AddFundsInline({ onSubmit, onCancel }) {
  const [value, setValue] = useState('');
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        autoFocus
        placeholder="₹ amount"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-24 px-2 py-1 text-[13px] bg-surface-container-low border border-outline-variant rounded-lg"
      />
      <button
        onClick={() => { const n = parseFloat(value); if (n > 0) onSubmit(n); }}
        className="text-[13px] font-medium text-primary"
      >
        Add
      </button>
      <button onClick={onCancel} className="text-[13px] text-on-surface-variant">Cancel</button>
    </div>
  );
}

function CreateGoalModal({ onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount || parseFloat(targetAmount) <= 0) {
      setError('Enter a goal name and a target amount greater than zero.');
      return;
    }
    setSubmitting(true);
    try {
      await createGoal({ name: name.trim(), targetAmount: parseFloat(targetAmount), targetDate: targetDate || undefined });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create goal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-xl p-6 w-full max-w-sm space-y-4 animate-modal-in">
        <h3 className="text-[18px] font-semibold text-on-surface">New Savings Goal</h3>
        {error && <p className="text-[13px] text-error">{error}</p>}
        <div>
          <label className="text-[13px] font-medium text-on-surface-variant">Goal name</label>
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. New Laptop"
            className="w-full mt-1 px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-[14px]"
          />
        </div>
        <div>
          <label className="text-[13px] font-medium text-on-surface-variant">Target amount (₹)</label>
          <input
            type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="80000"
            className="w-full mt-1 px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-[14px]"
          />
        </div>
        <div>
          <label className="text-[13px] font-medium text-on-surface-variant">Target date (optional)</label>
          <input
            type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-[14px]"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" variant="primary" disabled={submitting} className="flex-1">
            {submitting ? 'Creating...' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </div>
  );
}
