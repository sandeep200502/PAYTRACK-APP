// Who is logged in. Keeps the user in React state and the token in localStorage.
// When the app runs without the API (authRequired = false) there is no login at all.

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi, authRequired, clearToken, getToken, setToken } from '../services/auth';
import { useRouter } from './useRouter';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { navigate } = useRouter();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(authRequired && Boolean(getToken()));

  // On page load: if a token was saved, ask the server who it belongs to.
  useEffect(() => {
    if (!authRequired || !getToken()) return;
    authApi
      .me()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setChecking(false));
  }, []);

  // httpAdapter fires this when the server answers 401 (expired or invalid token).
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('paytrack:logout', onLogout);
    return () => window.removeEventListener('paytrack:logout', onLogout);
  }, []);

  const finish = useCallback(
    (res) => {
      setToken(res.token);
      setUser(res.user);
      navigate(res.user?.role === 'ADMIN' ? '/admin' : '/dashboard');
    },
    [navigate],
  );

  const login = useCallback(async (email, password) => finish(await authApi.login(email, password)), [finish]);
  const register = useCallback(async (name, email, password) => finish(await authApi.register(name, email, password)), [finish]);
  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    navigate('/login');
  }, [navigate]);

  return <AuthContext.Provider value={{ user, checking, authRequired, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
