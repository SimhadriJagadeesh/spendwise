import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { setToken, getToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // A stored token means the session may still be valid, so we must confirm it
  // with the server before deciding whether the user is signed in.
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    api
      .get('/auth/me')
      .then(({ data }) => {
        if (cancelled) return;
        setUser(data ? { username: data.username, email: data.email, role: data.role } : null);
      })
      .catch(() => {
        if (cancelled) return;
        // The token was rejected or expired - drop it so the app returns to the login page.
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const signIn = useCallback(async (usernameOrEmail, password) => {
    const { data } = await api.post('/auth/login', { usernameOrEmail, password });
    setToken(data.token);
    // The identifier may be an email address, but the app shows the username.
    // Ask the server who the token belongs to rather than guessing.
    try {
      const { data: profile } = await api.get('/auth/me');
      setUser({
        username: profile?.username ?? usernameOrEmail,
        email: profile?.email,
        role: profile?.role,
      });
    } catch {
      setUser({ username: usernameOrEmail });
    }
    return data.token;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    return data;
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, register, isAuthenticated: Boolean(user) }),
    [user, loading, signIn, signOut, register]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
}
