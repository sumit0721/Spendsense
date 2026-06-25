import { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, IndianRupee, Download, Plus, X, FileText, FileSpreadsheet, File } from 'lucide-react';
import TopBar from '../components/TopBar';
import TransactionRow from '../components/TransactionRow';
import Pagination from '../components/Pagination';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import AddTransactionModal from '../components/AddTransactionModal';
import { getTransactions, exportPDF, exportExcel } from '../services/api';

const CATEGORIES = ['Rent', 'Groceries', 'Dining', 'Subscriptions', 'Travel', 'Education', 'Entertainment', 'Utilities', 'Shopping', 'Health', 'Other'];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState(null);
  const [sortOption, setSortOption] = useState('-date');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Date range and amount range — real filter state, replacing the old
  // alert("coming soon") placeholders.
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [showDatePopover, setShowDatePopover] = useState(false);
  const [showAmountPopover, setShowAmountPopover] = useState(false);
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (exportRef.current && !exportRef.current.contains(e.target)) setShowExportMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const LIMIT = 10;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT, sort: sortOption };
      if (activeCategory) params.category = activeCategory;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (minAmount) params.minAmount = minAmount;
      if (maxAmount) params.maxAmount = maxAmount;
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
  }, [page, activeCategory, startDate, endDate, minAmount, maxAmount, sortOption]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTransactions();
  }, [fetchTransactions]);

  // Client-side search on top of the already-fetched, already-filtered page —
  // no new backend endpoint needed for this part.
  const filteredTransactions = transactions.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.merchant?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q) ||
      t.notes?.toLowerCase().includes(q)
    );
  });

  const hasActiveFilters = activeCategory || startDate || endDate || minAmount || maxAmount;

  const clearAllFilters = () => {
    setActiveCategory(null);
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setSearchQuery('');
    setPage(1);
  };

  const applyPreset = (preset) => {
    const now = new Date();
    let start, end = now;
    if (preset === '7days') { start = new Date(now); start.setDate(start.getDate() - 7); }
    else if (preset === '30days') { start = new Date(now); start.setDate(start.getDate() - 30); }
    else if (preset === 'thisMonth') { start = new Date(now.getFullYear(), now.getMonth(), 1); }
    else if (preset === 'thisYear') { start = new Date(now.getFullYear(), 0, 1); }
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setPage(1);
  };

  const handleExport = () => {
    if (!filteredTransactions.length) return alert('No transactions to export.');
    const csvContent = [
      ['Merchant', 'Category', 'Date', 'Amount', 'Status', 'Notes'],
      ...filteredTransactions.map(t => [
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

  const handleExportPDF = async () => {
    try {
      const blob = await exportPDF();
      downloadBlob(blob, 'spendsense-transactions.pdf');
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleExportExcel = async () => {
    try {
      const blob = await exportExcel();
      downloadBlob(blob, 'spendsense-transactions.xlsx');
    } catch (err) {
      console.error('Excel export failed:', err);
      alert('Failed to export Excel. Please try again.');
    }
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <TopBar title="Transactions">
        <div className="hidden sm:flex items-center bg-surface-container-low border border-outline-variant rounded-full px-4 py-1 gap-2">
          <span className="text-on-surface-variant text-[14px]">🔍</span>
          <input
            className="bg-transparent border-none focus:ring-0 text-[16px] w-48 placeholder:text-on-surface-variant/50 outline-none"
            placeholder="Search transactions..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </TopBar>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 relative pb-2 w-full lg:w-auto">
            {/* Date Range — real popover, not alert() */}
            <div className="relative">
              <button
                onClick={() => { setShowDatePopover((p) => !p); setShowAmountPopover(false); }}
                className={`flex items-center gap-1.5 px-4 py-2 border rounded-lg text-[14px] font-medium transition-colors whitespace-nowrap ${
                  startDate || endDate
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <Calendar size={16} />
                Date Range
              </button>
              {showDatePopover && (
                <div className="absolute top-full mt-2 left-0 bg-surface-container-lowest border border-outline-variant rounded-xl card-shadow p-4 z-50 w-64 space-y-3">
                  <div className="flex flex-wrap gap-1.5 pb-2 border-b border-outline-variant mb-2">
                    {[
                      { key: '7days', label: 'Last 7 days' },
                      { key: '30days', label: 'Last 30 days' },
                      { key: 'thisMonth', label: 'This Month' },
                      { key: 'thisYear', label: 'This Year' },
                    ].map((p) => (
                      <button
                        key={p.key}
                        onClick={() => applyPreset(p.key)}
                        className="text-[12px] px-2.5 py-1 bg-surface-container-low rounded-md hover:bg-surface-container-high"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-on-surface-variant">From</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                      className="w-full mt-1 px-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-[14px] text-on-surface"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-on-surface-variant">To</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                      className="w-full mt-1 px-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-[14px] text-on-surface"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sort Options */}
            <select
              value={sortOption}
              onChange={(e) => { setSortOption(e.target.value); setPage(1); }}
              className="px-4 py-2 border rounded-lg text-[14px] font-medium transition-colors bg-surface-container-lowest border-outline-variant text-on-surface"
            >
              <option value="-date">Newest First</option>
              <option value="date">Oldest First</option>
              <option value="-amount">Amount (High to Low)</option>
              <option value="amount">Amount (Low to High)</option>
            </select>

            {/* Category — real dropdown, not alert() */}
            <select
              value={activeCategory || ''}
              onChange={(e) => { setActiveCategory(e.target.value || null); setPage(1); }}
              className={`px-4 py-2 border rounded-lg text-[14px] font-medium transition-colors ${
                activeCategory
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-lowest border-outline-variant text-on-surface'
              }`}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Amount — real popover, not alert() */}
            <div className="relative">
              <button
                onClick={() => { setShowAmountPopover((p) => !p); setShowDatePopover(false); }}
                className={`flex items-center gap-1.5 px-4 py-2 border rounded-lg text-[14px] font-medium transition-colors whitespace-nowrap ${
                  minAmount || maxAmount
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <IndianRupee size={14} />
                Amount
              </button>
              {showAmountPopover && (
                <div className="absolute top-full mt-2 left-0 bg-surface-container-lowest border border-outline-variant rounded-xl card-shadow p-4 z-50 w-56 space-y-3">
                  <div>
                    <label className="text-[12px] font-medium text-on-surface-variant">Min ₹</label>
                    <input
                      type="number"
                      min="0"
                      value={minAmount}
                      onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
                      className="w-full mt-1 px-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-[14px] text-on-surface"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-on-surface-variant">Max ₹</label>
                    <input
                      type="number"
                      min="0"
                      value={maxAmount}
                      onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }}
                      className="w-full mt-1 px-3 py-1.5 bg-surface-container-low border border-outline-variant rounded-lg text-[14px] text-on-surface"
                      placeholder="No limit"
                    />
                  </div>
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 px-3 py-2 text-[14px] font-medium text-error hover:underline whitespace-nowrap"
              >
                <X size={14} />
                Clear filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              Add Transaction
            </Button>
            <div className="relative" ref={exportRef}>
              <Button variant="secondary" size="sm" onClick={() => setShowExportMenu((p) => !p)}>
                <Download size={16} /> Export
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-surface-container-lowest border border-outline-variant rounded-xl card-shadow z-50 overflow-hidden">
                  <button onClick={() => { handleExportPDF(); setShowExportMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-[14px] text-on-surface hover:bg-surface-container-low text-left">
                    <FileText size={15} /> PDF
                  </button>
                  <button onClick={() => { handleExport(); setShowExportMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-[14px] text-on-surface hover:bg-surface-container-low text-left">
                    <File size={15} /> CSV
                  </button>
                  <button onClick={() => { handleExportExcel(); setShowExportMenu(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-[14px] text-on-surface hover:bg-surface-container-low text-left">
                    <FileSpreadsheet size={15} /> Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden card-shadow">
          {loading ? (
            <LoadingState count={LIMIT} type="table" />
          ) : filteredTransactions.length === 0 ? (
            <EmptyState
              title="No transactions found"
              description="No transactions match your current filters. Try adjusting your date range, amount, or search."
              actionLabel="Clear all filters"
              onAction={clearAllFilters}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant">
                      <th className="px-6 py-3 text-[14px] font-medium text-on-surface-variant uppercase tracking-wider text-[11px]">Merchant</th>
                      <th className="px-6 py-3 text-[14px] font-medium text-on-surface-variant uppercase tracking-wider text-[11px]">Category</th>
                      <th className="px-6 py-3 text-[14px] font-medium text-on-surface-variant uppercase tracking-wider text-[11px]">Date</th>
                      <th className="px-6 py-3 text-[14px] font-medium text-on-surface-variant uppercase tracking-wider text-[11px] text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {filteredTransactions.map((t) => (
                      <TransactionRow key={t._id} transaction={t} onDeleteSuccess={fetchTransactions} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-4 bg-surface-container-low flex items-center justify-between border-t border-outline-variant">
                <p className="text-[14px] font-medium text-on-surface-variant">
                  Showing {(page - 1) * LIMIT + 1} to {Math.min(page * LIMIT, totalCount)} of {totalCount} results
                </p>
                <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
              </div>
            </>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddTransactionModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); fetchTransactions(); }}
        />
      )}
    </>
  );
}
