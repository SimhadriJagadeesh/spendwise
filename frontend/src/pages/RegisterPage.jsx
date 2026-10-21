import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiErrorMessage } from '../api/client';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const { register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function update(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  function validate() {
    const next = {};
    if (form.username.trim().length < 3) next.username = 'Username must be at least 3 characters.';
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters.';
    else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      next.password = 'Password must contain at least one letter and one number.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register(form.username.trim(), form.email.trim(), form.password);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create the account.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen relative flex items-center justify-center bg-sand-50 px-4 py-10">
      <div className="absolute top-5 right-5">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          className="inline-flex items-center gap-1.5 rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-sand-100 shadow-sm transition"
        >
          {isDark ? (
            <>
              <span className="text-amber-400 text-sm">☀️</span>
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <span className="text-indigo-500 text-sm">🌙</span>
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-600 text-white font-extrabold text-2xl shadow-lg shadow-teal-600/30 mb-3">
            $
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-teal-900">Spendwise</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Create your personal account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-sand-200 p-8 space-y-5"
          noValidate
        >
          <h2 className="text-xl font-bold text-ink tracking-tight">Register</h2>

          {error && (
            <div role="alert" className="rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={form.username}
              onChange={update('username')}
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? 'username-error' : undefined}
              className="w-full rounded-lg border border-sand-200 px-3.5 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              placeholder="e.g. alex"
            />
            {errors.username && (
              <p id="username-error" className="mt-1 text-xs font-semibold text-rose-600">{errors.username}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={update('email')}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className="w-full rounded-lg border border-sand-200 px-3.5 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              placeholder="alex@example.com"
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-xs font-semibold text-rose-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={form.password}
                onChange={update('password')}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className="w-full rounded-lg border border-sand-200 px-3.5 py-2 pr-11 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                placeholder="At least 8 chars with letter & number"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition focus:outline-none"
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
            {errors.password && (
              <p id="password-error" className="mt-1 text-xs font-semibold text-rose-600">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 active:bg-teal-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-sm font-medium text-gray-500 text-center pt-2">
            Already registered?{' '}
            <Link to="/login" className="text-teal-700 font-bold hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
