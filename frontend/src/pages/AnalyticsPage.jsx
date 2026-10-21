import { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api, { apiErrorMessage } from '../api/client';
import { formatCurrency, formatPercent } from '../utils/format';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

const PALETTE = ['#059669', '#4F46E5', '#F59E0B', '#EC4899', '#8B5CF6', '#0284C7', '#EF4444', '#10B981'];

function ChartCard({ title, subtitle, children, isEmpty, emptyMessage, action }) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
          <span className="text-2xl mb-2">📊</span>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="h-72 w-full">{children}</div>
      )}
    </section>
  );
}

function CustomChartTooltip({ active, payload, label, currency }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-xl text-xs z-30">
        <div className="font-bold text-slate-900 dark:text-slate-100 mb-1.5 border-b border-slate-100 dark:border-slate-700 pb-1">
          {label}
        </div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5 font-medium" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(entry.value, currency)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function getPeriodDates(periodType) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  if (periodType === 'THIS_MONTH') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    return { from: startOfMonth, to: todayStr };
  }
  if (periodType === 'LAST_3_MONTHS') {
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10);
    return { from: threeMonthsAgo, to: todayStr };
  }
  if (periodType === 'THIS_YEAR') {
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
    return { from: startOfYear, to: todayStr };
  }
  return { from: '2020-01-01', to: todayStr };
}

