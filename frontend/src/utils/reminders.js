// Smart reminder generator: picks the right tone from the invoice's situation
// and builds ready-to-send WhatsApp / email text.

import { STATUS } from './invoiceCalc.js';
import { formatDateLong, formatINR } from './format.js';

export const TONES = [
  { id: 'friendly', label: 'Friendly', hint: 'Due soon or just overdue' },
  { id: 'firm', label: 'Firm', hint: 'Overdue by more than a week' },
  { id: 'final', label: 'Final notice', hint: 'Overdue by more than 30 days' },
];

/** Suggest a tone based on how late the invoice is. */
export function suggestTone(inv) {
  if (inv.status !== STATUS.OVERDUE) return 'friendly';
  if (inv.daysOverdue > 30) return 'final';
  if (inv.daysOverdue > 7) return 'firm';
  return 'friendly';
}

export function buildReminder(inv, { tone = suggestTone(inv), business = {} } = {}) {
  const name = inv.customerName;
  const amount = formatINR(inv.balance);
  const due = formatDateLong(inv.dueDate);
  const sender = business.ownerName ? `${business.ownerName}\n${business.name}` : business.name || 'PayTrack';
  const upi = business.upiId ? `\nPay via UPI: ${business.upiId}` : '';
  const overdue = inv.status === STATUS.OVERDUE;
  const timing = overdue
    ? `is currently overdue by ${inv.daysOverdue} ${inv.daysOverdue === 1 ? 'day' : 'days'}`
    : inv.daysToDue === 0
      ? 'is due today'
      : `is due in ${inv.daysToDue} ${inv.daysToDue === 1 ? 'day' : 'days'}`;

  const paidLine = inv.paid > 0 ? `\nAmount Paid: ${formatINR(inv.paid)}` : '';
  const details = `Invoice: ${inv.number}\nInvoice Total: ${formatINR(inv.total)}${paidLine}\nDue Date: ${due}\nOutstanding Amount: ${amount}`;

  const bodies = {
    friendly: `Hello ${name},\n\nThis is a friendly reminder that invoice ${inv.number} for ${amount} ${timing}.\n\n${details}${upi}\n\nIf you have already made the payment, please ignore this message or share the reference so we can update our records.\n\nThank you for your business.\n\nRegards,\n${sender}`,
    firm: `Dear ${name},\n\nOur records show that invoice ${inv.number} for ${amount} ${timing}. We request you to clear the outstanding amount at the earliest.\n\n${details}${upi}\n\nPlease share the expected payment date by reply. If payment has been made, kindly send the transaction reference.\n\nRegards,\n${sender}`,
    final: `Dear ${name},\n\nThis is a final reminder regarding invoice ${inv.number}. The amount of ${amount} ${timing} and remains unpaid despite earlier reminders.\n\n${details}${upi}\n\nWe request you to settle this within 3 working days. Please contact us if there is an issue with the invoice so we can resolve it together.\n\nRegards,\n${sender}`,
  };

  const subjects = {
    friendly: `Payment reminder: ${inv.number} (${amount})`,
    firm: `Overdue payment: ${inv.number} (${amount})`,
    final: `Final notice: ${inv.number} (${amount}) overdue`,
  };

  return { tone, subject: subjects[tone], message: bodies[tone] };
}

/** Links that open WhatsApp / the mail app with the message pre-filled. */
export function whatsappLink(phone, message) {
  const digits = String(phone || '').replace(/\D/g, '');
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

export function mailtoLink(email, subject, message) {
  return `mailto:${email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}
