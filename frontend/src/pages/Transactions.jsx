import { useState, useEffect, useCallback } from 'react';
import { Calendar, Tag, IndianRupee, Filter, Download, Plus } from 'lucide-react';
import TopBar from '../components/TopBar';
import TransactionRow from '../components/TransactionRow';
import Pagination from '../components/Pagination';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import AddTransactionModal from '../components/AddTransactionModal';
import { getTransactions } from '../services/api';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const LIMIT = 10;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (activeCategory) params.category = activeCategory;
      const res = await getTransactions(params);
      setTransactions(res.transactions || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.totalCount || 0);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setTransactions([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, activeCategory]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleExport = () => {
    if (!transactions.length) return alert('No transactions to export.');
    const csvContent = [
      ['Merchant', 'Category', 'Date', 'Amount', 'Status', 'Notes'],
      ...transactions.map(t => [
        `"${t.merchant}"`,
        `"${t.category}"`,
        `"${new Date(t.date).toISOString().split('T')[0]}"`,
        t.amount,
        `"${t.status || 'cleared'}"`,
        `"${t.notes || ''}"`
      ])
    ].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'transactions.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filterButtons = [
    { label: 'Date Range', icon: <Calendar size={16} /> },
    { label: 'Category', icon: <Tag size={16} /> },
    { label: 'Amount', icon: <IndianRupee size={14} /> },
    { label: 'More', icon: <Filter size={16} /> },
  ];

  return (
    <>
      <TopBar title="Transactions">
        <div className="hidden sm:flex items-center bg-surface-container-low border border-outline-variant rounded-full px-4 py-1 gap-2">
          <span className="text-on-surface-variant text-[14px]">🔍</span>
          <input
            className="bg-transparent border-none focus:ring-0 text-[16px] w-48 placeholder:text-on-surface-variant/50 outline-none"
            placeholder="Search transactions..."
            type="text"
          />
        </div>
      </TopBar>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Filters */}
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {filterButtons.map(({ label, icon }) => (
              <button
                key={label}
                onClick={() => alert(`Advanced filtering by ${label} coming soon!`)}
                className="flex items-center gap-1.5 px-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-[14px] font-medium hover:bg-slate-100 dark:hover:bg-dark-surface-container-low transition-colors text-on-surface whitespace-nowrap"
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={16} />
              Add Transaction
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download size={16} />
              Export
            </Button>
          </div>
        </section>

        {/* Table */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden card-shadow">
          {loading ? (
            <LoadingState count={LIMIT} type="table" />
          ) : transactions.length === 0 ? (
            <EmptyState
              title="No transactions found"
              description="No transactions match your current filters. Try adjusting your date range or clearing your search."
              actionLabel="Clear all filters"
              onAction={() => {
                setActiveCategory(null);
                setPage(1);
              }}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant">
                      <th className="px-6 py-3 text-[14px] font-medium text-on-surface-variant uppercase tracking-wider text-[11px]">
                        Merchant
                      </th>
                      <th className="px-6 py-3 text-[14px] font-medium text-on-surface-variant uppercase tracking-wider text-[11px]">
                        Category
                      </th>
                      <th className="px-6 py-3 text-[14px] font-medium text-on-surface-variant uppercase tracking-wider text-[11px]">
                        Date
                      </th>
                      <th className="px-6 py-3 text-[14px] font-medium text-on-surface-variant uppercase tracking-wider text-[11px] text-right">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {transactions.map((t) => (
                      <TransactionRow key={t._id} transaction={t} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 bg-surface-container-low flex items-center justify-between border-t border-outline-variant">
                <p className="text-[14px] font-medium text-on-surface-variant">
                  Showing {(page - 1) * LIMIT + 1} to{' '}
                  {Math.min(page * LIMIT, totalCount)} of {totalCount} results
                </p>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <AddTransactionModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchTransactions();
          }}
        />
      )}
    </>
  );
}
