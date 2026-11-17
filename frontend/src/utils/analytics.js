// Analytics engine: KPIs, cash flow, aging, customer behaviour and rule-based insights.
// Every number shown on Dashboard / Reports / Overdue is computed here from live data.

import { STATUS } from './invoiceCalc.js';
import { addDays, daysBetween, formatINR, monthKey, monthLabel, pluralize, todayISO, toISODate } from './format.js';

const sum = (arr, fn) => arr.reduce((s, x) => s + (Number(fn(x)) || 0), 0);
const isOpen = (inv) => inv.status === STATUS.PENDING || inv.status === STATUS.PARTIAL || inv.status === STATUS.OVERDUE;
const issued = (invoices) => invoices.filter((i) => i.status !== STATUS.DRAFT);

export function computeKpis(invoices, payments, today = todayISO()) {
  const thisMonth = monthKey(today);
  const lastMonthDate = new Date(Number(thisMonth.slice(0, 4)), Number(thisMonth.slice(5, 7)) - 2, 1);
  const lastMonth = monthKey(toISODate(lastMonthDate));
  const totalRevenue = sum(payments, (p) => p.amount);
  const totalBilled = sum(issued(invoices), (i) => i.total);
  return {
    totalRevenue,
    totalBilled,
    pending: sum(invoices.filter((i) => i.status === STATUS.PENDING || i.status === STATUS.PARTIAL), (i) => i.balance),
    overdue: sum(invoices.filter((i) => i.status === STATUS.OVERDUE), (i) => i.balance),
    overdueCount: invoices.filter((i) => i.status === STATUS.OVERDUE).length,
    paidThisMonth: sum(payments.filter((p) => monthKey(p.date) === thisMonth), (p) => p.amount),
    paidLastMonth: sum(payments.filter((p) => monthKey(p.date) === lastMonth), (p) => p.amount),
    paymentsThisMonth: payments.filter((p) => monthKey(p.date) === thisMonth).length,
    activeInvoices: invoices.filter(isOpen).length,
    draftCount: invoices.filter((i) => i.status === STATUS.DRAFT).length,
    outstanding: sum(invoices.filter(isOpen), (i) => i.balance),
    collectionRate: totalBilled > 0 ? Math.round((totalRevenue / totalBilled) * 100) : 0,
  };
}

/** Invoiced vs collected for the last `months` months (including the current month). */
export function monthlySeries(invoices, payments, months = 6, today = todayISO()) {
  const [y, m] = today.split('-').map(Number);
  const keys = [];
  for (let k = months - 1; k >= 0; k -= 1) keys.push(monthKey(toISODate(new Date(y, m - 1 - k, 1))));
  return keys.map((key) => ({
    key,
    month: monthLabel(key),
    invoiced: sum(issued(invoices).filter((i) => monthKey(i.issueDate) === key), (i) => i.total),
    collected: sum(payments.filter((p) => monthKey(p.date) === key), (p) => p.amount),
  }));
}

export const STATUS_COLORS = {
  paid: '#16a34a',
  partial: '#2563eb',
  pending: '#d97706',
  overdue: '#dc2626',
  draft: '#94a3b8',
};

export function statusDistribution(invoices, { includeDraft = false } = {}) {
  const order = ['paid', 'partial', 'pending', 'overdue', ...(includeDraft ? ['draft'] : [])];
  const names = { paid: 'Paid', partial: 'Partially Paid', pending: 'Pending', overdue: 'Overdue', draft: 'Draft' };
  return order.map((s) => {
    const list = invoices.filter((i) => i.status === s);
    return {
      status: s,
      name: names[s],
      count: list.length,
      amount: s === 'paid' ? sum(list, (i) => i.total) : sum(list, (i) => (s === 'draft' ? i.total : i.balance)),
      color: STATUS_COLORS[s],
    };
  });
}

/** Expected incoming cash, bucketed by due date. */
export function cashFlow(invoices, today = todayISO()) {
  const open = invoices.filter(isOpen);
  const within = (lo, hi) => open.filter((i) => i.status !== STATUS.OVERDUE && i.daysToDue >= lo && i.daysToDue <= hi);
  const overdue = open.filter((i) => i.status === STATUS.OVERDUE);
  const thisWeek = within(0, 7);
  const nextWeek = within(8, 14);
  const later = within(15, 10000);
  const out = {
    overdue: sum(overdue, (i) => i.balance),
    thisWeek: sum(thisWeek, (i) => i.balance),
    nextWeek: sum(nextWeek, (i) => i.balance),
    later: sum(later, (i) => i.balance),
    counts: { overdue: overdue.length, thisWeek: thisWeek.length, nextWeek: nextWeek.length, later: later.length },
  };
  out.total = out.overdue + out.thisWeek + out.nextWeek + out.later;
  out.chart = [
    { name: 'Overdue', amount: out.overdue, fill: STATUS_COLORS.overdue, range: 'Past due date' },
    { name: 'This week', amount: out.thisWeek, fill: '#2563eb', range: `Due by ${addDays(today, 7)}` },
    { name: 'Next week', amount: out.nextWeek, fill: '#60a5fa', range: `Due ${addDays(today, 8)} – ${addDays(today, 14)}` },
    { name: 'Later', amount: out.later, fill: '#bfdbfe', range: `Due after ${addDays(today, 14)}` },
  ];
  return out;
}

