import { useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../api/client';
import { useSettings } from '../context/SettingsContext';
import { todayISO } from '../utils/format';

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

export default function QuickAddTransactionModal({ isOpen, onClose, onSuccess }) {
  const { currency: defaultCurrency } = useSettings();
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    type: 'EXPENSE',
    description: '',
    merchant: '',
    amount: '',
    currency: defaultCurrency || 'USD',
    transactionDate: todayISO(),
    categoryId: '',
    notes: '',
  });

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

  useEffect(() => {
    if (isOpen) {
      setError('');
      setForm((prev) => ({
        ...prev,
        currency: defaultCurrency || 'USD',
        transactionDate: todayISO(),
      }));
      api
        .get('/categories')
        .then(({ data }) => setCategories(data ?? []))
        .catch(() => setCategories([]));
    }
  }, [isOpen, defaultCurrency]);

  if (!isOpen) return null;

  function updateField(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        type: form.type,
        description: form.description.trim() || undefined,
        merchant: form.merchant.trim() || undefined,
        amount: Number(form.amount),
        currency: (form.currency || 'USD').toUpperCase().trim(),
        transactionDate: form.transactionDate,
        categoryId: form.categoryId ? Number(form.categoryId) : undefined,
        notes: form.notes.trim() || undefined,
      };
      await api.post('/transactions', payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create transaction.'));
    } finally {
      setSaving(false);
    }
  }

  const filteredCategories = categories.filter(
    (c) => !c.type || form.type === 'TRANSFER' || c.type === form.type
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-add-title"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 id="quick-add-title" className="text-lg font-bold tracking-tight">
              ⚡ Quick Add Transaction
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Record a new expense, income, or transfer
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            {['EXPENSE', 'INCOME', 'TRANSFER'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, type: t }))}
                className={`py-2 text-xs font-bold rounded-lg transition ${
                  form.type === t
                    ? t === 'INCOME'
                      ? 'bg-emerald-600 text-white shadow'
                      : t === 'EXPENSE'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-indigo-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-700'
                }`}
              >
                {t === 'EXPENSE' ? '📉 Expense' : t === 'INCOME' ? '📈 Income' : '🔄 Transfer'}
              </button>
            ))}
          </div>

          {/* Transaction Presets (Groceries, Shopping, Dining, etc.) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Quick Presets
              </span>
              <span className="text-[10px] text-slate-400">Tap to auto-fill</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {QUICK_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => selectPreset(preset)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 whitespace-nowrap transition"
                >
                  <span>{preset.icon}</span>
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="quick-amount" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount *
              </label>
              <input
                id="quick-amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={form.amount}
                onChange={updateField('amount')}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
            <div>
              <label htmlFor="quick-currency" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Currency
              </label>
              <input
                id="quick-currency"
                maxLength={3}
                value={form.currency}
                onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold uppercase text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="quick-merchant" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Merchant / Payee
              </label>
              <input
                id="quick-merchant"
                placeholder="e.g. Starbucks, Uber"
                value={form.merchant}
                onChange={updateField('merchant')}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
            <div>
              <label htmlFor="quick-category" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                id="quick-category"
                value={form.categoryId}
                onChange={updateField('categoryId')}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none"
              >
                <option value="">Uncategorised</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="quick-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date *
              </label>
              <input
                id="quick-date"
                type="date"
                required
                value={form.transactionDate}
                onChange={updateField('transactionDate')}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
            <div>
              <label htmlFor="quick-desc" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Description / Memo
              </label>
              <input
                id="quick-desc"
                placeholder="Brief description"
                value={form.description}
                onChange={updateField('description')}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 px-5 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
