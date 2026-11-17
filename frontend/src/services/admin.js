// Administrator calls (only accepted by the server for ADMIN accounts).

import { authHeaders } from './auth';

const BASE = import.meta.env.VITE_API_URL || '';

async function call(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 204) return true;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

export const adminApi = {
  overview: () => call('/admin/overview'),
  users: () => call('/admin/users'),
  setActive: (id, active) => call(`/admin/users/${id}`, { method: 'PATCH', body: { active } }),
  create: (name, email, password) => call('/admin/users', { method: 'POST', body: { name, email, password } }),
  resetPassword: (id, password) => call(`/admin/users/${id}/password`, { method: 'POST', body: { password } }),
  activity: () => call('/admin/activity'),
  remove: (id) => call(`/admin/users/${id}`, { method: 'DELETE' }),
};