/** Outstanding overdue balance by how late it is. Older buckets = higher collection risk. */
export function agingBuckets(invoices) {
  const overdue = invoices.filter((i) => i.status === STATUS.OVERDUE);
  const buckets = [
    { key: '0-7', label: '0–7 days', min: 0, max: 7, color: '#fbbf24', risk: 'Low' },
    { key: '8-30', label: '8–30 days', min: 8, max: 30, color: '#f97316', risk: 'Medium' },
    { key: '31-60', label: '31–60 days', min: 31, max: 60, color: '#dc2626', risk: 'High' },
    { key: '60+', label: '60+ days', min: 61, max: Infinity, color: '#7f1d1d', risk: 'Critical' },
  ];
  return buckets.map((b) => {
    const list = overdue.filter((i) => i.daysOverdue >= b.min && i.daysOverdue <= b.max);
    return { ...b, count: list.length, amount: sum(list, (i) => i.balance) };
  });
}

/**
 * Customer payment behaviour, learned from history:
 * average days taken to pay, on-time rate, and a simple risk label.
 */
export function customerStats(customer, invoices, payments) {
  const own = invoices.filter((i) => i.customerId === customer.id);
  const live = issued(own);
  const ownPayments = payments.filter((p) => own.some((i) => i.id === p.invoiceId));
  const settled = live.filter((i) => i.status === STATUS.PAID && i.paidOnDate);
  const lateness = settled.map((i) => daysBetween(i.dueDate, i.paidOnDate));
  const onTime = lateness.filter((d) => d <= 0).length;
  const overdueList = live.filter((i) => i.status === STATUS.OVERDUE);
  const maxOverdue = overdueList.reduce((m, i) => Math.max(m, i.daysOverdue), 0);
  const avgDaysToPay = settled.length
    ? Math.round(sum(settled, (i) => daysBetween(i.issueDate, i.paidOnDate)) / settled.length)
    : null;
  const onTimeRate = settled.length ? Math.round((onTime / settled.length) * 100) : null;

  let behaviour;
  if (overdueList.length && maxOverdue > 30) behaviour = { label: 'High risk', tone: 'red', note: `Has an invoice ${maxOverdue} days overdue` };
  else if (overdueList.length) behaviour = { label: 'Needs follow-up', tone: 'amber', note: `${pluralize(overdueList.length, 'invoice')} overdue` };
  else if (!settled.length) behaviour = { label: 'New customer', tone: 'slate', note: 'Not enough payment history yet' };
  else if (onTimeRate >= 80) behaviour = { label: 'Reliable payer', tone: 'green', note: `Pays on time ${onTimeRate}% of the time` };
  else behaviour = { label: 'Occasionally late', tone: 'amber', note: `Pays on time ${onTimeRate}% of the time` };

  return {
    invoiceCount: own.length,
    billed: sum(live, (i) => i.total),
    paid: sum(ownPayments, (p) => p.amount),
    outstanding: sum(live, (i) => i.balance),
    overdue: sum(overdueList, (i) => i.balance),
    overdueCount: overdueList.length,
    avgDaysToPay,
    onTimeRate,
    behaviour,
    lastPaymentDate: ownPayments.map((p) => p.date).sort().pop() ?? null,
  };
}

export function topCustomers(customers, invoices, payments, limit = 5) {
  return customers
    .map((c) => ({ id: c.id, name: c.name, ...customerStats(c, invoices, payments) }))
    .filter((c) => c.billed > 0)
    .sort((a, b) => b.billed - a.billed)
    .slice(0, limit);
}

export const METHOD_COLORS = { UPI: '#2563eb', 'Bank Transfer': '#0f766e', Cash: '#d97706', Card: '#7c3aed' };

export function paymentMethodBreakdown(payments) {
  return ['UPI', 'Bank Transfer', 'Cash', 'Card'].map((m) => {
    const list = payments.filter((p) => p.method === m);
    return { name: m, count: list.length, amount: sum(list, (p) => p.amount), color: METHOD_COLORS[m] };
  });
}

