import { useCallback, useEffect, useState } from 'react';
import api, { apiErrorMessage } from '../api/client';

const EMPTY = { name: '', type: 'EXPENSE', color: '#0D9488' };

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/categories');
      setCategories(data ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load categories.'));
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

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, form);
        setNotice('Category updated.');
      } else {
        await api.post('/categories', form);
        setNotice('Category created.');
      }
      setForm(EMPTY);
      setEditingId(null);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save the category.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await api.delete(`/categories/${id}`);
      setNotice('Category deleted.');
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete the category.'));
    }
  }

  const income = categories.filter((c) => c.type === 'INCOME');
  const expense = categories.filter((c) => c.type === 'EXPENSE');

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
        <p className="text-sm text-gray-500 mt-1">Organise your spending with income and expense categories.</p>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}
      {notice && (
        <div role="status" className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">{notice}</div>
      )}

      <section className="bg-white rounded-2xl shadow-sm border border-sand-200 p-6">
        <h2 className="font-semibold mb-4">{editingId ? 'Edit category' : 'New category'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end" noValidate>
          <div className="sm:col-span-2">
            <label htmlFor="catName" className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input id="catName" required value={form.name} onChange={update('name')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="catType" className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
            <select id="catType" value={form.type} onChange={update('type')}
              className="w-full rounded-lg border border-sand-200 px-3 py-2 text-sm bg-white">
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>
          </div>
          <div>
            <label htmlFor="catColor" className="block text-sm font-medium text-gray-700 mb-1.5">Colour</label>
            <input id="catColor" type="color" value={form.color} onChange={update('color')}
              className="w-full h-9 rounded-lg border border-sand-200 px-1 py-0.5 bg-white" />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" disabled={saving}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-teal-600/20 hover:bg-teal-900 transition disabled:opacity-60">
              {saving ? 'Saving…' : editingId ? 'Save' : 'Add'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY); }}
                className="rounded-lg border border-sand-200 px-4 py-2 text-sm font-medium text-gray-600">Cancel</button>
            )}
          </div>
        </form>
      </section>

      {loading && categories.length === 0 && (
        <p className="text-sm text-gray-400">Loading categories…</p>
      )}

      {!loading && categories.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-sand-200 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">No categories yet. Add your first one above.</p>
        </div>
      )}

      {[['Expense categories', expense], ['Income categories', income]].map(([title, items]) =>
        items.length > 0 ? (
          <section key={title} className="bg-white rounded-2xl shadow-sm border border-sand-200 overflow-hidden">
            <h2 className="font-semibold px-6 py-4 border-b border-sand-200">{title}</h2>
            <ul className="divide-y divide-sand-100">
              {items.map((c) => (
                <li key={c.id} className="px-6 py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span aria-hidden="true"
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: c.color || '#0D9488' }} />
                    <span className="truncate">{c.name}</span>
                  </div>
                  <div className="shrink-0">
                    <button onClick={() => { setEditingId(c.id); setForm({ name: c.name, type: c.type, color: c.color || '#0D9488' }); }}
                      className="text-sm text-teal-700 font-medium hover:underline">Edit</button>
                    <button onClick={() => handleDelete(c.id)}
                      className="ml-3 text-sm text-rose-600 font-medium hover:underline">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null
      )}
    </div>
  );
}
