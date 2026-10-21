import { useCallback, useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../api/client';
import { formatCurrency, formatDate, formatPercent, todayISO } from '../utils/format';
import { useSettings } from '../context/SettingsContext';

const emptyGoalForm = (currency = 'USD') => ({
  name: '',
  targetAmount: '',
  currency: currency || 'USD',
  deadline: '',
});

const EMPTY_CONTRIBUTION = {
  goalId: '',
  amount: '',
  contributionDate: todayISO(),
  notes: '',
};

export default function GoalsPage() {
  const { currency: globalCurrency } = useSettings();
  const [goals, setGoals] = useState([]);
  const [form, setForm] = useState(() => emptyGoalForm(globalCurrency));
  const [editingId, setEditingId] = useState(null);
  const [contribution, setContribution] = useState(EMPTY_CONTRIBUTION);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/goals');
      setGoals(data ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load savings goals.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function updateContribution(field) {
    return (event) =>
      setContribution((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        targetAmount: Number(form.targetAmount),
        currency: (form.currency || 'USD').toUpperCase(),
        deadline: form.deadline || null,
      };
      if (editingId) {
        await api.put(`/goals/${editingId}`, payload);
        setNotice('Goal updated.');
      } else {
        await api.post('/goals', payload);
        setNotice('Goal created.');
      }
      setForm(emptyGoalForm(globalCurrency));
      setEditingId(null);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the goal.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await api.delete(`/goals/${id}`);
      setNotice('Goal deleted.');
      // The select stores its value as a string, so compare as strings.
      if (String(contribution.goalId) === String(id)) {
        setContributions([]);
        setContribution((prev) => ({ ...prev, goalId: '' }));
      }
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete the goal.'));
    }
  }

  async function openContributions(goalId) {
    setError('');
    setNotice('');
    setContribution((prev) => ({ ...prev, goalId: String(goalId) }));
    try {
      const { data } = await api.get(`/goals/${goalId}/contributions`);
      setContributions(data ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load contributions.'));
      setContributions([]);
    }
  }

  function currencyOfGoal(goalId) {
    const goal = goals.find((g) => String(g.id) === String(goalId));
    return goal?.currency || 'USD';
  }

  async function handleContribution(event) {
    event.preventDefault();
    if (!contribution.goalId) return;
    setError('');
    setNotice('');
    setSaving(true);
    try {
      await api.post(`/goals/${contribution.goalId}/contributions`, {
        amount: Number(contribution.amount),
        contributionDate: contribution.contributionDate,
        notes: contribution.notes || null,
      });
      setNotice('Contribution recorded.');
      setContribution((prev) => ({ ...prev, amount: '', notes: '' }));
      const { data } = await api.get(`/goals/${contribution.goalId}/contributions`);
      setContributions(data ?? []);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not record the contribution.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Savings goals</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track what you are saving towards and record every contribution.
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
        <h2 className="font-semibold mb-4">{editingId ? 'Edit goal' : 'New goal'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end" noValidate>
          <div>
            <label htmlFor="goalName" className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input id="goalName" required value={form.name} onChange={update('name')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="goalTarget" className="block text-sm font-medium text-gray-700 mb-1.5">Target amount</label>
            <input id="goalTarget" type="number" step="0.01" min="0.01" required value={form.targetAmount}
              onChange={update('targetAmount')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="goalCurrency" className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
            <input id="goalCurrency" maxLength={3} value={form.currency} onChange={update('currency')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm uppercase" />
          </div>
          <div>
            <label htmlFor="goalDeadline" className="block text-sm font-medium text-gray-700 mb-1.5">Deadline</label>
            <input id="goalDeadline" type="date" value={form.deadline} onChange={update('deadline')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-2">
            <button type="submit" disabled={saving}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-teal-600/20 hover:bg-teal-900 transition disabled:opacity-60">
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create goal'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(emptyGoalForm(globalCurrency)); }}
                className="rounded-lg border border-sand-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-sand-100">
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-sand-200 p-6">
        <h2 className="font-semibold mb-4">Record a contribution</h2>
        <form onSubmit={handleContribution} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end" noValidate>
          <div>
            <label htmlFor="contributionGoal" className="block text-sm font-medium text-gray-700 mb-1.5">Goal</label>
            <select id="contributionGoal" value={contribution.goalId} onChange={updateContribution('goalId')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm bg-white">
              <option value="">Select a goal</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="contributionAmount" className="block text-sm font-medium text-gray-700 mb-1.5">Amount</label>
            <input id="contributionAmount" type="number" step="0.01" min="0.01" required value={contribution.amount}
              onChange={updateContribution('amount')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="contributionDate" className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
            <input id="contributionDate" type="date" required value={contribution.contributionDate}
              onChange={updateContribution('contributionDate')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="contributionNotes" className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <input id="contributionNotes" value={contribution.notes} onChange={updateContribution('notes')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <button type="submit" disabled={saving || !contribution.goalId}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-teal-600/20 hover:bg-teal-900 transition disabled:opacity-60">
              {saving ? 'Saving…' : 'Add contribution'}
            </button>
          </div>
        </form>

        {contribution.goalId && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Contribution history</h3>
            {contributions.length === 0 ? (
              <p className="text-sm text-gray-400">No contributions recorded for this goal yet.</p>
            ) : (
              <ul className="divide-y divide-sand-100">
                {contributions.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-gray-600">
                      {formatDate(c.contributionDate)}
                      {c.notes ? <span className="text-gray-400"> — {c.notes}</span> : null}
                    </span>
                    <span className="font-medium text-teal-900">
                      {formatCurrency(c.amount, currencyOfGoal(contribution.goalId))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {loading && goals.length === 0 && <p className="text-sm text-gray-400">Loading goals…</p>}

      {!loading && goals.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-sand-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">No savings goals yet. Create one above to start tracking progress.</p>
        </div>
      )}

      {goals.length > 0 && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {goals.map((g) => {
            const pct = Math.min(Number(g.percentComplete ?? 0), 100);
            return (
              <article key={g.id} className="bg-white rounded-2xl shadow-sm border border-sand-200 p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold">{g.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {g.deadline ? `Deadline ${formatDate(g.deadline)}` : 'No deadline'}
                    </p>
                  </div>
                  {g.completed && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-900">Reached</span>
                  )}
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-bold text-ink">{formatCurrency(g.currentAmount, g.currency)}</span>
                  <span className="text-sm text-gray-500">
                    of {formatCurrency(g.targetAmount, g.currency)}
                  </span>
                </div>

                <div className="h-2 rounded-full bg-sand-100 overflow-hidden">
                  <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${pct}%` }} />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-gray-400">Progress</dt>
                    <dd className="font-medium text-ink">{formatPercent(g.percentComplete)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400">Remaining</dt>
                    <dd className={`font-medium ${Number(g.remaining) < 0 ? 'text-rose-600' : 'text-ink'}`}>
                      {formatCurrency(g.remaining, g.currency)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 flex justify-end gap-3">
                  <button onClick={() => openContributions(g.id)}
                    className="text-sm text-teal-700 font-medium hover:underline">Contributions</button>
                  <button onClick={() => {
                    setEditingId(g.id);
                    setForm({
                      name: g.name ?? '',
                      targetAmount: String(g.targetAmount ?? ''),
                      currency: g.currency ?? 'USD',
                      deadline: g.deadline ?? '',
                    });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }} className="text-sm text-teal-700 font-medium hover:underline">Edit</button>
                  <button onClick={() => handleDelete(g.id)}
                    className="text-sm text-rose-600 font-medium hover:underline">Delete</button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
