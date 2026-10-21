import { useCallback, useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../api/client';
import { formatCurrency, formatDate, todayISO } from '../utils/format';
import { useSettings } from '../context/SettingsContext';

const emptyRecurringForm = (currency = 'USD') => ({
  name: '',
  type: 'EXPENSE',
  amount: '',
  currency: currency || 'USD',
  frequency: 'MONTHLY',
  intervalCount: '1',
  nextPaymentDate: todayISO(),
  categoryId: '',
});

const FREQUENCY_LABELS = {
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
};

export default function RecurringPage() {
  const { currency: globalCurrency } = useSettings();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(() => emptyRecurringForm(globalCurrency));
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/recurring');
      setItems(data ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load recurring payments.'));
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
      .then(({ data }) => setCategories(data ?? []))
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
        frequency: (form.frequency || 'MONTHLY').toUpperCase(),
        intervalCount: Number(form.intervalCount) || 1,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
      };
      if (editingId) {
        await api.put(`/recurring/${editingId}`, payload);
        setNotice('Recurring payment updated.');
      } else {
        await api.post('/recurring', payload);
        setNotice('Recurring payment created.');
      }
      setForm(emptyRecurringForm(globalCurrency));
      setEditingId(null);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the recurring payment.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await api.delete(`/recurring/${id}`);
      setNotice('Recurring payment deleted.');
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete the recurring payment.'));
    }
  }

  async function handleAdvance(id) {
    setError('');
    try {
      await api.post(`/recurring/${id}/advance`);
      setNotice('Next payment date moved forward.');
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not advance the schedule.'));
    }
  }

  async function handleToggleActive(item) {
    setError('');
    try {
      // axios.patch(url, data, config) - the query parameter belongs in the config.
      await api.patch(`/recurring/${item.id}/active`, null, { params: { active: !item.active } });
      setNotice(item.active ? 'Schedule paused.' : 'Schedule resumed.');
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update the schedule.'));
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Recurring payments</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track bills and salaries you expect repeatedly. A schedule never creates a transaction on its own.
        </p>
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

      <section className="bg-white rounded-2xl shadow-sm border border-sand-200 p-6">
        <h2 className="font-semibold mb-4">{editingId ? 'Edit schedule' : 'New schedule'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end" noValidate>
          <div>
            <label htmlFor="recurringName" className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input id="recurringName" required value={form.name} onChange={update('name')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="recurringType" className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
            <select id="recurringType" value={form.type} onChange={update('type')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm bg-white">
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </div>
          <div>
            <label htmlFor="recurringAmount" className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
            <input id="recurringAmount" type="number" step="0.01" min="0.01" required value={form.amount}
              onChange={update('amount')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="recurringCurrency" className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
            <input id="recurringCurrency" maxLength={3} value={form.currency} onChange={update('currency')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm uppercase" />
          </div>
          <div>
            <label htmlFor="recurringFrequency" className="block text-sm font-medium text-gray-700 mb-1.5">Frequency</label>
            <select id="recurringFrequency" value={form.frequency} onChange={update('frequency')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm bg-white">
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>
          <div>
            <label htmlFor="recurringInterval" className="block text-sm font-medium text-gray-700 mb-1.5">Every</label>
            <input id="recurringInterval" type="number" min="1" max="52" value={form.intervalCount}
              onChange={update('intervalCount')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="recurringNextDate" className="block text-sm font-medium text-gray-700 mb-1.5">Next payment date</label>
            <input id="recurringNextDate" type="date" required value={form.nextPaymentDate}
              onChange={update('nextPaymentDate')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="recurringCategory" className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <select id="recurringCategory" value={form.categoryId} onChange={update('categoryId')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm bg-white">
              <option value="">Uncategorised</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2">
            <button type="submit" disabled={saving}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-teal-600/20 hover:bg-teal-900 transition disabled:opacity-60">
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create schedule'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(emptyRecurringForm(globalCurrency)); }}
                className="rounded-lg border border-sand-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-sand-100">
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {loading && items.length === 0 && <p className="text-sm text-gray-400">Loading schedules…</p>}

      {!loading && items.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-sand-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">No recurring payments yet. Add one above to keep track of it.</p>
        </div>
      )}

      {items.length > 0 && (
        <section className="bg-white rounded-2xl shadow-sm border border-sand-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <caption className="sr-only">Recurring payment schedules</caption>
              <thead className="text-xs uppercase text-gray-400 bg-sand-50">
                <tr>
                  <th scope="col" className="px-6 py-2.5">Name</th>
                  <th scope="col" className="px-3 py-2.5">Schedule</th>
                  <th scope="col" className="px-3 py-2.5">Next payment</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Amount</th>
                  <th scope="col" className="px-6 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-sand-100 last:border-0">
                    <td className="px-6 py-3">
                      <span className="font-medium text-ink">{item.name}</span>
                      {item.categoryName ? (
                        <span className="block text-xs text-gray-400">{item.categoryName}</span>
                      ) : null}
                      {!item.active && (
                        <span className="block text-xs text-gray-400">Paused</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                      {FREQUENCY_LABELS[item.frequency] ?? item.frequency}
                      {Number(item.intervalCount) > 1 ? ` × ${item.intervalCount}` : ''}
                    </td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{formatDate(item.nextPaymentDate)}</td>
                    <td className={`px-3 py-3 text-right font-medium whitespace-nowrap ${
                      item.type === 'INCOME' ? 'text-teal-900' : 'text-rose-600'}`}>
                      {item.type === 'INCOME' ? '+' : '−'}
                      {formatCurrency(item.amount, item.currency)}
                    </td>
                    <td className="px-6 py-3 text-right whitespace-nowrap">
                      <button onClick={() => handleAdvance(item.id)}
                        className="text-sm text-teal-700 font-medium hover:underline">Advance</button>
                      <button onClick={() => handleToggleActive(item)}
                        className="ml-3 text-sm text-gray-600 font-medium hover:underline">
                        {item.active ? 'Pause' : 'Resume'}
                      </button>
                      <button onClick={() => {
                        setEditingId(item.id);
                        setForm({
                          name: item.name ?? '',
                          type: item.type ?? 'EXPENSE',
                          amount: String(item.amount ?? ''),
                          currency: item.currency ?? 'USD',
                          frequency: item.frequency ?? 'MONTHLY',
                          intervalCount: String(item.intervalCount ?? 1),
                          nextPaymentDate: item.nextPaymentDate ?? EMPTY.nextPaymentDate,
                          categoryId: item.categoryId ?? '',
                        });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }} className="ml-3 text-sm text-teal-700 font-medium hover:underline">Edit</button>
                      <button onClick={() => handleDelete(item.id)}
                        className="ml-3 text-sm text-rose-600 font-medium hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
