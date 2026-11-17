import { useState } from 'react';
import { UserRound } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import { Field, Input } from './FormField';
import { useData } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import { hasErrors, validateCustomer } from '../utils/validation';

const EMPTY = { name: '', contactPerson: '', email: '', phone: '', city: '', gstin: '' };

export default function CustomerFormModal({ customer, onClose, onSaved }) {
  const { customers, actions } = useData();
  const toast = useToast();
  const [form, setForm] = useState({ ...EMPTY, ...customer });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => {
    const next = { ...form, [k]: v };
    setForm(next);
    if (touched) setErrors(validateCustomer(next, customers));
  };

  async function submit(e) {
    e?.preventDefault();
    setTouched(true);
    const errs = validateCustomer(form, customers);
    setErrors(errs);
    if (hasErrors(errs)) return;
    setSaving(true);
    try {
      const rec = await actions.saveCustomer({ ...form, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() });
      toast.success(customer?.id ? 'Customer updated' : 'Customer added', `${rec.name} is ready for invoicing.`);
      onSaved?.(rec);
      onClose();
    } catch (err) {
      toast.error('Could not save customer', err.message);
      setSaving(false);
    }
  }

  return (
    <Modal
      title={customer?.id ? 'Edit customer' : 'Add customer'}
      subtitle="Email and phone are used for payment reminders."
      icon={UserRound}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button loading={saving} onClick={submit}>
            {customer?.id ? 'Save Changes' : 'Add Customer'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Business name" htmlFor="c-name" required error={errors.name} className="sm:col-span-2">
          <Input id="c-name" placeholder="e.g. Sri Murugan Traders" value={form.name} error={errors.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Contact person" htmlFor="c-contact">
          <Input id="c-contact" value={form.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} />
        </Field>
        <Field label="City" htmlFor="c-city">
          <Input id="c-city" value={form.city} onChange={(e) => set('city', e.target.value)} />
        </Field>
        <Field label="Email" htmlFor="c-email" required error={errors.email}>
          <Input id="c-email" type="email" value={form.email} error={errors.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="Phone" htmlFor="c-phone" error={errors.phone}>
          <Input id="c-phone" type="tel" placeholder="98401 23456" value={form.phone} error={errors.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="GSTIN" htmlFor="c-gstin" hint="Optional. Printed on invoices." className="sm:col-span-2">
          <Input id="c-gstin" value={form.gstin} onChange={(e) => set('gstin', e.target.value.toUpperCase())} maxLength={15} />
        </Field>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