export default function AnalyticsPage() {
  const { isDark } = useTheme();
  const { currency: globalCurrency, supportedCurrencies } = useSettings();
  const [selectedCurrency, setSelectedCurrency] = useState(globalCurrency);
  const [period, setPeriod] = useState('ALL');

  const [trend, setTrend] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Keep local currency in sync if global settings change
  useEffect(() => {
    setSelectedCurrency(globalCurrency);
  }, [globalCurrency]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const activeCurr = (selectedCurrency || 'USD').toUpperCase();
      const dates = getPeriodDates(period);
      const [trendRes, categoryRes, summaryRes] = await Promise.all([
        api.get('/analytics/cash-flow', { params: { currency: activeCurr, ...dates } }),
        api.get('/analytics/spending-by-category', { params: { currency: activeCurr, ...dates } }),
        api.get('/dashboard/summary', { params: { currency: activeCurr, ...dates } }),
      ]);
      setTrend(trendRes.data ?? []);
      setByCategory(categoryRes.data ?? []);
      setSummary(summaryRes.data);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load analytics.'));
    } finally {
      setLoading(false);
    }
  }, [selectedCurrency, period]);

  useEffect(() => {
    load();
  }, [load]);

  const hasTrendData = trend.some((row) => Number(row.income) > 0 || Number(row.expenses) > 0);
  const hasCategoryData = byCategory.length > 0;

  // Chart styling tokens based on active dark/light mode
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const axisColor = isDark ? '#94a3b8' : '#475569';
  const legendColor = isDark ? '#e2e8f0' : '#1e293b';

  // Calculate total categorized expenses for percentage breakdown
  const totalCategoryExpenses = byCategory.reduce((acc, cur) => acc + (Number(cur.total) || 0), 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            📊 Financial Analytics & Insights
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track your cash flow trends, spending distribution, and savings rate.
          </p>
        </div>

        {/* Currency & Period Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Period Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Period:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="text-xs font-bold bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              <option value="ALL" className="dark:bg-slate-800">All Time</option>
              <option value="THIS_YEAR" className="dark:bg-slate-800">This Year (YTD)</option>
              <option value="LAST_3_MONTHS" className="dark:bg-slate-800">Last 3 Months</option>
              <option value="THIS_MONTH" className="dark:bg-slate-800">This Month</option>
            </select>
          </div>

          {/* Currency Selector */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Currency:</span>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="text-xs font-bold bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              {supportedCurrencies.map((c) => (
                <option key={c.code} value={c.code} className="dark:bg-slate-800">
                  {c.flag} {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={load}
            disabled={loading}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm transition disabled:opacity-60"
          >
            {loading ? 'Refreshing…' : '🔄 Refresh'}
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs font-semibold text-rose-700 dark:text-rose-400">
          <p>{error}</p>
          <button onClick={load} className="mt-2 font-bold underline">
            Try again
          </button>
        </div>
      )}

      {/* KPI Cards */}
      {summary && (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Total Income</p>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(summary.totalIncome ?? 0, selectedCurrency)}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Earnings in current cycle</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Total Expenses</p>
            <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
              {formatCurrency(summary.totalExpenses ?? 0, selectedCurrency)}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Spending in current cycle</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Net Cash Flow</p>
            <p className={`text-2xl font-extrabold ${Number(summary.netCashFlow) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(summary.netCashFlow ?? 0, selectedCurrency)}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Income minus expenses</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Savings Rate</p>
            <p className="text-2xl font-extrabold text-teal-800 dark:text-emerald-400">
              {formatPercent(summary.savingsRate ?? 0)}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {summary.periodStart} → {summary.periodEnd}
            </p>
          </div>
        </section>
      )}

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Income vs Expenses Line Trend */}
        <ChartCard
          title="Income vs Expenses Trend"
          subtitle={`Monthly historical comparison in ${selectedCurrency}`}
          isEmpty={!hasTrendData}
          emptyMessage={`No transaction trend records available for ${selectedCurrency}.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="month" stroke={axisColor} tick={{ fontSize: 11, fill: axisColor }} />
              <YAxis
                stroke={axisColor}
                tick={{ fontSize: 11, fill: axisColor }}
                width={70}
                tickFormatter={(v) => Number(v).toLocaleString()}
              />
              <Tooltip content={<CustomChartTooltip currency={selectedCurrency} />} />
              <Legend wrapperStyle={{ color: legendColor, fontSize: '12px' }} />
              <Line
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#059669' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#EC4899"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#EC4899' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Chart 2: Spending by Category Pie + Breakdown */}
        <ChartCard
          title="Spending by Category"
          subtitle={`Distribution of expenditures in ${selectedCurrency}`}
          isEmpty={!hasCategoryData}
          emptyMessage={`No categorized expenses to chart yet for ${selectedCurrency}.`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 h-full gap-2 items-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="total"
                    nameKey="category"
                    innerRadius="50%"
                    outerRadius="78%"
                    paddingAngle={3}
                  >
                    {byCategory.map((entry, index) => (
                      <Cell key={entry.category ?? index} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomChartTooltip currency={selectedCurrency} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category ranking list with percentages */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {byCategory.slice(0, 6).map((cat, idx) => {
                const total = Number(cat.total) || 0;
                const pct = totalCategoryExpenses > 0 ? (total / totalCategoryExpenses) * 100 : 0;
                const color = PALETTE[idx % PALETTE.length];
                return (
                  <div key={cat.category || idx} className="text-xs">
                    <div className="flex items-center justify-between font-semibold mb-1">
                      <span className="flex items-center gap-1.5 truncate max-w-[120px]">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="truncate text-slate-800 dark:text-slate-200">{cat.category || 'Other'}</span>
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 font-bold">
                        {formatCurrency(total, selectedCurrency)} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Chart 3: Monthly Net Cash Flow Bar Chart */}
      <ChartCard
        title="Monthly Net Cash Flow Breakdown"
        subtitle={`Gross income compared against gross expenses for ${selectedCurrency}`}
        isEmpty={!hasTrendData}
        emptyMessage={`No cash flow records to display for ${selectedCurrency}.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trend} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="month" stroke={axisColor} tick={{ fontSize: 11, fill: axisColor }} />
            <YAxis
              stroke={axisColor}
              tick={{ fontSize: 11, fill: axisColor }}
              width={70}
              tickFormatter={(v) => Number(v).toLocaleString()}
            />
            <Tooltip content={<CustomChartTooltip currency={selectedCurrency} />} />
            <Legend wrapperStyle={{ color: legendColor, fontSize: '12px' }} />
            <Bar dataKey="income" name="Income" fill="#059669" radius={[5, 5, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#EC4899" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
