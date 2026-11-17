// Login/register calls and the saved login token.
// Login only exists when the app runs against the Spring Boot API (VITE_API_URL set).
// Without it the app runs on browser storage with a single local user, as before.

const BASE = import.meta.env.VITE_API_URL;
const KEY = 'paytrack.token';

export const authRequired = Boolean(BASE);

// localStorage can throw (private windows), so every access is wrapped.
export function getToken() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}
export function setToken(token) {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    /* ignore */
  }
}
export function clearToken() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Headers for every API call: JSON plus the "Authorization: Bearer <token>" login proof. */
export function authHeaders(extra = {}) {
  const token = getToken();
  return { ...extra, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function call(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Check that the backend is running.');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

export const authApi = {
  register: (name, email, password) => call('/auth/register', { method: 'POST', body: { name, email, password } }),
  login: (email, password) => call('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => call('/auth/me'),
};
