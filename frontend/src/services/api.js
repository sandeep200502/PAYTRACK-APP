// Service layer: the ONLY place the UI talks to for data.
// Pages/components never touch localStorage or fetch directly.
//
// Swap storage by changing the adapter:
//   localAdapter  -> browser localStorage (default, zero setup)
//   httpAdapter   -> Node/Express REST API in /server (set VITE_API_URL)

import { localAdapter } from './localAdapter';
import { httpAdapter } from './httpAdapter';
import { uid, todayISO } from '../utils/format';

const adapter = import.meta.env.VITE_API_URL ? httpAdapter : localAdapter;

// Small artificial latency so loading states are visible and the UI behaves
// the same way it will against a real network.
const LATENCY = 250;
const delay = (ms = LATENCY) => new Promise((r) => setTimeout(r, ms));

async function withLatency(promise) {
  const [result] = await Promise.all([promise, delay()]);
  return result;
}

export const api = {
  storageName: adapter.name,

  bootstrap: () => withLatency(adapter.bootstrap()),

  customers: {
    create: (data) => withLatency(adapter.create('customers', { ...data, id: uid('cus'), createdAt: todayISO() })),
    update: (id, data) => withLatency(adapter.update('customers', id, data)),
    remove: (id) => withLatency(adapter.remove('customers', id)),
  },

  invoices: {
    create: (data) => withLatency(adapter.create('invoices', { ...data, id: uid('inv'), createdAt: todayISO() })),
    update: (id, data) => withLatency(adapter.update('invoices', id, data)),
    /** Deleting an invoice also removes its payments and reminder log. */
    async remove(id, { paymentIds = [], reminderIds = [] } = {}) {
      await Promise.all([
        ...paymentIds.map((p) => adapter.remove('payments', p)),
        ...reminderIds.map((r) => adapter.remove('reminders', r)),
      ]);
      return withLatency(adapter.remove('invoices', id));
    },
  },

  payments: {
    create: (data, number) =>
      withLatency(adapter.create('payments', { ...data, id: uid('pay'), number, amount: Number(data.amount), createdAt: todayISO() })),
    remove: (id) => withLatency(adapter.remove('payments', id)),
  },

  reminders: {
    log: (data) => adapter.create('reminders', { ...data, id: uid('rem'), date: todayISO() }),
  },

  settings: {
    save: (data) => withLatency(adapter.saveSettings(data)),
  },

  system: {
    reset: () => withLatency(adapter.reset()),
    clear: () => withLatency(adapter.clear()),
  },
};
