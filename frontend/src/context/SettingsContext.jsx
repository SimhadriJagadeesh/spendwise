import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { formatCurrency as formatCurrencyUtil } from '../utils/format';

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
];

const SETTINGS_STORAGE_KEY = 'spendwise.settings';

const DEFAULT_SETTINGS = {
  currency: 'USD',
  budgetAlertThreshold: 80,
  dateFormat: 'YYYY-MM-DD',
};

function loadSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    /* fallback to defaults */
  }
  return DEFAULT_SETTINGS;
}

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      /* storage unavailable */
    }
  }, [settings]);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setCurrency = useCallback((code) => {
    updateSetting('currency', code.toUpperCase());
  }, [updateSetting]);

  const setBudgetAlertThreshold = useCallback((threshold) => {
    updateSetting('budgetAlertThreshold', Math.min(Math.max(Number(threshold) || 80, 10), 100));
  }, [updateSetting]);

  const formatAmount = useCallback(
    (amount, overrideCurrency) => {
      return formatCurrencyUtil(amount, overrideCurrency || settings.currency);
    },
    [settings.currency]
  );

  const activeCurrencyInfo = useMemo(() => {
    return (
      SUPPORTED_CURRENCIES.find((c) => c.code === settings.currency) || {
        code: settings.currency,
        symbol: settings.currency,
        name: settings.currency,
        flag: '🌐',
      }
    );
  }, [settings.currency]);

  const value = useMemo(
    () => ({
      settings,
      currency: settings.currency,
      activeCurrencyInfo,
      supportedCurrencies: SUPPORTED_CURRENCIES,
      setCurrency,
      budgetAlertThreshold: settings.budgetAlertThreshold,
      setBudgetAlertThreshold,
      updateSetting,
      formatAmount,
    }),
    [settings, activeCurrencyInfo, setCurrency, setBudgetAlertThreshold, updateSetting, formatAmount]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
