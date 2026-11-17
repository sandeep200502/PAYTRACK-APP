// Storage adapter #1: browser localStorage (default for the prototype).
// Implements the same interface as httpAdapter.js, so the app can switch
// to the Express/DB backend by changing one line in api.js.

import { buildSeed } from '../data/seed';

const KEY = 'paytrack:db:v1';
let memory = null; // fallback when localStorage is blocked (private mode etc.)

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* storage unavailable, fall through */
  }
  return memory;
}

function write(db) {
  memory = db;
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* keep working in memory */
  }
  return db;
}

function ensure() {
  return read() ?? write(buildSeed());
}

const clone = (x) => JSON.parse(JSON.stringify(x));

export const localAdapter = {
  name: 'localStorage',

  async bootstrap() {
    return clone(ensure());
  },

  async create(collection, record) {
    const db = ensure();
    db[collection] = [...(db[collection] || []), record];
    write(db);
    return clone(record);
  },

  async update(collection, id, patch) {
    const db = ensure();
    let updated = null;
    db[collection] = db[collection].map((r) => (r.id === id ? (updated = { ...r, ...patch, id }) : r));
    if (!updated) throw new Error(`Record ${id} not found in ${collection}`);
    write(db);
    return clone(updated);
  },

  async remove(collection, id) {
    const db = ensure();
    db[collection] = db[collection].filter((r) => r.id !== id);
    write(db);
    return true;
  },

  async saveSettings(settings) {
    const db = ensure();
    db.settings = { ...db.settings, ...settings };
    write(db);
    return clone(db.settings);
  },

  async reset() {
    return clone(write(buildSeed()));
  },

  async clear() {
    const db = ensure();
    return clone(write({ ...db, customers: [], invoices: [], payments: [], reminders: [] }));
  },
};
