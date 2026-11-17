import { useMemo, useState } from 'react';
import { Banknote, CreditCard, Landmark, Smartphone, Wallet, ArrowRight } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import StatusBadge from './StatusBadge';
import { Field, Input, MoneyInput, Select } from './FormField';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import { deriveStatus } from '../utils/invoiceCalc';
import { formatDate, formatINR, todayISO } from '../utils/format';
import { hasErrors, validatePayment } from '../utils/validation';

export const METHODS = [
  { id: 'UPI', icon: Smartphone },
  { id: 'Bank Transfer', icon: Landmark },
  { id: 'Cash', icon: Banknote },
  { id: 'Card', icon: CreditCard },
];

export default function PaymentModal({ initialInvoiceId = '', onClose }) {
  const { invoices, actions, today } = useData();
  const toast = useToast();
  const payable = useMemo(() => invoices.filter((i) => i.status !== 'draft' && i.balance > 0).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1)), [invoices]);

  const [form, setForm] = useState({ invoiceId: payable.some((i) => i.id === initialInvoiceId) ? initialInvoiceId : '', amount: '', method: 'UPI', date: todayISO(), reference: '', note: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const inv = invoices.find((i) => i.id === form.invoiceId);
  const set = (k, v) => {
    const next = { ...form, [k]: v };
    setForm(next);
    if (touched) setErrors(validatePayment(next, { balance: invoices.find((i) => i.id === next.invoiceId)?.balance ?? 0 }));
  };

  const amt = Number(form.amount) || 0;
  const preview = inv && amt > 0 && amt <= inv.balance
    ? { balance: inv.balance - amt, status: deriveStatus({ isDraft: false, total: inv.total, paid: inv.paid + amt, dueDate: inv.dueDate }, today) }
    : null;

  async function submit(e) {
    e?.preventDefault();
    setTouched(true);
    const errs = validatePayment(form, { balance: inv?.balance ?? 0 });
    setErrors(errs);
    if (hasErrors(errs)) return;
    setSaving(true);
    try {
      const res = await actions.recordPayment({ ...form, amount: Number(form.amount) });
      toast.success(`Payment of ${formatINR(res.payment.amount)} recorded`, `${res.invoice.number} is now ${res.statusLabel}${res.invoice.balance > 0 ? ` · ${formatINR(res.invoice.balance)} left to collect` : ''}.`);
      onClose();
    } catch (err) {
      toast.error('Could not record payment', err.message);
      setSaving(false);
    }
  }

  return (
    <Modal
      title="Record Payment"
      subtitle="Balances, status and dashboard totals update automatically."
      icon={Wallet}
      iconTone="green"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="success" loading={saving} onClick={submit}>
            Record Payment
          </Button>
        </>
      }
    >
      {payable.length === 0 ? (
        <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">Every issued invoice is fully paid. There is nothing to collect right now.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Invoice" htmlFor="pay-invoice" required error={errors.invoiceId}>
            <Select id="pay-invoice" value={form.invoiceId} error={errors.invoiceId} onChange={(e) => set('invoiceId', e.target.value)}>
              <option value="">Select an unpaid invoice…</option>
              {payable.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.number} · {i.customerName} · {formatINR(i.balance)} due{i.status === 'overdue' ? ' (overdue)' : ''}
                </option>
              ))}
            </Select>
          </Field>

          {inv && (
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-center">
              <div>
                <p className="eyebrow">Total</p>
                <p className="num mt-0.5 text-sm font-bold text-slate-900">{formatINR(inv.total)}</p>
              </div>
              <div>
                <p className="eyebrow">Paid</p>
                <p className="num mt-0.5 text-sm font-bold text-emerald-700">{formatINR(inv.paid)}</p>
              </div>
              <div>
                <p className="eyebrow">Balance</p>
                <p className="num mt-0.5 text-sm font-bold text-slate-900">{formatINR(inv.balance)}</p>
              </div>
              <div className="col-span-3 flex items-center justify-center gap-2 border-t border-slate-200 pt-2 text-xs text-slate-500">
                <StatusBadge status={inv.status} />
                <span>Due {formatDate(inv.dueDate)}</span>
              </div>
            </div>
          )}

          <Field label="Amount received" htmlFor="pay-amount" required error={errors.amount} hint={inv ? `Up to ${formatINR(inv.balance)}` : undefined}>
            <div className="flex gap-2">
              <div className="flex-1">
                <MoneyInput id="pay-amount" placeholder="0" max={inv?.balance} value={form.amount} error={errors.amount} onChange={(e) => set('amount', e.target.value)} />
              </div>
              {inv && (
                <Button variant="secondary" onClick={() => set('amount', String(inv.balance))}>
                  Full balance
                </Button>
              )}
            </div>
          </Field>

          {preview && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-blue-50 px-3.5 py-2.5 text-[13px] text-blue-900">
              <span className="font-medium">After this payment:</span>
              <span className="num font-bold">{formatINR(preview.balance)} balance</span>
              <ArrowRight className="h-3.5 w-3.5" />
              <StatusBadge status={preview.status} />
            </div>
          )}

          <Field label="Payment method" required error={errors.method}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Payment method">
              {METHODS.map((m) => {
                const active = form.method === m.id;
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={active}
                    key={m.id}
                    onClick={() => set('method', m.id)}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                      active ? 'border-brand-500 bg-brand-50 text-brand-700 ring-4 ring-brand-500/10' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <m.icon className="h-4 w-4" />
                    {m.id === 'Bank Transfer' ? 'Bank' : m.id}
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Payment date" htmlFor="pay-date" required error={errors.date}>
              <Input id="pay-date" type="date" max={todayISO()} value={form.date} error={errors.date} onChange={(e) => set('date', e.target.value)} />
            </Field>
            <Field label="Reference no." htmlFor="pay-ref" required={form.method !== 'Cash'} error={errors.reference}>
              <Input id="pay-ref" placeholder={form.method === 'UPI' ? 'UPI transaction ID' : form.method === 'Cash' ? 'Optional' : 'UTR / cheque / txn no.'} value={form.reference} error={errors.reference} onChange={(e) => set('reference', e.target.value)} />
            </Field>
          </div>
          <button type="submit" className="hidden" />
        </form>
      )}
    </Modal>
  );
}