/**
 * Rule-based "Smart Insights". Each rule inspects the live data and only fires when relevant.
 * tone: danger | warning | success | info  (maps to red / amber / green / blue)
 */
export function generateInsights({ invoices, payments, customers }, today = todayISO()) {
  const k = computeKpis(invoices, payments, today);
  const cf = cashFlow(invoices, today);
  const aging = agingBuckets(invoices);
  const out = [];

  if (k.overdue > 0) {
    out.push({
      id: 'overdue', tone: 'danger', icon: 'alert',
      title: `${formatINR(k.overdue)} is currently overdue`,
      detail: `${pluralize(k.overdueCount, 'invoice')} crossed the due date with money still owed.`,
      action: { label: 'View overdue', to: '/overdue' },
    });
  }

  const critical = aging.filter((b) => b.min > 30).reduce((s, b) => s + b.amount, 0);
  if (critical > 0) {
    out.push({
      id: 'aging', tone: 'danger', icon: 'hourglass',
      title: `${formatINR(critical)} has been unpaid for over 30 days`,
      detail: 'Older dues are harder to collect. Prioritise these customers today.',
      action: { label: 'See aging', to: '/overdue' },
    });
  }

  if (cf.thisWeek > 0) {
    out.push({
      id: 'expected', tone: 'info', icon: 'wallet',
      title: `${formatINR(cf.thisWeek)} expected in the next 7 days`,
      detail: `From ${pluralize(cf.counts.thisWeek, 'invoice')} due this week.`,
      action: { label: 'Cash flow', to: '/reports' },
    });
  }

  const dueSoon = invoices.filter((i) => (i.status === STATUS.PENDING || i.status === STATUS.PARTIAL) && i.daysToDue >= 0 && i.daysToDue <= 3);
  if (dueSoon.length) {
    out.push({
      id: 'due-soon', tone: 'warning', icon: 'bell',
      title: `${pluralize(dueSoon.length, 'invoice')} due within 3 days`,
      detail: 'Send a friendly reminder now so they do not slip into overdue.',
      action: { label: 'Send reminders', to: '/reminders' },
    });
  }

  if (k.paidLastMonth > 0) {
    const change = Math.round(((k.paidThisMonth - k.paidLastMonth) / k.paidLastMonth) * 100);
    out.push({
      id: 'trend', tone: change >= 0 ? 'success' : 'warning', icon: change >= 0 ? 'up' : 'down',
      title: change >= 0 ? `Collections are up ${change}% this month` : `Collections are down ${Math.abs(change)}% this month`,
      detail: `${formatINR(k.paidThisMonth)} received so far vs ${formatINR(k.paidLastMonth)} last month.`,
      action: { label: 'Open reports', to: '/reports' },
    });
  }

  const ranked = customers
    .map((c) => ({ c, s: customerStats(c, invoices, payments) }))
    .filter((x) => x.s.outstanding > 0)
    .sort((a, b) => b.s.outstanding - a.s.outstanding);
  if (ranked.length) {
    const top = ranked[0];
    out.push({
      id: 'top-outstanding', tone: 'info', icon: 'user',
      title: `${top.c.name} owes you the most`,
      detail: `${formatINR(top.s.outstanding)} outstanding across ${pluralize(top.s.invoiceCount, 'invoice')}.`,
      action: { label: 'View customer', to: `/customers/${top.c.id}` },
    });
  }

  const slow = customers
    .map((c) => ({ c, s: customerStats(c, invoices, payments) }))
    .filter((x) => x.s.onTimeRate !== null && x.s.onTimeRate < 60);
  if (slow.length) {
    out.push({
      id: 'slow', tone: 'warning', icon: 'clock',
      title: `${slow[0].c.name} usually pays late`,
      detail: `On time only ${slow[0].s.onTimeRate}% of the time. Consider shorter terms or advance payment.`,
      action: { label: 'View customer', to: `/customers/${slow[0].c.id}` },
    });
  }

  if (k.totalBilled > 0) {
    out.push({
      id: 'collection', tone: k.collectionRate >= 75 ? 'success' : 'warning', icon: 'check',
      title: `${k.collectionRate}% of everything billed has been collected`,
      detail: `${formatINR(k.totalRevenue)} received of ${formatINR(k.totalBilled)} invoiced.`,
    });
  }

  if (k.draftCount > 0) {
    out.push({
      id: 'drafts', tone: 'info', icon: 'file',
      title: `${pluralize(k.draftCount, 'draft invoice')} not sent yet`,
      detail: 'Drafts do not count towards your receivables until issued.',
      action: { label: 'Review drafts', to: '/invoices?status=draft' },
    });
  }

  return out;
}
