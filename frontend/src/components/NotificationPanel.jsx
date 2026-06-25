import { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, X } from 'lucide-react';
import { getTransactions, getBudgetForecast } from '../services/api';

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [anomalies, setAnomalies] = useState([]);
  const [budgetWarnings, setBudgetWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef(null);

  const [clearedIds, setClearedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('clearedNotifications') || '[]'); }
    catch { return []; }
  });
  const [toasts, setToasts] = useState([]);

  const markAsRead = (id) => {
    const newCleared = [...clearedIds, id];
    setClearedIds(newCleared);
    localStorage.setItem('clearedNotifications', JSON.stringify(newCleared));
  };

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        // Reuses the existing /transactions endpoint — no new backend route.
        // Pulls a recent page and filters client-side for isAnomaly === true.
        const res = await getTransactions({ page: 1, limit: 50 });
        const flagged = (res.transactions || []).filter((t) => t.isAnomaly);
        setAnomalies(flagged);

        const forecastRes = await getBudgetForecast();
        const overBudget = (forecastRes.forecasts || []).filter((f) => f.status === 'over');
        setBudgetWarnings(overBudget);
      } catch (err) {
        console.error('Failed to fetch anomaly notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnomalies();
  }, []);

  const activeAnomalies = anomalies.filter(t => !clearedIds.includes(`anomaly_${t._id}`));
  const activeBudgets = budgetWarnings.filter(f => !clearedIds.includes(`budget_${f.category}`));

  useEffect(() => {
    if (activeBudgets.length > 0) {
      const toasted = JSON.parse(sessionStorage.getItem('toastedBudgets') || '[]');
      const newToasts = activeBudgets.filter(b => !toasted.includes(b.category));
      
      if (newToasts.length > 0) {
        setToasts(prev => [...prev, ...newToasts]);
        sessionStorage.setItem('toastedBudgets', JSON.stringify([...toasted, ...newToasts.map(b => b.category)]));
        setTimeout(() => {
          setToasts(prev => prev.filter(t => !newToasts.find(nt => nt.category === t.category)));
        }, 6000);
      }
    }
  }, [activeBudgets]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative p-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant"
      >
        <Bell size={20} />
        {(activeAnomalies.length > 0 || activeBudgets.length > 0) && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
        )}
      </button>

      {/* Toasts overlay */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.category} className="pointer-events-auto bg-error-container text-on-error-container border border-error/20 p-4 rounded-xl shadow-card flex items-start gap-3 animate-slide-up max-w-[320px]">
            <AlertTriangle size={20} className="text-error shrink-0 mt-0.5" />
            <p className="text-[13px] font-medium leading-snug flex-1">
              ⚠️ You have exceeded your {t.category} budget
            </p>
            <button 
              onClick={() => setToasts(prev => prev.filter(x => x.category !== t.category))} 
              className="p-1 hover:bg-black/5 rounded-md transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl card-shadow z-50 overflow-hidden">
          <div className="p-3 border-b border-outline-variant">
            <h4 className="text-[14px] font-semibold text-on-surface">Notifications</h4>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-[13px] text-on-surface-variant">Loading...</p>
            ) : activeAnomalies.length === 0 && activeBudgets.length === 0 ? (
              <p className="p-4 text-[13px] text-on-surface-variant">No new notifications.</p>
            ) : (
              <>
                {activeBudgets.map((f) => (
                  <div key={f.category} className="p-3 border-b border-outline-variant flex items-start gap-2 hover:bg-surface-container-low transition-colors group">
                    <AlertTriangle size={16} className="text-error mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-on-surface">
                        ⚠️ You have exceeded your {f.category} budget
                      </p>
                    </div>
                    <button 
                      onClick={() => markAsRead(`budget_${f.category}`)}
                      className="text-[11px] text-on-surface-variant hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Mark as read"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                {activeAnomalies.map((t) => (
                  <div key={t._id} className="p-3 border-b border-outline-variant last:border-0 flex items-start gap-2 hover:bg-surface-container-low transition-colors group">
                    <AlertTriangle size={16} className="text-anomaly-text mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-on-surface">
                        Unusual {t.category} spend: ₹{t.amount}
                      </p>
                      <p className="text-[12px] text-on-surface-variant">{t.merchant} — {new Date(t.date).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => markAsRead(`anomaly_${t._id}`)}
                      className="text-[11px] text-on-surface-variant hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Mark as read"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
