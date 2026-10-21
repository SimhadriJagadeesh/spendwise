import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/format';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'transactions'
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Transaction search & filters
  const [txSearch, setTxSearch] = useState('');
  const [txType, setTxType] = useState('');

  // User inspection modal
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectUser, setInspectUser] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Pagination
  const [userPage, setUserPage] = useState(0);
  const [txPage, setTxPage] = useState(0);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/stats');
      setStats(data);
    } catch {
      // stats failure handled silently
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/users', { params: { page: userPage, size: 25 } });
      setUsers(data?.content ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load users. Make sure you are signed in as an Admin.'));
    } finally {
      setLoading(false);
    }
  }, [userPage]);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: txPage, size: 30 };
      if (txSearch) params.search = txSearch;
      if (txType) params.type = txType;
      const { data } = await api.get('/admin/transactions', { params });
      setTransactions(data?.content ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load platform transactions.'));
    } finally {
      setLoading(false);
    }
  }, [txPage, txSearch, txType]);

  useEffect(() => {
    loadStats();
    if (activeTab === 'users') {
      loadUsers();
    } else {
      loadTransactions();
    }
  }, [activeTab, loadStats, loadUsers, loadTransactions]);

  // Toggle user status (Enable / Disable)
  async function handleToggleStatus(userId) {
    setError('');
    setNotice('');
    try {
      await api.patch(`/admin/users/${userId}/toggle-status`);
      setNotice('User status updated successfully.');
      loadUsers();
      loadStats();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update user status.'));
    }
  }

  // Delete user
  async function handleDeleteUser(userId, username) {
    if (!window.confirm(`Are you sure you want to permanently delete user "${username}" and all their financial records?`)) {
      return;
    }
    setError('');
    setNotice('');
    try {
      await api.delete(`/admin/users/${userId}`);
      setNotice(`User "${username}" was permanently removed.`);
      loadUsers();
      loadStats();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete user.'));
    }
  }

  // Delete transaction
  async function handleDeleteTransaction(txId) {
    if (!window.confirm('Delete this transaction permanently from the database?')) {
      return;
    }
    setError('');
    setNotice('');
    try {
      await api.delete(`/admin/transactions/${txId}`);
      setNotice('Transaction deleted.');
      loadTransactions();
      loadStats();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete transaction.'));
    }
  }

  // Inspect user full data
  async function handleInspectUser(userId) {
    setInspectModalOpen(true);
    setInspectLoading(true);
    setInspectUser(null);
    try {
      const { data } = await api.get(`/admin/users/${userId}/details`);
      setInspectUser(data);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load user data records.'));
      setInspectModalOpen(false);
    } finally {
      setInspectLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Admin Header Banner */}
      <header className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-3xl shadow-lg shadow-amber-500/20">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight">Admin Command Center</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ROOT ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Full oversight & administrative access across all registered users and transactions. Signed in as <strong className="text-amber-400">{user?.email || 'sunnyroks@gmail.com'}</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 transition"
              title="Return to standard user dashboard"
            >
              ← User View
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-slate-300">Live Oversight</span>
            </div>
            <button
              onClick={() => { loadStats(); if (activeTab === 'users') loadUsers(); else loadTransactions(); }}
              className="rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-1.5 text-xs font-bold text-slate-200 transition"
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>

        {/* Global Statistics Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800">
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
              <p className="text-xl font-extrabold text-white mt-1">{stats.totalUsers}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Users</p>
              <p className="text-xl font-extrabold text-emerald-400 mt-1">{stats.activeUsers}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">All Transactions</p>
              <p className="text-xl font-extrabold text-teal-400 mt-1">{stats.totalTransactions}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">System Budgets</p>
              <p className="text-xl font-extrabold text-indigo-400 mt-1">{stats.totalBudgets}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Savings Goals</p>
              <p className="text-xl font-extrabold text-amber-400 mt-1">{stats.totalGoals}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Categories</p>
              <p className="text-xl font-extrabold text-purple-400 mt-1">{stats.totalCategories}</p>
            </div>
          </div>
        )}
      </header>

      {/* Notifications & Error Banners */}
      {error && (
        <div role="alert" className="rounded-2xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs font-semibold text-rose-700 dark:text-rose-400 shadow-sm">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-2xl border border-emerald-300 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 shadow-sm">
          {notice}
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-200/60 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition ${
            activeTab === 'users'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          👥 User Accounts ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition ${
            activeTab === 'transactions'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          💳 Platform Transactions
        </button>
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Registered Platform Users</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Inspect records, enable/disable access, or manage individual accounts.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">ID</th>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions & Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 text-xs font-bold text-slate-400">#{u.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-emerald-950/60 text-teal-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center uppercase">
                          {u.username?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{u.username}</p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'ADMIN'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        u.enabled
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.enabled ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{u.enabled ? 'Active' : 'Disabled'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleInspectUser(u.id)}
                          className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-emerald-950/40 text-teal-700 dark:text-emerald-300 hover:bg-teal-100 border border-teal-200 dark:border-emerald-800/60 text-xs font-bold transition"
                        >
                          🔍 Inspect Everything
                        </button>
                        {u.role !== 'ADMIN' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(u.id)}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 transition"
                            >
                              {u.enabled ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              className="px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold text-rose-600 dark:text-rose-400 transition"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-xs text-slate-400">
                      {loading ? 'Loading registered users…' : 'No users found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* User Pagination Controls */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Page {userPage + 1} {loading && '• Loading…'}</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={userPage === 0}
                onClick={() => setUserPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition font-semibold"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={users.length < 25}
                onClick={() => setUserPage((p) => p + 1)}
                className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: ALL TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">All System Transactions</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Audit and monitor financial records across every registered user.
              </p>
            </div>
            {/* Search and Filters */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <input
                type="text"
                placeholder="Search user, merchant, note…"
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none w-56"
              />
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
              >
                <option value="">All Types</option>
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
                <option value="TRANSFER">Transfer</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Category & Merchant</th>
                  <th className="px-6 py-3.5">Type</th>
                  <th className="px-6 py-3.5 text-right">Amount</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{tx.username}</p>
                      <p className="text-[10px] text-slate-400">{tx.userEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                      {formatDate(tx.transactionDate)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {tx.merchant || tx.description || 'Transaction'}
                      </p>
                      <p className="text-[11px] text-teal-600 dark:text-emerald-400 font-medium">
                        {tx.categoryName}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        tx.type === 'INCOME'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : tx.type === 'EXPENSE'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-sm">
                      <span className={tx.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'}>
                        {tx.type === 'INCOME' ? '+' : ''}{formatCurrency(tx.amount, tx.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteTransaction(tx.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-xs text-slate-400">
                      {loading ? 'Loading system transactions…' : 'No transactions found matching your criteria.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Transactions Pagination Controls */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Page {txPage + 1} {loading && '• Loading…'}</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={txPage === 0}
                onClick={() => setTxPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition font-semibold"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={transactions.length < 30}
                onClick={() => setTxPage((p) => p + 1)}
                className="px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}

      {/* USER DATA INSPECTION MODAL */}
      {inspectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 md:p-8 relative text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔍</span>
                <div>
                  <h3 className="text-lg font-bold">User Financial Dossier</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Inspecting {inspectUser?.username} ({inspectUser?.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {inspectLoading ? (
              <p className="py-12 text-center text-xs text-slate-400">Loading user records…</p>
            ) : inspectUser ? (
              <div className="mt-6 space-y-6">
                {/* User Stats Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">Transactions</p>
                    <p className="text-xl font-extrabold text-teal-600 dark:text-emerald-400 mt-1">
                      {inspectUser.transactions?.length ?? 0}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">Budgets Set</p>
                    <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                      {inspectUser.budgets?.length ?? 0}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">Savings Goals</p>
                    <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                      {inspectUser.goals?.length ?? 0}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <p className="text-[11px] font-bold text-slate-500 uppercase">Custom Categories</p>
                    <p className="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
                      {inspectUser.categories?.length ?? 0}
                    </p>
                  </div>
                </div>

                {/* Recent Transactions List */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                    Recent Transactions Ledger ({inspectUser.transactions?.length ?? 0})
                  </h4>
                  <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800 sticky top-0">
                        <tr>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Description</th>
                          <th className="px-4 py-2.5">Type</th>
                          <th className="px-4 py-2.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {inspectUser.transactions?.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 text-slate-500">{t.transactionDate}</td>
                            <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-200">
                              {t.merchant || t.description || 'N/A'}
                            </td>
                            <td className="px-4 py-2.5 font-bold uppercase">{t.type}</td>
                            <td className="px-4 py-2.5 text-right font-extrabold">
                              {formatCurrency(t.amount, t.currency)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Budgets & Goals Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <h5 className="text-xs font-bold uppercase text-slate-500 mb-2">Active Budgets</h5>
                    {inspectUser.budgets?.length ? (
                      <ul className="text-xs space-y-1.5">
                        {inspectUser.budgets.map((b) => (
                          <li key={b.id} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                            <span>{b.category?.name || 'All categories'}</span>
                            <span className="font-bold">{formatCurrency(b.amount, b.currency)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400">No budgets created yet.</p>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <h5 className="text-xs font-bold uppercase text-slate-500 mb-2">Savings Goals</h5>
                    {inspectUser.goals?.length ? (
                      <ul className="text-xs space-y-1.5">
                        {inspectUser.goals.map((g) => (
                          <li key={g.id} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                            <span>{g.name}</span>
                            <span className="font-bold">{formatCurrency(g.targetAmount, g.currency)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-slate-400">No savings goals created yet.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
