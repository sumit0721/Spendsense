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
import { getTransactions, getTransactionStats, getBudgetForecast } from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchData = async () => {
      try {
        setError(false);
        const [transRes, statsRes, forecastRes] = await Promise.all([
          getTransactions(1, 5),
          getTransactionStats(90),
          getBudgetForecast()
        ]);
        setTransactions(transRes.transactions || []);
        setStats(statsRes);
        setForecast(forecastRes);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute metrics
  const currentMonthTotal = stats?.monthlyComparison?.currentMonthTotal || 0;
  const momPct = stats?.monthlyComparison?.momDeltaPercentage || 0;
  const spendTrend = momPct > 0 ? 'down' : momPct < 0 ? 'up' : 'neutral'; // More spend is 'down' (negative for student), less is 'up'
  const spendTrendValue = stats ? `${momPct > 0 ? '+' : ''}${momPct}% vs last month` : 'No data yet';

  // Budget remaining calculations
  const totalSpend = forecast?.forecasts?.reduce((acc, f) => acc + (f.currentSpend || 0), 0) || 0;
  const totalLimit = forecast?.forecasts?.reduce((acc, f) => acc + (f.limit || 0), 0) || 0;
  const budgetRemaining = totalLimit - totalSpend;
  const budgetProgress = totalLimit > 0 ? (totalSpend / totalLimit) * 100 : undefined;
  const budgetProgressLabel = totalLimit > 0 ? `Spent ₹${totalSpend.toFixed(2)} of ₹${totalLimit.toFixed(2)}` : 'Set a budget to start tracking';

  // Forecasting calculations
  const totalProjected = forecast?.forecasts?.reduce((acc, f) => acc + (f.projectedSpend || 0), 0) || 0;
  const projectedValue = totalLimit > 0 ? `₹${totalProjected.toFixed(2)}` : '—';
  const projectedTrend = totalLimit > 0 && totalProjected > totalLimit ? 'down' : 'neutral';
  const projectedTrendValue = totalLimit > 0 ? (totalProjected > totalLimit ? 'Projected over budget' : 'Projected on track') : 'No active budget';

  // Average daily spending calculation
  const currentDay = new Date().getDate();
  const avgDaily = currentMonthTotal / currentDay || 0;

  // Savings limit safety factor
  const limitRemainingRate = totalLimit > 0 ? Math.max(0, (1 - totalSpend / totalLimit) * 100) : null;

  return (
    <>
      <TopBar title="Dashboard" subtitle="This Month">
        <div className="hidden sm:flex items-center bg-surface-container px-3 py-1.5 rounded-lg border border-outline-variant">
          <span className="text-[14px] font-medium">This Month</span>
        </div>
      </TopBar>

      <div className="p-6 space-y-6 max-w-[1200px] mx-auto w-full">
        {/* Error Alert Box */}
        {error && (
          <div className="p-4 bg-error-container text-on-error-container rounded-lg border border-error/20 text-[14px] font-medium">
            Could not retrieve recent data from the servers. Displaying local cache/defaults.
          </div>
        )}

        {/* Insight of the Day (AI-advisory message grounded in real budget data) */}
        {forecast?.advisorySentence && (
          <InsightCard
            type="ai"
            title="AI Smart Advisory"
            message={forecast.advisorySentence}
          />
        )}

        {/* Metric Cards */}
        {loading ? (
          <LoadingState type="cards" />
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              label="Total Spent"
              value={`₹${currentMonthTotal.toFixed(2)}`}
              trend={spendTrend}
              trendValue={spendTrendValue}
              icon={<Wallet size={18} />}
            />
            <MetricCard
              label="Budget Remaining"
              value={totalLimit > 0 ? `₹${Math.max(0, budgetRemaining).toFixed(2)}` : '—'}
              progress={budgetProgress}
              progressLabel={budgetProgressLabel}
              icon={<PieChart size={18} />}
            />
            <MetricCard
              label="Forecasted End-of-Month"
              value={projectedValue}
              trend={projectedTrend}
              trendValue={projectedTrendValue}
              icon={<TrendingUp size={18} />}
            />
          </section>
        )}

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Category Breakdown */}
          <section className="lg:col-span-5 h-full">
            <ChartContainer
              title="Category Breakdown"
              actions={
                <button
                  onClick={() => navigate('/transactions')}
                  className="text-[12px] font-semibold text-primary hover:underline"
                >
                  View Details
                </button>
              }
            >
              <div className="space-y-6">
                {loading ? (
                  <LoadingState type="cards" />
                ) : stats?.categoryTotals && stats.categoryTotals.length > 0 ? (
                  stats.categoryTotals.slice(0, 5).map((catTotal) => {
                    const catForecast = forecast?.forecasts?.find((f) => f.category === catTotal.category);
                    const limit = catForecast?.limit || 0;
                    const isAnomaly = catForecast?.status === 'over';

                    const totalMonthSpend = stats.monthlyComparison?.currentMonthTotal || 1;
                    const percentage = (catTotal.total / totalMonthSpend) * 100;

                    return (
                      <CategoryBar
                        key={catTotal.category}
                        category={catTotal.category}
                        amount={catTotal.total}
                        percentage={limit > 0 ? (catTotal.total / limit) * 100 : percentage}
                        limit={limit}
                        isAnomaly={isAnomaly}
                      />
                    );
                  })
                ) : (
                  <EmptyState
                    title="No category data"
                    description="No transaction categories logged in the last 90 days."
                  />
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
          </section>

          {/* Recent Transactions */}
          <section className="lg:col-span-7">
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl card-shadow overflow-hidden flex flex-col h-full">
              <div className="p-4 flex justify-between items-center border-b border-outline-variant">
                <h3 className="text-[18px] font-semibold text-on-surface">Recent Transactions</h3>
              </div>
              <div className="flex-1 overflow-x-auto">
                {loading ? (
                  <LoadingState count={5} type="table" />
                ) : transactions.length === 0 ? (
                  <EmptyState
                    title="No transactions yet"
                    description="Add your first transaction to start tracking your spending."
                    actionLabel="Add Transaction"
                    onAction={() => setShowAddModal(true)}
                  />
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
                      {transactions.map((t) => (
                        <TransactionRow key={t._id} transaction={t} />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {transactions.length > 0 && (
                <div className="p-4 bg-surface-container-low text-center border-t border-outline-variant">
                  <a href="/transactions" className="text-[14px] font-medium text-primary hover:underline">
                    View All Transactions
                  </a>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <AddTransactionModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchData();
          }}
        />
      )}

      {/* Floating Add Button */}
      <button
        onClick={() => setShowAddModal(true)}
        title="Add Transaction"
        className="fixed bottom-20 md:bottom-8 right-8 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-40 group"
      >
        <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </>
  );
}
