// Global data store. Loads everything through the service layer once, keeps it in
// React state, and exposes actions. All derived values (totals, balances, status)
// are recomputed from source data with useMemo, so the UI can never go stale.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { enrichInvoice, STATUS_LABEL } from '../utils/invoiceCalc';
import { todayISO } from '../utils/format';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [db, setDb] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setDb(await api.bootstrap());
    } catch (e) {
      setError(e.message || 'Could not load data');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const today = todayISO();

  const derived = useMemo(() => {
    if (!db) return null;
    const customersById = Object.fromEntries(db.customers.map((c) => [c.id, c]));
    const invoices = db.invoices
      .map((inv) => enrichInvoice(inv, db.payments, customersById, today))
      .sort((a, b) => (a.issueDate === b.issueDate ? (a.number < b.number ? 1 : -1) : a.issueDate < b.issueDate ? 1 : -1));
    const invoicesById = Object.fromEntries(invoices.map((i) => [i.id, i]));
    const payments = db.payments
      .map((p) => {
        const inv = invoicesById[p.invoiceId];
        return { ...p, invoiceNumber: inv?.number ?? '—', customerId: inv?.customerId, customerName: inv?.customerName ?? '—' };
      })
      .sort((a, b) => (a.date === b.date ? (a.number < b.number ? 1 : -1) : a.date < b.date ? 1 : -1));
    const reminders = (db.reminders || [])
      .map((r) => ({ ...r, invoice: invoicesById[r.invoiceId] }))
      .filter((r) => r.invoice)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    return { customersById, invoices, invoicesById, payments, reminders };
  }, [db, today]);

  // ---------- actions ----------
  const patch = (fn) => setDb((prev) => fn(prev));

  const saveCustomer = useCallback(async (data) => {
    if (data.id) {
      const rec = await api.customers.update(data.id, data);
      patch((d) => ({ ...d, customers: d.customers.map((c) => (c.id === rec.id ? rec : c)) }));
      return rec;
    }
    const rec = await api.customers.create(data);
    patch((d) => ({ ...d, customers: [...d.customers, rec] }));
    return rec;
  }, []);

  const deleteCustomer = useCallback(
    async (id) => {
      const count = db.invoices.filter((i) => i.customerId === id).length;
      if (count) throw new Error(`This customer has ${count} invoice${count > 1 ? 's' : ''}. Delete those first to keep your records consistent.`);
      await api.customers.remove(id);
      patch((d) => ({ ...d, customers: d.customers.filter((c) => c.id !== id) }));
    },
    [db],
  );

  /** Creates the customer on the fly if the name typed is new. */
  const saveInvoice = useCallback(
    async (form) => {
      let customerId = form.customerId;
      const existing = db.customers.find((c) => c.id === customerId) ||
        db.customers.find((c) => c.name.trim().toLowerCase() === form.customerName.trim().toLowerCase());
      if (existing) customerId = existing.id;
      else {
        const created = await api.customers.create({ name: form.customerName.trim(), email: form.customerEmail, phone: form.customerPhone, contactPerson: '', city: '', gstin: '' });
        patch((d) => ({ ...d, customers: [...d.customers, created] }));
        customerId = created.id;
      }
      const record = {
        number: form.number.trim(),
        customerId,
        customerEmail: form.customerEmail.trim(),
        customerPhone: form.customerPhone.trim(),
        issueDate: form.issueDate,
        dueDate: form.dueDate,
        items: form.items.map((it) => ({ ...it, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
        discountType: form.discountType,
        discountValue: Number(form.discountValue) || 0,
        taxRate: Number(form.taxRate) || 0,
        notes: form.notes,
        isDraft: !!form.isDraft,
      };
      if (form.id) {
        const rec = await api.invoices.update(form.id, record);
        patch((d) => ({ ...d, invoices: d.invoices.map((i) => (i.id === rec.id ? rec : i)) }));
        return rec;
      }
      const rec = await api.invoices.create(record);
      patch((d) => ({ ...d, invoices: [...d.invoices, rec] }));
      return rec;
    },
    [db],
  );

  const issueDraft = useCallback(async (id) => {
    const rec = await api.invoices.update(id, { isDraft: false });
    patch((d) => ({ ...d, invoices: d.invoices.map((i) => (i.id === rec.id ? rec : i)) }));
    return rec;
  }, []);

  const deleteInvoice = useCallback(
    async (id) => {
      const paymentIds = db.payments.filter((p) => p.invoiceId === id).map((p) => p.id);
      const reminderIds = (db.reminders || []).filter((r) => r.invoiceId === id).map((r) => r.id);
      await api.invoices.remove(id, { paymentIds, reminderIds });
      patch((d) => ({
        ...d,
        invoices: d.invoices.filter((i) => i.id !== id),
        payments: d.payments.filter((p) => p.invoiceId !== id),
        reminders: (d.reminders || []).filter((r) => r.invoiceId !== id),
      }));
    },
    [db],
  );

  /** Returns the updated invoice (with its new status) so the UI can report it. */
  const recordPayment = useCallback(
    async (data) => {
      const max = db.payments.reduce((m, p) => Math.max(m, parseInt(String(p.number).replace(/\D/g, ''), 10) || 0), 5000);
      const rec = await api.payments.create(data, `PAY-${max + 1}`);
      const nextPayments = [...db.payments, rec];
      patch((d) => ({ ...d, payments: [...d.payments, rec] }));
      const customersById = Object.fromEntries(db.customers.map((c) => [c.id, c]));
      const inv = enrichInvoice(db.invoices.find((i) => i.id === rec.invoiceId), nextPayments, customersById, today);
      return { payment: rec, invoice: inv, statusLabel: STATUS_LABEL[inv.status] };
    },
    [db, today],
  );

  const deletePayment = useCallback(async (id) => {
    await api.payments.remove(id);
    patch((d) => ({ ...d, payments: d.payments.filter((p) => p.id !== id) }));
  }, []);

  const logReminder = useCallback(async (invoiceId, channel, tone) => {
    const rec = await api.reminders.log({ invoiceId, channel, tone });
    patch((d) => ({ ...d, reminders: [...(d.reminders || []), rec] }));
  }, []);

  const saveSettings = useCallback(async (s) => {
    const rec = await api.settings.save(s);
    patch((d) => ({ ...d, settings: rec }));
  }, []);

  const resetDemo = useCallback(async () => setDb(await api.system.reset()), []);
  const clearAll = useCallback(async () => setDb(await api.system.clear()), []);

  const value = db
    ? {
        loading: false,
        today,
        customers: db.customers.slice().sort((a, b) => a.name.localeCompare(b.name)),
        settings: db.settings,
        rawInvoices: db.invoices,
        ...derived,
        storageName: api.storageName,
        actions: { saveCustomer, deleteCustomer, saveInvoice, issueDraft, deleteInvoice, recordPayment, deletePayment, logReminder, saveSettings, resetDemo, clearAll },
      }
    : { loading: true, error, retry: load };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
