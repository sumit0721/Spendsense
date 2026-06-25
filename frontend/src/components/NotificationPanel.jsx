import { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import { getTransactions } from '../services/api';

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef(null);

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        // Reuses the existing /transactions endpoint — no new backend route.
        // Pulls a recent page and filters client-side for isAnomaly === true.
        const res = await getTransactions({ page: 1, limit: 50 });
        const flagged = (res.transactions || []).filter((t) => t.isAnomaly);
        setAnomalies(flagged);
      } catch (err) {
        console.error('Failed to fetch anomaly notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnomalies();
  }, []);

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
        {anomalies.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-outline-variant rounded-xl card-shadow z-50 overflow-hidden">
          <div className="p-3 border-b border-outline-variant">
            <h4 className="text-[14px] font-semibold text-on-surface">Notifications</h4>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="p-4 text-[13px] text-on-surface-variant">Loading...</p>
            ) : anomalies.length === 0 ? (
              <p className="p-4 text-[13px] text-on-surface-variant">No unusual spending detected.</p>
            ) : (
              anomalies.map((t) => (
                <div key={t._id} className="p-3 border-b border-outline-variant last:border-0 flex gap-2 items-start">
                  <AlertTriangle size={16} className="text-anomaly-text mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[13px] font-medium text-on-surface">
                      Unusual {t.category} spend: ₹{t.amount}
                    </p>
                    <p className="text-[12px] text-on-surface-variant">{t.merchant} — {new Date(t.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
