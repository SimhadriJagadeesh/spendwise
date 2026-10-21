import { useCallback, useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../api/client';
import { formatCurrency, formatPercent, currentMonthISO } from '../utils/format';
import { useSettings } from '../context/SettingsContext';

const STATUS_STYLES = {
  ON_TRACK: 'bg-teal-50 text-teal-900 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border dark:border-emerald-800/60',
  WARNING: 'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 dark:border dark:border-amber-800/60',
  OVER_BUDGET: 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 dark:border dark:border-rose-800/60',
};

const emptyBudgetForm = (currency = 'USD') => ({
  categoryId: '',
  period: 'MONTHLY',
  month: currentMonthISO(),
  amount: '',
  currency: currency || 'USD',
});

export default function BudgetsPage() {
  const { currency: globalCurrency } = useSettings();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(() => emptyBudgetForm(globalCurrency));
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/budgets');
      setBudgets(data ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load budgets.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api
      .get('/categories')
      .then(({ data }) => setCategories((data ?? []).filter((c) => c.type === 'EXPENSE')))
      .catch(() => setCategories([]));
  }, []);

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
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
        month: form.month || null,
      };
      if (editingId) {
        await api.put(`/budgets/${editingId}`, payload);
        setNotice('Budget updated.');
      } else {
        await api.post('/budgets', payload);
        setNotice('Budget created.');
      }
      setForm(emptyBudgetForm(globalCurrency));
      setEditingId(null);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the budget.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await api.delete(`/budgets/${id}`);
      setNotice('Budget deleted.');
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete the budget.'));
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Budgets</h1>
        <p className="text-sm text-gray-500 mt-1">
          Spending counts EXPENSE transactions only. Transfers are excluded.
        </p>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}
      {notice && (
        <div role="status" className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">{notice}</div>
      )}

      <section className="bg-white rounded-2xl shadow-sm border border-sand-200 p-6">
        <h2 className="font-semibold mb-4">{editingId ? 'Edit budget' : 'New budget'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end" noValidate>
          <div>
            <label htmlFor="budgetCategory" className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select id="budgetCategory" value={form.categoryId} onChange={update('categoryId')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm bg-white">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="budgetPeriod" className="block text-sm font-medium text-gray-700 mb-1.5">Period</label>
            <select id="budgetPeriod" value={form.period} onChange={update('period')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm bg-white">
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>
          <div>
            <label htmlFor="budgetMonth" className="block text-sm font-medium text-gray-700 mb-1.5">Month</label>
            <input id="budgetMonth" type="month" value={form.month} onChange={update('month')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="budgetAmount" className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
            <input id="budgetAmount" type="number" step="0.01" min="0.01" required value={form.amount}
              onChange={update('amount')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="budgetCurrency" className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
            <input id="budgetCurrency" maxLength={3} value={form.currency} onChange={update('currency')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm uppercase" />
          </div>
          <div className="sm:col-span-2 lg:col-span-5 flex items-center gap-2">
            <button type="submit" disabled={saving}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-teal-600/20 hover:bg-teal-900 transition disabled:opacity-60">
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create budget'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(emptyBudgetForm(globalCurrency)); }}
                className="rounded-lg border border-sand-200 px-4 py-2 text-sm font-medium text-gray-600">Cancel</button>
            )}
          </div>
        </form>
      </section>

      {loading && budgets.length === 0 && (
        <p className="text-sm text-gray-400">Loading budgets…</p>
      )}

      {!loading && budgets.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-sand-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">No budgets yet. Create one above to start tracking a limit.</p>
        </div>
      )}

      {budgets.length > 0 && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {budgets.map((b) => {
            const pct = Math.min(Number(b.percentUsed ?? 0), 100);
            return (
              <article key={b.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-sand-200 dark:border-slate-800 p-6 card-hover">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold">{b.categoryName || 'All categories'}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {b.period === 'YEARLY' ? `Year ${b.month?.slice(0, 4)}` : b.month}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[b.status] ?? ''}`}>
                    {b.status === 'ON_TRACK' ? 'On track' : b.status === 'WARNING' ? 'Near limit' : 'Over budget'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-bold text-ink">{formatCurrency(b.amount, b.currency)}</span>
                  <span className="text-sm text-gray-500">{formatPercent(b.percentUsed)} used</span>
                </div>

                <div className="h-2 rounded-full bg-sand-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      b.status === 'OVER_BUDGET' ? 'bg-rose-500' : b.status === 'WARNING' ? 'bg-amber-500' : 'bg-teal-600'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-gray-400">Spent</dt>
                    <dd className="font-medium text-ink">{formatCurrency(b.spent, b.currency)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400">Remaining</dt>
                    <dd className={`font-medium ${Number(b.remaining) < 0 ? 'text-rose-600' : 'text-ink'}`}>
                      {formatCurrency(b.remaining, b.currency)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex justify-end gap-3">
                  <button onClick={() => {
                    setEditingId(b.id);
                    setForm({
                      categoryId: b.categoryId ?? '',
                      period: b.period,
                      month: b.month ?? EMPTY.month,
                      amount: String(b.amount ?? ''),
                      currency: b.currency ?? 'USD',
                    });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} className="text-sm text-teal-700 font-medium hover:underline">Edit</button>
                  <button onClick={() => handleDelete(b.id)} className="text-sm text-rose-600 font-medium hover:underline">Delete</button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
