import { useEffect, useState } from 'react';
import { Building2, FileCog, Server } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Button from '../components/Button';
import { Field, Input, Select } from '../components/FormField';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import { isValidEmail } from '../utils/validation';

export default function Settings() {
  const { settings, actions, storageName, customers, invoices, payments } = useData();
  const toast = useToast();
  const [form, setForm] = useState(settings);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(settings), [settings]);
  const set = (k, v) => setForm({ ...form, [k]: v });

  const save = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name?.trim()) errs.name = 'Business name is required.';
    if (!form.ownerName?.trim()) errs.ownerName = 'Your name is required.';
    if (form.email && !isValidEmail(form.email)) errs.email = 'Enter a valid email.';
    if (!(Number(form.defaultDueDays) >= 0)) errs.defaultDueDays = 'Enter 0 or more days.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    await actions.saveSettings({ ...form, defaultTaxRate: Number(form.defaultTaxRate), defaultDueDays: Number(form.defaultDueDays) });
    setSaving(false);
    toast.success('Settings saved', 'New invoices and reminders will use these details.');
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Business details used on invoices and reminders." />
      <div className="grid gap-6 xl:grid-cols-3">
        <form onSubmit={save} noValidate className="card p-5 sm:p-6 xl:col-span-2">
          <div className="mb-5 flex items-center gap-2.5">
            <Building2 className="h-5 w-5 text-brand-600" />
            <h2 className="text-[15px] font-bold text-slate-900">Business profile</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business name" htmlFor="s-name" required error={errors.name}>
              <Input id="s-name" value={form.name} error={errors.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="Your name" htmlFor="s-owner" required error={errors.ownerName}>
              <Input id="s-owner" value={form.ownerName} error={errors.ownerName} onChange={(e) => set('ownerName', e.target.value)} />
            </Field>
            <Field label="Email" htmlFor="s-email" error={errors.email}>
              <Input id="s-email" type="email" value={form.email} error={errors.email} onChange={(e) => set('email', e.target.value)} />
            </Field>
            <Field label="Phone" htmlFor="s-phone">
              <Input id="s-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label="Address" htmlFor="s-address" className="sm:col-span-2">
              <Input id="s-address" value={form.address} onChange={(e) => set('address', e.target.value)} />
            </Field>
            <Field label="GSTIN" htmlFor="s-gstin">
              <Input id="s-gstin" value={form.gstin} maxLength={15} onChange={(e) => set('gstin', e.target.value.toUpperCase())} />
            </Field>
            <Field label="UPI ID" htmlFor="s-upi" hint="Added to reminders and invoices so customers can pay instantly.">
              <Input id="s-upi" value={form.upiId} onChange={(e) => set('upiId', e.target.value)} />
            </Field>
          </div>

          <div className="mb-5 mt-8 flex items-center gap-2.5">
            <FileCog className="h-5 w-5 text-brand-600" />
            <h2 className="text-[15px] font-bold text-slate-900">Invoice defaults</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Number prefix" htmlFor="s-prefix">
              <Input id="s-prefix" value={form.invoicePrefix} onChange={(e) => set('invoicePrefix', e.target.value)} />
            </Field>
            <Field label="Default GST" htmlFor="s-gst">
              <Select id="s-gst" value={form.defaultTaxRate} onChange={(e) => set('defaultTaxRate', e.target.value)}>
                {[0, 5, 12, 18, 28].map((r) => (
                  <option key={r} value={r}>{r}%</option>
                ))}
              </Select>
            </Field>
            <Field label="Payment terms (days)" htmlFor="s-days" error={errors.defaultDueDays}>
              <Input id="s-days" type="number" min="0" value={form.defaultDueDays} error={errors.defaultDueDays} onChange={(e) => set('defaultDueDays', e.target.value)} />
            </Field>
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit" loading={saving}>
              Save Settings
            </Button>
          </div>
        </form>

        <div className="space-y-4">
          <section className="card p-5">
            <div className="mb-3 flex items-center gap-2.5">
              <Server className="h-5 w-5 text-brand-600" />
              <h2 className="text-[15px] font-bold text-slate-900">Data storage</h2>
            </div>
            <p className="text-sm text-slate-600">
              Connected to <b>{storageName}</b>. Changes are saved instantly and survive a page refresh.
            </p>
            <dl className="num mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ['Customers', customers.length],
                ['Invoices', invoices.length],
                ['Payments', payments.length],
              ].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-slate-50 py-2.5">
                  <dd className="text-lg font-bold text-slate-900">{v}</dd>
                  <dt className="text-[11px] text-slate-500">{l}</dt>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </>
  );
}
