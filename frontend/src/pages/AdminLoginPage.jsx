import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiErrorMessage } from '../api/client';

export default function AdminLoginPage() {
  const { signIn } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Admin login details
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(identifier.trim(), password);
      // Navigate straight to admin portal
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid administrator credentials.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center bg-slate-950 text-slate-100 px-4 py-12">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl" />
      </div>

      <div className="absolute top-5 right-5">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 shadow-sm transition"
        >
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-extrabold text-2xl shadow-xl shadow-amber-500/20 mb-3 border border-amber-400/30">
            🛡️
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Spendwise Admin Console
          </h1>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Restricted Master Access & Platform Oversight
          </p>
        </div>

        {/* Form Card - Strictly NO registration link */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-800 p-8 space-y-5"
          noValidate
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Admin Authentication</span>
            </h2>
            <span className="text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Restricted
            </span>
          </div>

          {error && (
            <div role="alert" className="rounded-xl bg-rose-950/50 border border-rose-800/60 px-3.5 py-2.5 text-xs font-semibold text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="adminIdentifier" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Admin Email / Username
            </label>
            <input
              id="adminIdentifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 text-sm font-semibold text-white outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
              placeholder="Enter administrator email or username"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="adminPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Admin Key / Password
            </label>
            <div className="relative">
              <input
                id="adminPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2.5 pr-11 text-sm font-semibold text-white outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                placeholder="Enter administrator password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-slate-200 transition focus:outline-none"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 active:scale-[0.98] px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-amber-600/30 transition disabled:opacity-60"
          >
            {submitting ? 'Verifying Credentials…' : 'Access Administrator Console →'}
          </button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="text-xs text-slate-400 hover:text-slate-200 transition underline underline-offset-4"
            >
              ← Return to Standard User Login
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
