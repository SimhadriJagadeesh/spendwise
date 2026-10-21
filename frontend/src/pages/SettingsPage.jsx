import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import ExportCsvButton from '../components/ExportCsvButton';
import api, { apiErrorMessage } from '../api/client';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const {
    currency,
    setCurrency,
    supportedCurrencies,
    activeCurrencyInfo,
    budgetAlertThreshold,
    setBudgetAlertThreshold,
    formatAmount,
  } = useSettings();

  const [customCurrency, setCustomCurrency] = useState('');
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');
  const [notice, setNotice] = useState('');

  function handleSelectCurrency(code) {
    setCurrency(code);
    setNotice(`Currency set to ${code}. All new calculations and views will use this currency.`);
    setTimeout(() => setNotice(''), 4000);
  }

  function handleCustomCurrencySubmit(e) {
    e.preventDefault();
    const clean = customCurrency.trim().toUpperCase();
    if (clean && clean.length === 3) {
      setCurrency(clean);
      setCustomCurrency('');
      setNotice(`Currency set to custom code: ${clean}`);
      setTimeout(() => setNotice(''), 4000);
    }
  }

  async function handleDownloadBackup() {
    setDownloadingBackup(true);
    setBackupMessage('');
    try {
      const [txRes, catRes, budgetRes, goalRes, recRes] = await Promise.all([
        api.get('/transactions', { params: { size: 1000 } }).catch(() => ({ data: { content: [] } })),
        api.get('/categories').catch(() => ({ data: [] })),
        api.get('/budgets').catch(() => ({ data: [] })),
        api.get('/goals').catch(() => ({ data: [] })),
        api.get('/recurring').catch(() => ({ data: [] })),
      ]);

      const backupData = {
        exportedAt: new Date().toISOString(),
        username: user?.username,
        preferredCurrency: currency,
        data: {
          transactions: txRes.data?.content || [],
          categories: catRes.data || [],
          budgets: budgetRes.data || [],
          savingsGoals: goalRes.data || [],
          recurringTransactions: recRes.data || [],
        },
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `spendwise_backup_${user?.username || 'user'}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBackupMessage('✅ Backup downloaded successfully!');
      setTimeout(() => setBackupMessage(''), 4000);
    } catch (err) {
      setBackupMessage(`❌ Could not generate backup: ${apiErrorMessage(err, 'Failed to fetch data')}`);
    } finally {
      setDownloadingBackup(false);
    }
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          ⚙️ Settings & Preferences
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your currency, display preferences, alert thresholds, and export data.
        </p>
      </header>

      {notice && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          {notice}
        </div>
      )}

      {/* 1. Currency Settings Section */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Primary Currency
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose the default currency for summaries, charts, and new transactions.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 border border-slate-200 dark:border-slate-700">
            <span className="text-lg">{activeCurrencyInfo.flag}</span>
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {activeCurrencyInfo.code} ({activeCurrencyInfo.symbol})
            </span>
          </div>
        </div>

        {/* Currency preview badge */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Live Formatting Preview:</span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatAmount(2450.75)}
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Negative sample: <span className="font-semibold text-rose-600 dark:text-rose-400">{formatAmount(-189.5)}</span>
          </div>
        </div>

        {/* Popular Currencies Grid */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Popular Currencies
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {supportedCurrencies.map((c) => {
              const selected = c.code === currency;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelectCurrency(c.code)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition ${
                    selected
                      ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-600/20'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span className="text-xl">{c.flag}</span>
                  <div>
                    <div className="text-sm font-bold leading-tight">{c.code}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate leading-tight">
                      {c.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Currency input */}
        <form onSubmit={handleCustomCurrencySubmit} className="flex items-center gap-3 max-w-sm pt-2">
          <input
            type="text"
            maxLength={3}
            value={customCurrency}
            onChange={(e) => setCustomCurrency(e.target.value.toUpperCase())}
            placeholder="Custom 3-letter code (e.g. SEK, NZD)"
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold uppercase text-slate-900 dark:text-slate-100 outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 text-xs font-bold hover:opacity-90 transition"
          >
            Apply
          </button>
        </form>
      </section>

      {/* 2. Appearance & Display Settings */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Appearance & Theme
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Switch between crisp modern Light Mode and immersive Dark Slate.
          </p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Current Mode: {isDark ? 'Dark Theme' : 'Light Theme'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              High-contrast typography with Plus Jakarta Sans and tailored color palette.
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-emerald-600/20 transition"
          >
            <span>{isDark ? '☀️ Switch to Light' : '🌙 Switch to Dark'}</span>
          </button>
        </div>
      </section>

      {/* 3. Budget & Threshold Alerts */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Budget Warning Threshold
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Highlight budgets in warning amber when spending reaches this percentage of the limit.
          </p>
        </div>

        <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Alert Trigger: <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{budgetAlertThreshold}%</span> of total budget
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
              WARNING STATUS
            </span>
          </div>
          <input
            type="range"
            min="50"
            max="95"
            step="5"
            value={budgetAlertThreshold}
            onChange={(e) => setBudgetAlertThreshold(e.target.value)}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>50% (Conservative)</span>
            <span>80% (Standard)</span>
            <span>95% (Lenient)</span>
          </div>
        </div>
      </section>

      {/* 4. Data Management & Backup */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Data Export & Backup
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Download your financial records in open formats for spreadsheets or complete JSON backups.
          </p>
        </div>

        {backupMessage && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-3 text-xs font-medium">
            {backupMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                📦 Complete JSON Backup
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Exports all your transactions, categories, budgets, recurring rules, and goals in a single file.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadBackup}
              disabled={downloadingBackup}
              className="mt-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-4 py-2 text-xs font-bold hover:opacity-90 transition disabled:opacity-50"
            >
              {downloadingBackup ? 'Generating…' : '📥 Download JSON Backup'}
            </button>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                📊 CSV Spreadsheet Export
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Exports all transaction rows formatted with formula injection protection for Excel or Google Sheets.
              </p>
            </div>
            <div className="mt-4">
              <ExportCsvButton currency={currency} className="w-full justify-center !text-xs !py-2" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Account & Security */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Account & Session
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Logged-in session details and authentication.
          </p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex-wrap gap-3">
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
              User: <span className="text-emerald-600 dark:text-emerald-400">{user?.username}</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Role: <span className="font-semibold">{user?.role || 'USER'}</span> · Isolated database partition
            </div>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 px-4 py-2 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition"
          >
            Sign out of account
          </button>
        </div>
      </section>
    </div>
  );
}
