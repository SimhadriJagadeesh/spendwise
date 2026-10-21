import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

const TOKEN_KEY = 'spendwise.token';

export function getToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable - token stays in memory only for this page load */
  }
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url ?? '';
    // The session probe is expected to 401 when the stored token has expired; the
    // caller handles that case, so it must not trigger a full-page redirect.
    const isSessionProbe = url.includes('/auth/me');
    if (status === 401) {
      setToken(null);
      if (!isSessionProbe && !window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (data?.details?.length) return data.details.join('; ');
  if (data?.message) return data.message;
  if (error?.code === 'ERR_NETWORK') {
    return 'Cannot reach the server. Check that the backend is running.';
  }
  return fallback;
}

/**
 * Reads a JSON error body that was downloaded as a blob (used by the CSV
 * export, which asks axios for a blob so the file can be saved).
 */
export async function blobErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (data && typeof data === 'object' && typeof data.text === 'function') {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text);
      if (parsed?.details?.length) return parsed.details.join('; ');
      if (parsed?.message) return parsed.message;
    } catch {
      /* not a JSON body - fall through to the generic message */
    }
  }
  return apiErrorMessage(error, fallback);
}

export default api;
