// Core invoice business rules: totals and automatic status.
// Kept free of React so it can be unit-tested or moved to a backend unchanged.

import { daysBetween, todayISO } from './format.js';

export const STATUS = {
  PAID: 'paid',
  PARTIAL: 'partial',
  PENDING: 'pending',
  OVERDUE: 'overdue',
  DRAFT: 'draft',
};

export const STATUS_LABEL = {
  paid: 'Paid',
  partial: 'Partially Paid',
  pending: 'Pending',
  overdue: 'Overdue',
  draft: 'Draft',
};

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const lineAmount = (item) => round2((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));

/**
 * Subtotal -> discount -> GST on the discounted value -> grand total.
 * Example: 40,000 - 2,000 = 38,000; GST 18% = 6,840; total 44,840.
 */
export function calcTotals({ items = [], discountType = 'flat', discountValue = 0, taxRate = 0 }) {
  const subtotal = round2(items.reduce((sum, it) => sum + lineAmount(it), 0));
  const rawDiscount = discountType === 'percent' ? (subtotal * (Number(discountValue) || 0)) / 100 : Number(discountValue) || 0;
  const discount = round2(Math.min(Math.max(rawDiscount, 0), subtotal));
  const taxable = round2(subtotal - discount);
  const tax = round2((taxable * (Number(taxRate) || 0)) / 100);
  const total = round2(taxable + tax);
  return { subtotal, discount, taxable, tax, total };
}

/**
 * Automatic status rules (evaluated every render, so status is never stale):
 *  - Draft invoices stay Draft until issued
 *  - balance <= 0                        -> PAID
 *  - balance > 0 and today > due date    -> OVERDUE
 *  - paid > 0 and balance > 0            -> PARTIALLY PAID
 *  - otherwise                           -> PENDING
 */
export function deriveStatus({ isDraft, total, paid, dueDate }, today = todayISO()) {
  if (isDraft) return STATUS.DRAFT;
  const balance = round2(total - paid);
  if (balance <= 0) return STATUS.PAID;
  if (dueDate && daysBetween(dueDate, today) > 0) return STATUS.OVERDUE;
  if (paid > 0) return STATUS.PARTIAL;
  return STATUS.PENDING;
}

/**
 * Joins an invoice with its payments and customer, and computes every derived field
 * the UI needs. The stored invoice only holds source data.
 */
export function enrichInvoice(invoice, payments, customersById, today = todayISO()) {
  const own = payments.filter((p) => p.invoiceId === invoice.id);
  const totals = calcTotals(invoice);
  const paid = round2(own.reduce((s, p) => s + Number(p.amount || 0), 0));
  const balance = round2(Math.max(totals.total - paid, 0));
  const status = deriveStatus({ isDraft: invoice.isDraft, total: totals.total, paid, dueDate: invoice.dueDate }, today);
  const daysToDue = invoice.dueDate ? daysBetween(today, invoice.dueDate) : null;
  const lastPayment = own.slice().sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const customer = customersById[invoice.customerId];
  return {
    ...invoice,
    ...totals,
    customerName: customer?.name ?? invoice.customerName ?? 'Unknown customer',
    customerEmail: invoice.customerEmail || customer?.email || '',
    customerPhone: invoice.customerPhone || customer?.phone || '',
    paid,
    balance,
    status,
    daysToDue,
    daysOverdue: status === STATUS.OVERDUE ? -daysToDue : 0,
    paymentCount: own.length,
    lastPaymentDate: lastPayment?.date ?? null,
    paidOnDate: status === STATUS.PAID ? lastPayment?.date ?? null : null,
  };
}

/** Next invoice number such as INV-1031, based on the highest existing number. */
export function nextInvoiceNumber(invoices, prefix = 'INV-') {
  const max = invoices.reduce((m, inv) => {
    const n = parseInt(String(inv.number).replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 1000);
  return `${prefix}${max + 1}`;
}
