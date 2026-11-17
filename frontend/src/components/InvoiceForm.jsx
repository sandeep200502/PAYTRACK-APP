import { useMemo, useState } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import Button from './Button';
import { Field, Input, MoneyInput, Select, Textarea } from './FormField';
import { calcTotals, lineAmount } from '../utils/invoiceCalc';
import { addDays, formatINRPrecise, todayISO } from '../utils/format';
import { hasErrors, validateInvoice } from '../utils/validation';

const blankItem = () => ({ id: Math.random().toString(36).slice(2), description: '', quantity: 1, unitPrice: '' });

/**
 * Create / edit invoice. Totals recalculate live on every keystroke.
 * onSubmit(values, { asDraft }) must return a promise.
 */
export default function InvoiceForm({ initial, customers, invoices, settings, paidSoFar = 0, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => initial);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(null);

  const totals = useMemo(() => calcTotals(form), [form]);
  const isEdit = !!form.id;
  const customerMatch = customers.find((c) => c.id === form.customerId);

  const update = (next) => {
    setForm(next);
    if (submitted) setErrors(validateInvoice(next, { invoices, paidSoFar, isDraft: next.isDraft }));
  };
  const set = (k, v) => update({ ...form, [k]: v });

  const pickCustomer = (id) => {
    const c = customers.find((x) => x.id === id);
    if (!c) return update({ ...form, customerId: '', customerName: '', customerEmail: '', customerPhone: '' });
    update({ ...form, customerId: c.id, customerName: c.name, customerEmail: c.email || '', customerPhone: c.phone || '' });
  };

  const setItem = (idx, k, v) => update({ ...form, items: form.items.map((it, i) => (i === idx ? { ...it, [k]: v } : it)) });
  const addItem = () => update({ ...form, items: [...form.items, blankItem()] });
  const removeItem = (idx) => update({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const setTerms = (days) => set('dueDate', addDays(form.issueDate || todayISO(), days));

  async function submit(asDraft) {
    setSubmitted(true);
    const values = { ...form, isDraft: asDraft };
    const errs = validateInvoice(values, { invoices, paidSoFar, isDraft: asDraft });
    setErrors(errs);
    if (hasErrors(errs)) {
      document.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    setSaving(asDraft ? 'draft' : 'final');
    try {
      await onSubmit(values, { asDraft });
    } finally {
      setSaving(null);
    }
  }

  const ie = errors.itemErrors || {};

  return (
    <form
      className="grid gap-6 xl:grid-cols-[1fr_340px]"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
    >
      <div className="space-y-6">
        {/* Details */}
        <section className="card p-5 sm:p-6">
          <h2 className="text-[15px] font-bold text-slate-900">Invoice details</h2>
          <p className="mb-5 mt-0.5 text-[13px] text-slate-500">Fields marked * are required.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Invoice number" htmlFor="f-number" required error={errors.number}>
              <Input id="f-number" value={form.number} error={errors.number} onChange={(e) => set('number', e.target.value)} />
            </Field>
            <Field label="Customer" htmlFor="f-customer" required error={errors.customerName} hint={!form.customerId && form.customerName ? 'New customer will be added to your list.' : undefined}>
              {form.customerId || !form._typing ? (
                <Select id="f-customer" value={form.customerId} error={errors.customerName} onChange={(e) => (e.target.value === '__new' ? update({ ...form, customerId: '', customerName: '', _typing: true }) : pickCustomer(e.target.value))}>
                  <option value="">Select customer…</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="__new">+ Add a new customer</option>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Input id="f-customer" autoFocus placeholder="New customer name" value={form.customerName} error={errors.customerName} onChange={(e) => set('customerName', e.target.value)} />
                  <Button variant="secondary" onClick={() => update({ ...form, _typing: false, customerName: '' })}>
                    List
                  </Button>
                </div>
              )}
            </Field>
            <Field label="Customer email" htmlFor="f-email" error={errors.customerEmail}>
              <Input id="f-email" type="email" placeholder="accounts@company.in" value={form.customerEmail} error={errors.customerEmail} onChange={(e) => set('customerEmail', e.target.value)} />
            </Field>
            <Field label="Customer phone" htmlFor="f-phone" error={errors.customerPhone}>
              <Input id="f-phone" type="tel" placeholder="98401 23456" value={form.customerPhone} error={errors.customerPhone} onChange={(e) => set('customerPhone', e.target.value)} />
            </Field>
            <Field label="Invoice date" htmlFor="f-issue" required error={errors.issueDate}>
              <Input id="f-issue" type="date" value={form.issueDate} error={errors.issueDate} onChange={(e) => set('issueDate', e.target.value)} />
            </Field>
            <Field label="Due date" htmlFor="f-due" required error={errors.dueDate}>
              <Input id="f-due" type="date" min={form.issueDate} value={form.dueDate} error={errors.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
              <div className="mt-2 flex gap-1.5">
                {[7, 15, 30, 45].map((d) => (
                  <button key={d} type="button" onClick={() => setTerms(d)} className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">
                    Net {d}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          {customerMatch?.gstin && <p className="mt-4 text-xs text-slate-500">Customer GSTIN: <span className="font-semibold text-slate-700">{customerMatch.gstin}</span></p>}
        </section>

        {/* Items */}
        <section className="card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Items</h2>
              <p className="mt-0.5 text-[13px] text-slate-500">Amount = quantity × unit price</p>
            </div>
            <Button variant="secondary" size="sm" icon={Plus} onClick={addItem}>
              Add Item
            </Button>
          </div>

          <div className="hidden grid-cols-[1fr_90px_140px_120px_36px] gap-3 border-b border-slate-100 pb-2 md:grid">
            <span className="eyebrow">Description</span>
            <span className="eyebrow">Qty</span>
            <span className="eyebrow">Unit price</span>
            <span className="eyebrow text-right">Amount</span>
            <span />
          </div>

          <div className="divide-y divide-slate-100">
            {form.items.map((it, idx) => (
              <div key={it.id} className="grid grid-cols-2 gap-3 py-3 md:grid-cols-[1fr_90px_140px_120px_36px] md:items-start">
                <div className="col-span-2 md:col-span-1">
                  <label className="label md:sr-only" htmlFor={`it-d-${idx}`}>
                    Description <span className="text-red-500">*</span>
                  </label>
                  <Input id={`it-d-${idx}`} placeholder="e.g. Website redesign" value={it.description} error={ie[idx]?.description} onChange={(e) => setItem(idx, 'description', e.target.value)} />
                  {ie[idx]?.description && <p className="mt-1 text-xs font-medium text-red-600">{ie[idx].description}</p>}
                </div>
                <div>
                  <label className="label md:sr-only" htmlFor={`it-q-${idx}`}>
                    Qty
                  </label>
                  <Input id={`it-q-${idx}`} type="number" inputMode="decimal" min="0" step="1" className="num" value={it.quantity} error={ie[idx]?.quantity} onChange={(e) => setItem(idx, 'quantity', e.target.value)} />
                  {ie[idx]?.quantity && <p className="mt-1 text-xs font-medium text-red-600">{ie[idx].quantity}</p>}
                </div>
                <div>
                  <label className="label md:sr-only" htmlFor={`it-p-${idx}`}>
                    Unit price
                  </label>
                  <MoneyInput id={`it-p-${idx}`} placeholder="0" value={it.unitPrice} error={ie[idx]?.unitPrice} onChange={(e) => setItem(idx, 'unitPrice', e.target.value)} />
                  {ie[idx]?.unitPrice && <p className="mt-1 text-xs font-medium text-red-600">{ie[idx].unitPrice}</p>}
                </div>
                <div className="num flex items-center justify-between md:block md:pt-2.5 md:text-right">
                  <span className="eyebrow md:hidden">Amount</span>
                  <span className="text-sm font-semibold text-slate-900">{formatINRPrecise(lineAmount(it))}</span>
                </div>
                <div className="flex items-center justify-end md:pt-1">
                  <button type="button" disabled={form.items.length === 1} onClick={() => removeItem(idx)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent" aria-label={`Remove item ${idx + 1}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {errors.items && <p className="mt-2 text-xs font-medium text-red-600">{errors.items}</p>}

          <div className="mt-4 border-t border-slate-100 pt-4">
            <Field label="Notes for customer" htmlFor="f-notes">
              <Textarea id="f-notes" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Payment terms, bank details, thank-you note…" />
            </Field>
          </div>
        </section>
      </div>

      {/* Summary */}
      <aside className="xl:sticky xl:top-24 xl:self-start">
        <section className="card p-5 sm:p-6">
          <h2 className="text-[15px] font-bold text-slate-900">Summary</h2>
          <p className="mt-0.5 text-[13px] text-slate-500">Calculated automatically</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Field label="Discount" htmlFor="f-disc" error={errors.discountValue}>
              <Input id="f-disc" type="number" min="0" inputMode="decimal" className="num" value={form.discountValue} error={errors.discountValue} onChange={(e) => set('discountValue', e.target.value)} />
            </Field>
            <Field label="Type" htmlFor="f-disc-type">
              <Select id="f-disc-type" value={form.discountType} onChange={(e) => set('discountType', e.target.value)}>
                <option value="flat">₹ Flat</option>
                <option value="percent">% Percent</option>
              </Select>
            </Field>
            <Field label="GST rate" htmlFor="f-tax" className="col-span-2">
              <Select id="f-tax" value={form.taxRate} onChange={(e) => set('taxRate', e.target.value)}>
                {[0, 5, 12, 18, 28].map((r) => (
                  <option key={r} value={r}>
                    GST {r}%{r === Number(settings.defaultTaxRate) ? ' (default)' : ''}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <dl className="num mt-5 space-y-2.5 border-t border-dashed border-slate-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd className="font-medium text-slate-900">{formatINRPrecise(totals.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Discount{form.discountType === 'percent' && Number(form.discountValue) ? ` (${form.discountValue}%)` : ''}</dt>
              <dd className="font-medium text-red-600">− {formatINRPrecise(totals.discount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">GST ({Number(form.taxRate) || 0}%)</dt>
              <dd className="font-medium text-slate-900">+ {formatINRPrecise(totals.tax)}</dd>
            </div>
            {Number(form.taxRate) > 0 && (
              <div className="flex justify-between text-xs text-slate-400">
                <dt>CGST {Number(form.taxRate) / 2}% + SGST {Number(form.taxRate) / 2}%</dt>
                <dd>{formatINRPrecise(totals.tax / 2)} each</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-slate-200 pt-3">
              <dt className="font-bold text-slate-900">Grand Total</dt>
              <dd className="text-xl font-bold text-slate-900">{formatINRPrecise(totals.total)}</dd>
            </div>
          </dl>
          {errors.total && (
            <p className="mt-3 flex gap-1.5 rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-700">
              <Info className="h-4 w-4 shrink-0" /> {errors.total}
            </p>
          )}

          <div className="mt-6 grid gap-2">
            <Button type="submit" loading={saving === 'final'} onClick={(e) => { e.preventDefault(); submit(false); }}>
              {isEdit && !initial.isDraft ? 'Save Changes' : 'Create Invoice'}
            </Button>
            {(!isEdit || initial.isDraft) && (
              <Button variant="secondary" loading={saving === 'draft'} onClick={() => submit(true)}>
                Save Draft
              </Button>
            )}
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </section>
      </aside>
    </form>
  );
}

export { blankItem };
