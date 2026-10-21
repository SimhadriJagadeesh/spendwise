import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { formatCurrency } from '../utils/format';

const CALCULATOR_TABS = [
  { id: 'loan', label: 'Loan / EMI', icon: '🏦', desc: 'Calculate monthly payments & interest' },
  { id: 'compound', label: 'Compound Interest', icon: '📈', desc: 'Forecast wealth growth over time' },
  { id: 'budget50', label: '50/30/20 Rule', icon: '🎯', desc: 'Divide income into needs, wants, savings' },
  { id: 'emergency', label: 'Emergency Fund', icon: '🛡️', desc: 'Calculate runway & savings targets' },
  { id: 'fire', label: 'FIRE & Retirement', icon: '🔥', desc: 'Find your target nest egg & horizon' },
];

/* =========================================================================
   1. LOAN / EMI CALCULATOR
   ========================================================================= */
function LoanEmiCalculator({ currency }) {
  const [principal, setPrincipal] = useState(50000);
  const [interestRate, setInterestRate] = useState(7.5);
  const [tenureYears, setTenureYears] = useState(5);

  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;

  let emi = 0;
  if (monthlyRate > 0 && totalMonths > 0) {
    emi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
      (Math.pow(1 + monthlyRate, totalMonths) - 1);
  } else if (totalMonths > 0) {
    emi = principal / totalMonths;
  }

  const totalPayment = emi * totalMonths;
  const totalInterest = Math.max(0, totalPayment - principal);
  const principalPercent = totalPayment > 0 ? (principal / totalPayment) * 100 : 100;
  const interestPercent = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-7 space-y-6">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Loan Principal Amount
            </label>
            <span className="text-sm font-extrabold text-teal-600 dark:text-emerald-400">
              {formatCurrency(principal, currency)}
            </span>
          </div>
          <input
            type="range"
            min={1000}
            max={1000000}
            step={1000}
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
          />
          <input
            type="number"
            min={1}
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
            className="mt-2 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold outline-none"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Annual Interest Rate (%)
            </label>
            <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
              {interestRate}%
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={30}
            step={0.1}
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <input
            type="number"
            step="0.1"
            min={0.1}
            max={100}
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="mt-2 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold outline-none"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Loan Tenure (Years)
            </label>
            <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
              {tenureYears} Years ({totalMonths} months)
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={tenureYears}
            onChange={(e) => setTenureYears(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-600"
          />
          <div className="flex gap-2 mt-2">
            {[1, 3, 5, 10, 15, 20, 30].map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setTenureYears(yr)}
                className={`flex-1 py-1 text-xs font-bold rounded-lg border transition ${
                  tenureYears === yr
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {yr}y
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Box */}
      <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-5">
        <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-700">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Monthly EMI Payment
          </p>
          <p className="text-3xl font-extrabold text-teal-700 dark:text-emerald-400 mt-1">
            {formatCurrency(emi, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Payable every month for {totalMonths} months</p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Principal Amount</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(principal, currency)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Total Interest</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">+{formatCurrency(totalInterest, currency)}</span>
          </div>
          <div className="flex justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-700 dark:text-slate-300">Total Repayment</span>
            <span className="font-extrabold text-base text-slate-900 dark:text-white">{formatCurrency(totalPayment, currency)}</span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div>
          <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Principal ({principalPercent.toFixed(1)}%)</span>
            <span>Interest ({interestPercent.toFixed(1)}%)</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-700">
            <div style={{ width: `${principalPercent}%` }} className="bg-teal-600 transition-all duration-300" />
            <div style={{ width: `${interestPercent}%` }} className="bg-rose-500 transition-all duration-300" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   2. COMPOUND INTEREST / WEALTH BUILDER
   ========================================================================= */
function CompoundInterestCalculator({ currency }) {
  const [initialDeposit, setInitialDeposit] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [annualRate, setAnnualRate] = useState(8);
  const [years, setYears] = useState(10);

  const months = years * 12;
  const monthlyRate = annualRate / 100 / 12;

  // Future value calculation
  let futureValue = initialDeposit * Math.pow(1 + monthlyRate, months);
  let futureValueOfContributions = 0;
  if (monthlyRate > 0) {
    futureValueOfContributions =
      monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  } else {
    futureValueOfContributions = monthlyContribution * months;
  }
  const totalValue = futureValue + futureValueOfContributions;
  const totalPrincipalDeposited = initialDeposit + monthlyContribution * months;
  const totalInterestEarned = Math.max(0, totalValue - totalPrincipalDeposited);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-7 space-y-6">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Initial Principal Investment
            </label>
            <span className="text-sm font-extrabold text-teal-600 dark:text-emerald-400">
              {formatCurrency(initialDeposit, currency)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={500000}
            step={1000}
            value={initialDeposit}
            onChange={(e) => setInitialDeposit(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Monthly Contribution
            </label>
            <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
              {formatCurrency(monthlyContribution, currency)}/mo
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={10000}
            step={50}
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Estimated Return (% per year)
            </label>
            <input
              type="number"
              step="0.1"
              value={annualRate}
              onChange={(e) => setAnnualRate(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Investment Horizon (Years)
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold outline-none"
            />
          </div>
        </div>
      </div>

      {/* Results Box */}
      <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-5">
        <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-700">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Projected Total Wealth
          </p>
          <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(totalValue, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">After {years} years of compounding</p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Total Capital Deposited</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(totalPrincipalDeposited, currency)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Compound Interest Earned</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(totalInterestEarned, currency)}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300">
          💡 <strong>Compounding Magic:</strong> Interest accounts for{' '}
          <strong>{totalValue > 0 ? ((totalInterestEarned / totalValue) * 100).toFixed(1) : 0}%</strong> of your final wealth!
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   3. 50 / 30 / 20 BUDGET CALCULATOR
   ========================================================================= */
function Budget503020Calculator({ currency }) {
  const [income, setIncome] = useState(4000);

  const needs = income * 0.5;
  const wants = income * 0.3;
  const savings = income * 0.2;

  return (
    <div className="space-y-8">
      <div className="max-w-lg mx-auto text-center space-y-4">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Monthly After-Tax Take-Home Income
        </label>
        <div className="relative max-w-sm mx-auto">
          <input
            type="number"
            min={0}
            step={50}
            value={income}
            onChange={(e) => setIncome(Number(e.target.value))}
            className="w-full text-center text-2xl font-extrabold rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 outline-none"
          />
        </div>
        <p className="text-xs text-slate-500">The popular financial rule popularized by Sen. Elizabeth Warren</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Needs Card */}
        <div className="rounded-2xl p-6 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl">🏠</span>
            <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
              50% Needs
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Essential Living</h3>
          <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 mt-2">
            {formatCurrency(needs, currency)}
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 mt-4 pt-4 border-t border-blue-200 dark:border-blue-900/40">
            <li>• Rent & Mortgage payments</li>
            <li>• Essential Groceries & Utilities</li>
            <li>• Health & Car Insurance</li>
            <li>• Minimum Debt Payments</li>
          </ul>
        </div>

        {/* Wants Card */}
        <div className="rounded-2xl p-6 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl">☕</span>
            <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-300">
              30% Wants
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Lifestyle & Leisure</h3>
          <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-400 mt-2">
            {formatCurrency(wants, currency)}
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 mt-4 pt-4 border-t border-purple-200 dark:border-purple-900/40">
            <li>• Dining out & Coffee runs</li>
            <li>• Vacations & Travel</li>
            <li>• Subscriptions (Netflix, gym)</li>
            <li>• Entertainment & Hobbies</li>
          </ul>
        </div>

        {/* Savings Card */}
        <div className="rounded-2xl p-6 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 card-hover">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl">💰</span>
            <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
              20% Savings
            </span>
          </div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Future & Protection</h3>
          <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-2">
            {formatCurrency(savings, currency)}
          </p>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-900/40">
            <li>• Emergency fund reserve</li>
            <li>• Retirement & Stocks/ETFs</li>
            <li>• Extra debt principal payoff</li>
            <li>• Long-term savings goals</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   4. EMERGENCY FUND RUNWAY CALCULATOR
   ========================================================================= */
function EmergencyFundCalculator({ currency }) {
  const [monthlyExpense, setMonthlyExpense] = useState(2500);
  const [currentSavings, setCurrentSavings] = useState(6000);
  const [targetMonths, setTargetMonths] = useState(6);

  const targetFund = monthlyExpense * targetMonths;
  const currentMonthsRunway = monthlyExpense > 0 ? (currentSavings / monthlyExpense).toFixed(1) : 0;
  const fundPercentage = targetFund > 0 ? Math.min(100, (currentSavings / targetFund) * 100) : 100;
  const shortfall = Math.max(0, targetFund - currentSavings);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-7 space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Average Monthly Essential Expenses
          </label>
          <input
            type="number"
            min={100}
            step={50}
            value={monthlyExpense}
            onChange={(e) => setMonthlyExpense(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Current Emergency Cash Available
          </label>
          <input
            type="number"
            min={0}
            step={100}
            value={currentSavings}
            onChange={(e) => setCurrentSavings(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Target Months of Runway
          </label>
          <div className="grid grid-cols-4 gap-2.5">
            {[3, 6, 9, 12].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setTargetMonths(m)}
                className={`py-2 text-xs font-bold rounded-xl border transition ${
                  targetMonths === m
                    ? 'bg-teal-600 text-white border-teal-600 shadow'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {m} Months
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-5">
        <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-700">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Current Runway
          </p>
          <p className="text-3xl font-extrabold text-teal-600 dark:text-emerald-400 mt-1">
            {currentMonthsRunway} Months
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">of living expenses covered</p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Target Emergency Fund</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(targetFund, currency)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Shortfall to Target</span>
            <span className="font-bold text-rose-600 dark:text-rose-400">
              {shortfall > 0 ? formatCurrency(shortfall, currency) : 'Fund Complete! 🎉'}
            </span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Progress: {fundPercentage.toFixed(1)}%</span>
            <span>{currentSavings >= targetFund ? 'Goal Met' : 'In Progress'}</span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
            <div
              style={{ width: `${fundPercentage}%` }}
              className={`h-full transition-all duration-300 ${
                fundPercentage >= 100 ? 'bg-emerald-500' : 'bg-teal-600'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   5. FIRE & EARLY RETIREMENT CALCULATOR
   ========================================================================= */
function FireCalculator({ currency }) {
  const [currentAge, setCurrentAge] = useState(30);
  const [retireAge, setRetireAge] = useState(55);
  const [currentSavings, setCurrentSavings] = useState(50000);
  const [monthlyContribution, setMonthlyContribution] = useState(1000);
  const [annualExpenses, setAnnualExpenses] = useState(40000);
  const [annualReturn, setAnnualReturn] = useState(7);

  // 4% safe withdrawal rule: Target Nest Egg = 25 * Annual Expenses
  const targetNestEgg = annualExpenses * 25;

  const yearsToRetire = Math.max(0, retireAge - currentAge);
  const months = yearsToRetire * 12;
  const monthlyRate = annualReturn / 100 / 12;

  let projectedNestEgg = currentSavings * Math.pow(1 + monthlyRate, months);
  if (monthlyRate > 0) {
    projectedNestEgg +=
      monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  } else {
    projectedNestEgg += monthlyContribution * months;
  }

  const isFireReady = projectedNestEgg >= targetNestEgg;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-7 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Current Age
            </label>
            <input
              type="number"
              value={currentAge}
              onChange={(e) => setCurrentAge(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Target Retirement Age
            </label>
            <input
              type="number"
              value={retireAge}
              onChange={(e) => setRetireAge(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Annual Living Expenses in Retirement
          </label>
          <input
            type="number"
            step={1000}
            value={annualExpenses}
            onChange={(e) => setAnnualExpenses(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold outline-none"
          />
          <p className="text-[11px] text-slate-400 mt-1">Based on the 4% Safe Withdrawal Rule (25x annual spending)</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Current Investments
            </label>
            <input
              type="number"
              step={1000}
              value={currentSavings}
              onChange={(e) => setCurrentSavings(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Monthly Investment
            </label>
            <input
              type="number"
              step={50}
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Annual Return (%)
            </label>
            <input
              type="number"
              step={0.5}
              min={1}
              max={30}
              value={annualReturn}
              onChange={(e) => setAnnualReturn(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm font-semibold outline-none"
            />
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-5">
        <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-700">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Target FIRE Number
          </p>
          <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {formatCurrency(targetNestEgg, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Amount required for lifelong financial independence</p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Years Until Retirement</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{yearsToRetire} Years</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Projected Nest Egg at {retireAge}</span>
            <span className={`font-bold ${isFireReady ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'}`}>
              {formatCurrency(projectedNestEgg, currency)}
            </span>
          </div>
        </div>

        <div
          className={`p-3.5 rounded-xl border text-xs ${
            isFireReady
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
          }`}
        >
          {isFireReady ? (
            <span>🚀 <strong>On Track!</strong> Your savings will reach your target by age {retireAge}.</span>
          ) : (
            <span>
              ⚠️ <strong>Gap of {formatCurrency(targetNestEgg - projectedNestEgg, currency)}:</strong> Consider increasing monthly contributions or extending your horizon.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   MAIN CALCULATORS PAGE
   ========================================================================= */
export default function CalculatorsPage() {
  const [activeTab, setActiveTab] = useState('loan');
  const { currency } = useSettings();

  return (
    <div className="space-y-8 animate-fade-in-up">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>🧮</span>
            <span>Financial Calculators Hub</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Empower your money decisions: loans, compounding, budgeting, emergency fund & retirement.
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs font-bold text-slate-700 dark:text-slate-300">
          Active Currency: <span className="text-teal-600 dark:text-emerald-400 uppercase">{currency}</span>
        </div>
      </header>

      {/* Calculator Tab Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {CALCULATOR_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`p-3.5 rounded-2xl text-left border transition-all card-hover ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 border-teal-600 dark:border-emerald-500 shadow-md ring-2 ring-teal-600/10'
                : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <span className="text-2xl block mb-1.5">{tab.icon}</span>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{tab.label}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{tab.desc}</p>
          </button>
        ))}
      </div>

      {/* Active Calculator Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
        {activeTab === 'loan' && <LoanEmiCalculator currency={currency} />}
        {activeTab === 'compound' && <CompoundInterestCalculator currency={currency} />}
        {activeTab === 'budget50' && <Budget503020Calculator currency={currency} />}
        {activeTab === 'emergency' && <EmergencyFundCalculator currency={currency} />}
        {activeTab === 'fire' && <FireCalculator currency={currency} />}
      </div>
    </div>
  );
}
