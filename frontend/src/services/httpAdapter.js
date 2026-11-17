// Storage adapter #2: REST API (see /server). Same interface as localAdapter.
// Enable it by starting the server (`npm run server`) and running the app with
// VITE_API_URL=http://localhost:4000/api  (see README).

import { authHeaders, clearToken, getToken } from './auth';

const BASE = import.meta.env.VITE_API_URL;

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    // Expired or invalid token, or an account an admin has disabled: forget the token
    // and let the app show the login page.
    if (getToken() && (res.status === 401 || (res.status === 403 && /disabled/i.test(msg.error || '')))) {
      clearToken();
      window.dispatchEvent(new Event('paytrack:logout'));
    }
    throw new Error(msg.error || `Request failed (${res.status})`);
  }
  return res.status === 204 ? true : res.json();
}

export const httpAdapter = {
  name: 'REST API',
  bootstrap: () => request('/bootstrap'),
  create: (collection, record) => request(`/${collection}`, { method: 'POST', body: record }),
  update: (collection, id, patch) => request(`/${collection}/${id}`, { method: 'PATCH', body: patch }),
  remove: (collection, id) => request(`/${collection}/${id}`, { method: 'DELETE' }),
  saveSettings: (settings) => request('/settings', { method: 'PUT', body: settings }),
  reset: () => request('/system/reset', { method: 'POST' }),
  clear: () => request('/system/clear', { method: 'POST' }),
};
