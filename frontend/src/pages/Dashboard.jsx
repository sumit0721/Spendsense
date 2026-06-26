import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, PieChart, TrendingUp, Plus } from 'lucide-react';
import TopBar from '../components/TopBar';
import MetricCard from '../components/MetricCard';
import InsightCard from '../components/InsightCard';
import ChartContainer from '../components/ChartContainer';
import CategoryBar from '../components/CategoryBar';
import TransactionRow from '../components/TransactionRow';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import AddTransactionModal from '../components/AddTransactionModal';
import SetBudgetModal from '../components/SetBudgetModal';
import { getTransactions, getTransactionStats, getBudgetForecast, getDashboardSummary, getMonthlyTrend } from '../services/api';
import CategoryPieChart from '../components/CategoryPieChart';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [summary, setSummary] = useState(null);
  const [trendData, setTrendData] = useState([]);

  const fetchData = async () => {
      try {
        setError(false);
        const [transRes, statsRes, forecastRes, summaryRes, trendRes] = await Promise.all([
          getTransactions(1, 5),
          getTransactionStats(90),
          getBudgetForecast(),
          getDashboardSummary(),
          getMonthlyTrend()
        ]);
        setTransactions(transRes.transactions || []);
        setStats(statsRes);
        setForecast(forecastRes);
        setSummary(summaryRes);
        setTrendData(trendRes.trend || []);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const currentMonthTotal = stats?.monthlyComparison?.currentMonthTotal || 0;
  const momPct = stats?.monthlyComparison?.momDeltaPercentage || 0;
  // NOTE: MetricCard's `trend` prop means 'up' = good/green, 'down' = bad/red —
  // it has no awareness of WHAT increased or decreased. For spending, a
  // POSITIVE momPct (spend went UP) is bad for the user, so it must map to
  // MetricCard's 'down' (red), not 'up'. This mapping is intentionally
  // inverted relative to the raw number's sign — do not "fix" this to match
  // momPct's sign directly, that would show spending increases in green.
  const spendTrend = momPct > 0 ? 'down' : momPct < 0 ? 'up' : 'neutral';
  const spendTrendValue = stats ? `${momPct > 0 ? '+' : ''}${momPct}% vs last month` : 'No data yet';

  const totalSpend = forecast?.forecasts?.reduce((acc, f) => acc + (f.currentSpend || 0), 0) || 0;
  const totalLimit = forecast?.forecasts?.reduce((acc, f) => acc + (f.limit || 0), 0) || 0;
  const budgetRemaining = totalLimit - totalSpend;
  const budgetProgress = totalLimit > 0 ? (totalSpend / totalLimit) * 100 : undefined;
  const budgetProgressLabel = totalLimit > 0 ? `Spent ₹${totalSpend.toFixed(2)} of ₹${totalLimit.toFixed(2)}` : 'Set a budget to start tracking';
  
  
  const totalProjected = forecast?.forecasts?.reduce((acc, f) => acc + (f.projectedSpend || 0), 0) || 0;
  const projectedValue = totalLimit > 0 ? `₹${totalProjected.toFixed(2)}` : '—';
  const projectedTrend = totalLimit > 0 && totalProjected > totalLimit ? 'down' : 'neutral';
  const projectedTrendValue = totalLimit > 0 ? (totalProjected > totalLimit ? 'Projected over budget' : 'Projected on track') : 'No active budget';

  const currentDay = new Date().getDate();
  const avgDaily = currentMonthTotal / currentDay || 0;
  const limitRemainingRate = totalLimit > 0 ? Math.max(0, (1 - totalSpend / totalLimit) * 100) : null;

  return (
    <>
      <TopBar title="Dashboard" subtitle="This Month">
        <div className="hidden sm:flex items-center bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant">
          <span className="text-[14px] font-medium">This Month</span>
        </div>
      </TopBar>

      <div className="p-6 space-y-6 max-w-[1200px] mx-auto w-full">
        {error && (
          <div className="p-4 bg-error-container text-on-error-container rounded-lg border border-error/20 text-[14px] font-medium">
            Could not retrieve recent data from the servers. Displaying local cache/defaults.
          </div>
        )}

        {forecast?.advisorySentence && (
          <InsightCard type="ai" title="AI Smart Advisory" message={forecast.advisorySentence} />
        )}

        {loading ? (
          <LoadingState type="cards" />
        ) : (
          <div className="space-y-6">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                label="Income"
                value={summary ? `₹${summary.income.toFixed(2)}` : '—'}
                icon={<TrendingUp size={18} />}
              />
              <MetricCard
                label="Savings"
                value={summary ? `₹${summary.savings.toFixed(2)}` : '—'}
                trend={summary?.savings >= 0 ? 'up' : 'down'}
                trendValue={summary?.savings >= 0 ? 'Positive this month' : 'Spending exceeds income'}
                icon={<PieChart size={18} />}
              />
            </section>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard label="Total Spent" value={`₹${currentMonthTotal.toFixed(2)}`} trend={spendTrend} trendValue={spendTrendValue} icon={<Wallet size={18} />} />
              <MetricCard label="Budget Remaining" value={totalLimit > 0 ? `₹${Math.max(0, budgetRemaining).toFixed(2)}` : '—'} progress={budgetProgress} progressLabel={budgetProgressLabel} icon={<PieChart size={18} />} />
              <MetricCard label="Forecasted End-of-Month" value={projectedValue} trend={projectedTrend} trendValue={projectedTrendValue} icon={<TrendingUp size={18} />} />
            </section>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-5 flex flex-col gap-6">
            <ChartContainer
              title="Category Breakdown"
              actions={
                <button onClick={() => navigate('/transactions')} className="text-[12px] font-semibold text-primary hover:underline">
                  View Details
                </button>
              }
            >
              <div className="space-y-6">
                {loading ? (
                  <LoadingState type="cards" />
                ) : stats?.categoryTotals && stats.categoryTotals.length > 0 ? (
                  <div className="flex flex-col gap-6">
                    <CategoryPieChart data={stats.categoryTotals} />
                    <div className="space-y-4">
                      {stats.categoryTotals.slice(0, 6).map((c) => (
                        <CategoryBar
                          key={c.category}
                          category={c.category}
                          amount={c.total}
                          percentage={currentMonthTotal > 0 ? (c.total / currentMonthTotal) * 100 : 0}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyState title="No category data" description="No transaction categories logged in the last 90 days." />
                )}
              </div>
              <div className="mt-8 pt-4 border-t border-outline-variant">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-surface-container-low rounded-lg">
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant opacity-60">Avg. Daily</p>
                    <p className="text-[18px] font-semibold tabular-nums text-on-surface">₹{avgDaily.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-surface-container-low rounded-lg">
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant opacity-60">Limit Status</p>
                    <p className="text-[18px] font-semibold tabular-nums text-on-surface">
                      {limitRemainingRate !== null ? `${limitRemainingRate.toFixed(0)}% Left` : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </ChartContainer>

            <ChartContainer title="Monthly Expense Trend">
              <div className="h-[250px] w-full mt-4">
                {loading ? (
                  <LoadingState type="cards" />
                ) : trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `₹${val}`} />
                      <Tooltip
                        cursor={{ fill: '#f3f4f6' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`₹${value}`, 'Expense']}
                      />
                      <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState title="No trend data" description="Not enough data to show a trend." />
                )}
              </div>
            </ChartContainer>
          </section>

          <section className="lg:col-span-7">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl card-shadow overflow-hidden flex flex-col h-full">
              <div className="p-4 flex justify-between items-center border-b border-outline-variant">
                <h3 className="text-[18px] font-semibold text-on-surface">Recent Transactions</h3>
              </div>
              <div className="flex-1 overflow-x-auto">
                {loading ? (
                  <LoadingState count={5} type="table" />
                ) : transactions.length === 0 ? (
                  <EmptyState title="No transactions yet" description="Add your first transaction to start tracking your spending." actionLabel="Add Transaction" onAction={() => setShowAddModal(true)} />
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-surface-container-low text-on-surface-variant">
                        <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Merchant</th>
                        <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Category</th>
                        <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px]">Date</th>
                        <th className="px-4 py-3 font-semibold uppercase tracking-wider text-[11px] text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {transactions.map((t) => (<TransactionRow key={t._id} transaction={t} onDeleteSuccess={fetchData} />))}
                    </tbody>
                  </table>
                )}
              </div>
              {transactions.length > 0 && (
                <div className="p-4 bg-surface-container-low text-center border-t border-outline-variant">
                  <a href="/transactions" className="text-[14px] font-medium text-primary hover:underline">View All Transactions</a>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {showAddModal && (
        <AddTransactionModal onClose={() => setShowAddModal(false)} onSuccess={() => { setShowAddModal(false); fetchData(); }} />
      )}
      {showBudgetModal && (
        <SetBudgetModal onClose={() => setShowBudgetModal(false)} onSuccess={() => { setShowBudgetModal(false); fetchData(); }} />
      )}

      {/* Quick Action Buttons */}
      <div className="fixed bottom-20 md:bottom-8 right-8 flex flex-col gap-4 z-40">
        <button onClick={() => setShowBudgetModal(true)} title={totalLimit > 0 ? "Edit Budget" : "Set Budget"} className="w-12 h-12 bg-secondary text-white dark:text-surface-container-lowest rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform group">
          <PieChart size={20} className="group-hover:rotate-12 transition-transform duration-300" />
        </button>
        <button onClick={() => setShowAddModal(true)} title="Add Transaction" className="w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform group">
          <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>
    </>
  );
}
