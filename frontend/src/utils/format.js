// Formatting helpers (INR currency, Indian dates). Pure functions, no UI.

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** ₹1,84,500 (whole rupees) */
export const formatINR = (n = 0) => inr.format(Math.round(Number(n) || 0));

/** ₹1,84,500.00 (used on printed invoices) */
export const formatINRPrecise = (n = 0) => inr2.format(Number(n) || 0);

/** Compact INR for chart axes: ₹1.8L, ₹45K */
export const formatINRCompact = (n = 0) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(1).replace(/\.0$/, '')}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(1).replace(/\.0$/, '')}L`;
  if (Math.abs(v) >= 1e3) return `₹${(v / 1e3).toFixed(0)}K`;
  return `₹${v}`;
};

/** "15 Sep 2026" */
export const formatDate = (iso) => {
  if (!iso) return '—';
  const d = parseISODate(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** "15 September 2026" (used in reminder messages) */
export const formatDateLong = (iso) => {
  if (!iso) return '';
  return parseISODate(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** Parses YYYY-MM-DD as a local date (avoids UTC off-by-one). */
export const parseISODate = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

/** Date -> YYYY-MM-DD in local time */
export const toISODate = (date) => {
  const d = new Date(date);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

export const todayISO = () => toISODate(new Date());

export const addDays = (iso, days) => {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

/** Whole days from a -> b (b - a). */
export const daysBetween = (aIso, bIso) => {
  const ms = parseISODate(bIso) - parseISODate(aIso);
  return Math.round(ms / 86400000);
};

export const monthKey = (iso) => String(iso).slice(0, 7); // "2026-09"

export const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short' });
};

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

export const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const pluralize = (n, word, plural = `${word}s`) => `${n} ${n === 1 ? word : plural}`;
