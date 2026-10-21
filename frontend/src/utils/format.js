export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
  const value = Number(amount);
  if (!Number.isFinite(value)) return '—';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency || 'USD'} ${value.toFixed(2)}`;
  }
}

/**
 * Parses a calendar date.
 *
 * A bare "YYYY-MM-DD" string is read by `new Date(...)` as UTC midnight, which
 * renders as the previous day in any negative UTC offset. A date on a bill or a
 * transaction is a calendar day, not an instant, so the parts are read as local
 * time instead.
 */
export function parseDate(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.slice(0, 10));
    if (parts) {
      return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
    }
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Today as YYYY-MM-DD in the user's own time zone. */
export function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** The current month as YYYY-MM in the user's own time zone. */
export function currentMonthISO() {
  return todayISO().slice(0, 7);
}

export function formatDate(value) {
  const date = parseDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date);
}

export function formatPercent(value, digits = 1) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '—';
  return `${num.toFixed(digits)}%`;
}
