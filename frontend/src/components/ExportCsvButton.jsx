import { useState } from 'react';
import api, { blobErrorMessage } from '../api/client';

/**
 * Downloads the caller's transactions as CSV. The request is made with the
 * API client so the bearer token is attached - a plain link would not carry it.
 *
 * The currency filter is optional. Sending a currency that the caller does not
 * actually use would produce a file with only a header row, so an empty filter
 * means "every currency".
 */
export default function ExportCsvButton({ currency = '', from, to, className = '' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleExport() {
    setError('');
    setBusy(true);
    try {
      const params = {};
      if (currency) params.currency = currency.toUpperCase();
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await api.get('/exports/transactions.csv', { params, responseType: 'blob' });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `spendwise_transactions_${currency ? currency.toUpperCase() : 'all'}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(await blobErrorMessage(err, 'Could not export your transactions.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleExport}
        disabled={busy}
        className={`rounded-lg border border-sand-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-sand-100 transition disabled:opacity-60 ${className}`}
      >
        {busy ? 'Exporting…' : 'Export CSV'}
      </button>
      {error && (
        <span role="alert" className="text-xs text-rose-600 text-right">{error}</span>
      )}
    </div>
  );
}
