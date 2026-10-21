import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import QuickAddTransactionModal from './QuickAddTransactionModal';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/transactions', label: 'Transactions', icon: '💳' },
  { to: '/categories', label: 'Categories', icon: '🏷️' },
  { to: '/budgets', label: 'Budgets', icon: '🎯' },
  { to: '/goals', label: 'Savings Goals', icon: '🏆' },
  { to: '/recurring', label: 'Recurring', icon: '🔁' },
  { to: '/analytics', label: 'Analytics', icon: '📈' },
  { to: '/calculators', label: 'Calculators', icon: '🧮' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex items-center gap-1.5 rounded-lg border border-sand-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-sand-100 dark:hover:bg-slate-700 shadow-sm transition"
    >
      {isDark ? (
        <>
          <span className="text-amber-400 text-xs">☀️</span>
          <span>Light</span>
        </>
      ) : (
        <>
          <span className="text-indigo-500 text-xs">🌙</span>
          <span>Dark</span>
        </>
      )}
    </button>
  );
}

function NavItems({ onNavigate }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  return (
    <nav className="flex-1 px-3 space-y-1" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isActive
                ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-800/60'
                : 'text-slate-600 dark:text-slate-300 hover:bg-sand-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <span className="text-base select-none">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}

      {isAdmin && (
        <div className="pt-2">
          <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-500">
            Platform Master
          </div>
          <NavLink
            to="/admin"
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/30'
                  : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 dark:hover:bg-amber-500/10'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <span className="text-base select-none">🛡️</span>
              <span>Admin Portal</span>
            </div>
            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
              Root
            </span>
          </NavLink>
        </div>
      )}
    </nav>
  );
}

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const { currency } = useSettings();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  function handleSignOut() {
    signOut();
    navigate('/login', { replace: true });
  }

  function handleQuickAddSuccess() {
    // If user creates a transaction, reload or let user see updated data
    window.dispatchEvent(new Event('transaction-created'));
  }

  return (
    <div className="min-h-screen bg-sand-50 dark:bg-[#090d16] text-ink dark:text-slate-100 font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        Skip to main content
      </a>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white dark:bg-slate-900 border-r border-sand-200 dark:border-slate-800 fixed h-full z-20 transition-colors shadow-sm">
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 font-extrabold text-base">
                S
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-teal-900 dark:text-emerald-400 leading-tight">
                  Spendwise
                </h1>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Smart Finance Hub
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          {/* Quick Action Button */}
          <button
            onClick={() => setQuickAddOpen(true)}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs py-2.5 px-3 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="text-base font-bold leading-none">+</span>
            <span>New Transaction</span>
          </button>

          {/* Active Currency Badge Link */}
          <NavLink
            to="/settings"
            title="Configure currency in Settings"
            className="w-full mt-2.5 flex items-center justify-between px-3 py-1.5 rounded-lg bg-sand-100 dark:bg-slate-800/80 hover:bg-sand-200 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 transition border border-sand-200 dark:border-slate-700/60"
          >
            <span className="flex items-center gap-1.5">
              <span>💱 Currency</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-sand-200 dark:border-slate-700 text-teal-700 dark:text-emerald-400 font-bold uppercase">
              {currency}
            </span>
          </NavLink>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <NavItems />
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="p-4 border-t border-sand-200 dark:border-slate-800 mt-auto bg-sand-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-emerald-900/50 text-teal-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs uppercase border border-teal-200 dark:border-emerald-800">
              {user?.username?.[0] || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.username}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Account Active</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-sand-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 dark:hover:border-rose-900/50 transition"
          >
            <span>🚪</span>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-sand-200 dark:border-slate-800 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
            S
          </div>
          <h1 className="text-base font-bold tracking-tight text-teal-900 dark:text-emerald-400">Spendwise</h1>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sand-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border border-sand-200 dark:border-slate-700 uppercase">
            {currency}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuickAddOpen(true)}
            className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm"
            title="Quick add transaction"
          >
            + Add
          </button>
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
            className="rounded-lg border border-sand-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile Nav Menu Drawer */}
      {menuOpen && (
        <div id="mobile-nav" className="md:hidden bg-white dark:bg-slate-900 border-b border-sand-200 dark:border-slate-800 px-4 py-3 shadow-lg animate-in slide-in-from-top duration-150">
          <NavItems onNavigate={() => setMenuOpen(false)} />
          <div className="mt-3 pt-3 border-t border-sand-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3 px-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{user?.username}</span>
              <NavLink
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="text-xs text-teal-600 dark:text-emerald-400 font-semibold"
              >
                Settings ({currency}) →
              </NavLink>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400"
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main id="main-content" className="md:ml-64 p-4 md:p-8 max-w-6xl mx-auto">
        <Outlet />
      </main>

      {/* Global Quick Add Transaction Modal */}
      <QuickAddTransactionModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onSuccess={handleQuickAddSuccess}
      />
    </div>
  );
}
