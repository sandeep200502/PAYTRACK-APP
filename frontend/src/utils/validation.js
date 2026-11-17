// Form validation rules. Each validator returns an errors object: { field: 'message' }.

import { calcTotals } from './invoiceCalc.js';
import { daysBetween, formatINR, todayISO } from './format.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/;

export const isValidEmail = (v) => EMAIL_RE.test(String(v).trim());
export const isValidPhone = (v) => PHONE_RE.test(String(v).trim());

export function validateCustomer(c, existing = []) {
  const e = {};
  if (!c.name?.trim()) e.name = 'Customer name is required.';
  else if (existing.some((x) => x.id !== c.id && x.name.trim().toLowerCase() === c.name.trim().toLowerCase()))
    e.name = 'A customer with this name already exists.';
  if (!c.email?.trim()) e.email = 'Email is required to send reminders.';
  else if (!isValidEmail(c.email)) e.email = 'Enter a valid email, e.g. accounts@abctraders.in';
  if (c.phone?.trim() && !isValidPhone(c.phone)) e.phone = 'Enter a 10-digit Indian mobile number, e.g. 98401 23456';
  return e;
}

/**
 * @param {object} inv       form values
 * @param {object} ctx       { invoices, paidSoFar, isDraft }
 */
export function validateInvoice(inv, { invoices = [], paidSoFar = 0, isDraft = false } = {}) {
  const e = {};
  if (!inv.number?.trim()) e.number = 'Invoice number is required.';
  else if (invoices.some((x) => x.id !== inv.id && x.number.trim().toLowerCase() === inv.number.trim().toLowerCase()))
    e.number = `${inv.number} is already used. Try another number.`;
  if (!inv.customerName?.trim()) e.customerName = 'Choose or type a customer.';
  if (inv.customerEmail?.trim() && !isValidEmail(inv.customerEmail)) e.customerEmail = 'Enter a valid email address.';
  if (inv.customerPhone?.trim() && !isValidPhone(inv.customerPhone)) e.customerPhone = 'Enter a valid 10-digit mobile number.';
  if (!inv.issueDate) e.issueDate = 'Invoice date is required.';
  if (!inv.dueDate) e.dueDate = 'Due date is required.';
  else if (inv.issueDate && daysBetween(inv.issueDate, inv.dueDate) < 0) e.dueDate = 'Due date cannot be before the invoice date.';

  const itemErrors = {};
  (inv.items || []).forEach((it, idx) => {
    const ie = {};
    if (!it.description?.trim()) ie.description = 'Add a description.';
    if (it.quantity === '' || Number(it.quantity) <= 0) ie.quantity = 'Must be more than 0.';
    if (it.unitPrice === '' || Number(it.unitPrice) < 0) ie.unitPrice = 'Cannot be negative.';
    if (Object.keys(ie).length) itemErrors[idx] = ie;
  });
  if (!inv.items?.length) e.items = 'Add at least one line item.';
  if (Object.keys(itemErrors).length) e.itemErrors = itemErrors;

  if (Number(inv.discountValue) < 0) e.discountValue = 'Discount cannot be negative.';
  if (inv.discountType === 'percent' && Number(inv.discountValue) > 100) e.discountValue = 'Discount cannot exceed 100%.';
  const { subtotal, total } = calcTotals(inv);
  if (inv.discountType === 'flat' && Number(inv.discountValue) > subtotal) e.discountValue = 'Discount cannot exceed the subtotal.';
  if (!isDraft && total <= 0 && !e.items && !e.itemErrors) e.total = 'Invoice total must be more than ₹0.';
  if (paidSoFar > 0 && total < paidSoFar)
    e.total = `This invoice already has ${formatINR(paidSoFar)} in payments. The total cannot go below that.`;
  return e;
}

export function validatePayment(p, { balance = 0 } = {}) {
  const e = {};
  if (!p.invoiceId) e.invoiceId = 'Select the invoice this payment is for.';
  const amt = Number(p.amount);
  if (p.amount === '' || p.amount === null || Number.isNaN(amt)) e.amount = 'Enter the amount received.';
  else if (amt <= 0) e.amount = 'Amount must be more than ₹0.';
  else if (p.invoiceId && amt > balance + 0.001) e.amount = `Amount cannot exceed the remaining balance of ${formatINR(balance)}.`;
  if (!p.method) e.method = 'Choose a payment method.';
  if (!p.date) e.date = 'Payment date is required.';
  else if (daysBetween(todayISO(), p.date) > 0) e.date = 'Payment date cannot be in the future.';
  if (p.method && p.method !== 'Cash' && !p.reference?.trim()) e.reference = `Add the ${p.method === 'UPI' ? 'UPI transaction ID' : 'reference number'} for your records.`;
  return e;
}

export const hasErrors = (e) => Object.keys(e).length > 0;
