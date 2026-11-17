// PayTrack REST API (optional backend).
// Node + Express with a JSON-file database. Reuses the SAME business logic as
// the frontend (src/utils), so totals/status rules are identical on both sides.
//
// Run:  npm run server      -> http://localhost:4000/api
// Then: VITE_API_URL=http://localhost:4000/api npm run dev

import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSeed } from '../src/data/seed.js';
import { calcTotals } from '../src/utils/invoiceCalc.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, 'db.json');
const COLLECTIONS = ['customers', 'invoices', 'payments', 'reminders'];
const PORT = process.env.PORT || 4000;

const load = () => (fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : save(buildSeed()));
function save(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  return db;
}

const app = express();
app.use(cors());
app.use(express.json());

const checkCollection = (req, res, next) =>
  COLLECTIONS.includes(req.params.collection) ? next() : res.status(404).json({ error: 'Unknown collection' });

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/bootstrap', (_req, res) => res.json(load()));

app.get('/api/:collection', checkCollection, (req, res) => res.json(load()[req.params.collection]));

app.get('/api/:collection/:id', checkCollection, (req, res) => {
  const rec = load()[req.params.collection].find((r) => r.id === req.params.id);
  return rec ? res.json(rec) : res.status(404).json({ error: 'Not found' });
});

app.post('/api/:collection', checkCollection, (req, res) => {
  const db = load();
  const record = req.body;
  if (!record?.id) return res.status(400).json({ error: 'Record id is required' });

  // Server-side guard: never accept a payment larger than the invoice balance.
  if (req.params.collection === 'payments') {
    const inv = db.invoices.find((i) => i.id === record.invoiceId);
    if (!inv) return res.status(400).json({ error: 'Invoice not found' });
    const paid = db.payments.filter((p) => p.invoiceId === inv.id).reduce((s, p) => s + Number(p.amount), 0);
    const balance = calcTotals(inv).total - paid;
    if (!(Number(record.amount) > 0) || Number(record.amount) > balance + 0.001)
      return res.status(422).json({ error: `Amount must be between 1 and ${balance.toFixed(2)}` });
  }

  db[req.params.collection].push(record);
  save(db);
  return res.status(201).json(record);
});

app.patch('/api/:collection/:id', checkCollection, (req, res) => {
  const db = load();
  const list = db[req.params.collection];
  const idx = list.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  list[idx] = { ...list[idx], ...req.body, id: req.params.id };
  save(db);
  return res.json(list[idx]);
});

app.delete('/api/:collection/:id', checkCollection, (req, res) => {
  const db = load();
  db[req.params.collection] = db[req.params.collection].filter((r) => r.id !== req.params.id);
  save(db);
  return res.status(204).end();
});

app.put('/api/settings', (req, res) => {
  const db = load();
  db.settings = { ...db.settings, ...req.body };
  save(db);
  res.json(db.settings);
});

app.post('/api/system/reset', (_req, res) => res.json(save(buildSeed())));
app.post('/api/system/clear', (_req, res) => {
  const db = load();
  res.json(save({ ...db, customers: [], invoices: [], payments: [], reminders: [] }));
});

app.listen(PORT, () => console.log(`PayTrack API running on http://localhost:${PORT}/api`));
