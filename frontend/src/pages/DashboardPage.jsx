import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiErrorMessage } from '../api/client';
import { formatCurrency, formatDate } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

function SummaryCard({ label, value, tone = 'default', hint }) {
  const toneClass =
    tone === 'positive'
      ? 'text-teal-700 dark:text-emerald-400'
      : tone === 'negative'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-slate-900 dark:text-slate-100';
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-sand-200 dark:border-slate-800 card-hover transition-all">
      <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 font-bold">{label}</p>
      <p className={`text-3xl font-extrabold ${toneClass}`}>{value}</p>
      {hint && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-sand-100">
      <td className="px-3 py-3"><div className="h-3 w-16 rounded bg-sand-100 animate-pulse" /></td>
      <td className="px-3 py-3"><div className="h-3 w-32 rounded bg-sand-100 animate-pulse" /></td>
      <td className="px-3 py-3"><div className="h-3 w-20 rounded bg-sand-100 animate-pulse" /></td>
      <td className="px-3 py-3 text-right"><div className="ml-auto h-3 w-20 rounded bg-sand-100 animate-pulse" /></td>
    </tr>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { currency: globalCurrency } = useSettings();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryRes, txRes] = await Promise.all([
        api.get('/dashboard/summary', { params: { currency: globalCurrency } }),
        api.get('/transactions', { params: { size: 10, page: 0 } }),
      ]);
      setSummary(summaryRes.data);
      setTransactions(txRes.data?.content ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load your dashboard.'));
    } finally {
      setLoading(false);
    }
  }, [globalCurrency]);

  useEffect(() => {
    load();
    const handleCreated = () => load();
    window.addEventListener('transaction-created', handleCreated);
    return () => window.removeEventListener('transaction-created', handleCreated);
  }, [load]);

  const currency = summary?.currency || globalCurrency || 'USD';

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Signed in as {user?.username}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-sand-100 transition disabled:opacity-60"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p>{error}</p>
          <button onClick={load} className="mt-2 font-medium underline">Try again</button>
        </div>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Financial summary">
        <SummaryCard
          label="Income"
          value={loading && !summary ? '—' : formatCurrency(summary?.totalIncome, currency)}
          tone="positive"
          hint="Selected period"
        />
        <SummaryCard
          label="Expenses"
          value={loading && !summary ? '—' : formatCurrency(summary?.totalExpenses, currency)}
          tone="negative"
          hint="Selected period"
        />
        <SummaryCard
          label="Net cash flow"
          value={loading && !summary ? '—' : formatCurrency(summary?.netCashFlow, currency)}
          tone={Number(summary?.netCashFlow) >= 0 ? 'positive' : 'negative'}
          hint="Income minus expenses"
        />
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-sand-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-sand-200">
          <h2 className="font-semibold">Recent transactions</h2>
          <Link to="/transactions" className="text-sm text-teal-700 font-medium hover:underline">
            View all
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <caption className="sr-only">Most recent transactions</caption>
            <thead className="text-xs uppercase text-gray-400 bg-sand-50">
              <tr>
                <th scope="col" className="px-6 py-2.5">Date</th>
                <th scope="col" className="px-3 py-2.5">Description</th>
                <th scope="col" className="px-3 py-2.5">Category</th>
                <th scope="col" className="px-6 py-2.5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading && transactions.length === 0 && (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              )}
              {!loading && !error && transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    No transactions yet. Add your first one to see it here.
                  </td>
                </tr>
              )}
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-sand-100 last:border-0">
                  <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{formatDate(tx.transactionDate)}</td>
                  <td className="px-3 py-3">{tx.description || tx.merchant || '—'}</td>
                  <td className="px-3 py-3">
                    {tx.category?.name ? (
                      <span className="bg-teal-50 text-teal-900 px-2 py-0.5 rounded-full text-xs">
                        {tx.category.name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Uncategorised</span>
                    )}
                  </td>
                  <td
                    className={`px-6 py-3 text-right font-medium whitespace-nowrap ${
                      tx.type === 'INCOME' ? 'text-teal-900' : 'text-rose-600'
                    }`}
                  >
                    {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '−' : ''}
                    {formatCurrency(tx.amount, tx.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
