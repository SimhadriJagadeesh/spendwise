import { useCallback, useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../api/client';
import ExportCsvButton from '../components/ExportCsvButton';
import { formatCurrency, formatDate, todayISO } from '../utils/format';
import { useSettings } from '../context/SettingsContext';

// A factory, not a constant: "today" has to be the user's own calendar day, and
// a module-level value would freeze the date at page load.
function emptyForm(defaultCurrency = 'USD') {
  return {
    type: 'EXPENSE',
    description: '',
    merchant: '',
    amount: '',
    currency: defaultCurrency,
    transactionDate: todayISO(),
    categoryId: '',
    notes: '',
  };
}

const QUICK_PRESETS = [
  { label: 'Groceries', icon: '🛒', type: 'EXPENSE', match: 'grocer' },
  { label: 'Shopping', icon: '🛍️', type: 'EXPENSE', match: 'shop' },
  { label: 'Dining', icon: '🍔', type: 'EXPENSE', match: 'din' },
  { label: 'Transport', icon: '🚗', type: 'EXPENSE', match: 'trans' },
  { label: 'Utilities', icon: '⚡', type: 'EXPENSE', match: 'util' },
  { label: 'Housing', icon: '🏠', type: 'EXPENSE', match: 'hous' },
  { label: 'Entertainment', icon: '🎬', type: 'EXPENSE', match: 'entertain' },
  { label: 'Healthcare', icon: '💊', type: 'EXPENSE', match: 'health' },
  { label: 'Salary', icon: '💼', type: 'INCOME', match: 'salar' },
  { label: 'Freelance', icon: '💻', type: 'INCOME', match: 'free' },
  { label: 'Investments', icon: '📈', type: 'INCOME', match: 'invest' },
];

export default function TransactionsPage() {
  const { currency: globalCurrency } = useSettings();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState({ type: '', currency: '', search: '', from: '', to: '' });
  const [form, setForm] = useState(() => emptyForm(globalCurrency));
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, size: 20 };
      if (filters.type) params.type = filters.type;
      if (filters.currency) params.currency = filters.currency;
      if (filters.search) params.search = filters.search;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const { data } = await api.get('/transactions', { params });
      setTransactions(data?.content ?? []);
      setTotalPages(data?.totalPages ?? 0);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load transactions.'));
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    load();
    const handleCreated = () => load();
    window.addEventListener('transaction-created', handleCreated);
    return () => window.removeEventListener('transaction-created', handleCreated);
  }, [load]);

  useEffect(() => {
    api
      .get('/categories')
      .then(({ data }) => setCategories(data ?? []))
      .catch(() => setCategories([]));
  }, []);

  function updateFilter(field) {
    return (event) => {
      setPage(0);
      setFilters((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  function updateForm(field) {
    return (event) => {
      const val = event.target.value;
      setForm((prev) => {
        const next = { ...prev, [field]: val };
        if (field === 'type' && next.categoryId) {
          const cat = categories.find((c) => String(c.id) === String(next.categoryId));
          if (cat && cat.type && val !== 'TRANSFER' && cat.type !== val) {
            next.categoryId = '';
          }
        }
        return next;
      });
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        currency: (form.currency || 'USD').toUpperCase(),
        categoryId: form.categoryId ? Number(form.categoryId) : null,
      };
      if (editingId) {
        await api.put(`/transactions/${editingId}`, payload);
        setNotice('Transaction updated.');
      } else {
        await api.post('/transactions', payload);
        setNotice('Transaction added.');
      }
      setForm(emptyForm(globalCurrency));
      setEditingId(null);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the transaction.'));
    } finally {
      setSaving(false);
    }
  }

  function selectPreset(preset) {
    const matchedCat = categories.find((c) =>
      c.name.toLowerCase().includes(preset.match)
    );
    setForm((prev) => ({
      ...prev,
      type: preset.type,
      categoryId: matchedCat ? String(matchedCat.id) : prev.categoryId,
      description: prev.description || preset.label,
    }));
  }

  function startEdit(tx) {
    setEditingId(tx.id);
    setForm({
      type: tx.type,
      description: tx.description ?? '',
      merchant: tx.merchant ?? '',
      amount: String(tx.amount ?? ''),
      currency: tx.currency ?? 'USD',
      transactionDate: tx.transactionDate ?? todayISO(),
      categoryId: tx.category?.id ?? '',
      notes: tx.notes ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id) {
    setError('');
    try {
      await api.delete(`/transactions/${id}`);
      setNotice('Transaction deleted.');
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete the transaction.'));
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-gray-500 mt-1">Record and review your income and expenses.</p>
        </div>
        <ExportCsvButton currency={filters.currency} from={filters.from} to={filters.to} />
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          {notice}
        </div>
      )}

      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-sand-200 dark:border-slate-800 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">{editingId ? 'Edit transaction' : 'Add transaction'}</h2>
          {!editingId && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ⚡ Quick presets: Tap to auto-select type & category
            </span>
          )}
        </div>

        {!editingId && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 border-b border-sand-200 dark:border-slate-800 scrollbar-thin">
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => selectPreset(preset)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-sand-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-sand-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 whitespace-nowrap transition"
              >
                <span>{preset.icon}</span>
                <span>{preset.label}</span>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" noValidate>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
            <select id="type" value={form.type} onChange={updateForm('type')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm bg-white">
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <input id="description" value={form.description} onChange={updateForm('description')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="merchant" className="block text-sm font-medium text-gray-700 mb-1.5">Merchant</label>
            <input id="merchant" value={form.merchant} onChange={updateForm('merchant')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
            <input id="amount" type="number" step="0.0001" min="0.0001" required value={form.amount}
              onChange={updateForm('amount')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
            <input id="currency" maxLength={3} value={form.currency} onChange={updateForm('currency')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm uppercase" />
          </div>
          <div>
            <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
            <input id="transactionDate" type="date" required value={form.transactionDate}
              onChange={updateForm('transactionDate')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select id="categoryId" value={form.categoryId} onChange={updateForm('categoryId')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm bg-white">
              <option value="">Uncategorised</option>
              {categories
                .filter((c) => !c.type || form.type === 'TRANSFER' || c.type === form.type)
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <input id="notes" value={form.notes} onChange={updateForm('notes')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" disabled={saving}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-teal-600/20 hover:bg-teal-900 transition disabled:opacity-60">
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add transaction'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm(globalCurrency)); }}
                className="rounded-lg border border-sand-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-sand-100">
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-sand-200 p-6">
        <h2 className="font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label htmlFor="filterType" className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
            <select id="filterType" value={filters.type} onChange={updateFilter('type')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm bg-white">
              <option value="">All types</option>
              <option value="INCOME">Income</option>
              <option value="EXPENSE">Expense</option>
              <option value="TRANSFER">Transfer</option>
            </select>
          </div>
          <div>
            <label htmlFor="filterCurrency" className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
            <input id="filterCurrency" maxLength={3} placeholder="Any" value={filters.currency}
              onChange={updateFilter('currency')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm uppercase" />
          </div>
          <div>
            <label htmlFor="filterSearch" className="block text-sm font-medium text-gray-700 mb-1.5">Search</label>
            <input id="filterSearch" value={filters.search} onChange={updateFilter('search')}
              placeholder="Description or merchant"
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="filterFrom" className="block text-sm font-medium text-gray-700 mb-1.5">From</label>
            <input id="filterFrom" type="date" value={filters.from} onChange={updateFilter('from')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="filterTo" className="block text-sm font-medium text-gray-700 mb-1.5">To</label>
            <input id="filterTo" type="date" value={filters.to} onChange={updateFilter('to')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-sand-200 overflow-hidden">
        <h2 className="font-semibold px-6 py-4 border-b border-sand-200">History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <caption className="sr-only">Transaction history</caption>
            <thead className="text-xs uppercase text-gray-400 bg-sand-50">
              <tr>
                <th scope="col" className="px-6 py-2.5">Date</th>
                <th scope="col" className="px-3 py-2.5">Description</th>
                <th scope="col" className="px-3 py-2.5">Category</th>
                <th scope="col" className="px-3 py-2.5 text-right">Amount</th>
                <th scope="col" className="px-6 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && transactions.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-400">Loading…</td></tr>
              )}
              {!loading && transactions.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  No transactions match these filters.
                </td></tr>
              )}
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-sand-100 last:border-0">
                  <td className="px-6 py-3 text-gray-500 whitespace-nowrap">{formatDate(tx.transactionDate)}</td>
                  <td className="px-3 py-3">
                    {tx.description || tx.merchant || '—'}
                    {tx.merchant && tx.description ? (
                      <span className="block text-xs text-gray-400">{tx.merchant}</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    {tx.category?.name ? (
                      <span className="bg-teal-50 text-teal-900 px-2 py-0.5 rounded-full text-xs">{tx.category.name}</span>
                    ) : (
                      <span className="text-xs text-gray-400">Uncategorised</span>
                    )}
                  </td>
                  <td className={`px-3 py-3 text-right font-medium whitespace-nowrap ${
                    tx.type === 'INCOME' ? 'text-teal-900' : 'text-rose-600'}`}>
                    {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '−' : ''}
                    {formatCurrency(tx.amount, tx.currency)}
                  </td>
                  <td className="px-6 py-3 text-right whitespace-nowrap">
                    <button onClick={() => startEdit(tx)}
                      className="text-sm text-teal-700 font-medium hover:underline">Edit</button>
                    <button onClick={() => handleDelete(tx.id)}
                      className="ml-3 text-sm text-rose-600 font-medium hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-sand-200">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="rounded-lg border border-sand-200 px-3 py-1.5 text-sm font-medium text-gray-600 disabled:opacity-40">
              Previous
            </button>
            <span className="text-xs text-gray-500">Page {page + 1} of {totalPages}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page + 1 >= totalPages}
              className="rounded-lg border border-sand-200 px-3 py-1.5 text-sm font-medium text-gray-600 disabled:opacity-40">
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
