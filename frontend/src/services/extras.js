// Calls the extra endpoints that only the Spring Boot backend has
// (dashboard, search, reminder text, UPI link, print, CSV export).
// They work only when the app runs with VITE_API_URL set.

import { authHeaders, getToken } from './auth';

export const API_URL = import.meta.env.VITE_API_URL || '';
export const extrasAvailable = Boolean(API_URL);

async function get(path) {
  const res = await fetch(`${API_URL}${path}`, { headers: authHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

export const extras = {
  dashboard: () => get('/dashboard'),
  suggestions: () => get('/reminders/suggestions'),
  search: ({ q, status } = {}) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (status) p.set('status', status);
    return get(`/invoices/search?${p}`);
  },
  reminderMessage: (id, channel) => get(`/invoices/${id}/reminder-message?channel=${encodeURIComponent(channel || 'WhatsApp')}`),
  upiLink: (id) => get(`/invoices/${id}/upi-link`),
  statement: (customerId) => get(`/customers/${customerId}/statement`),
  // Links open in a new tab, which cannot send a header, so the token travels in the URL.
  printUrl: (id) => `${API_URL}/invoices/${id}/print?access_token=${encodeURIComponent(getToken() || '')}`,
  invoicesCsvUrl: () => `${API_URL}/export/invoices.csv?access_token=${encodeURIComponent(getToken() || '')}`,
  paymentsCsvUrl: () => `${API_URL}/export/payments.csv?access_token=${encodeURIComponent(getToken() || '')}`,
};
