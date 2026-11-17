# PayTrack – Smart Invoice & Payment Tracker for Small Businesses

> Create invoices, track payments, chase overdue customers, and understand your cash flow, all in one simple dashboard.

Theme 3 – Small Business & Productivity

## Run it

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev          # opens on http://localhost:5173
```

That's all you need for the demo. Data is saved in the browser (localStorage), so everything you create survives a refresh.

Other scripts:

| Command | What it does |
|---|---|
| `npm run build` | Production build into `dist/` |
| `npm run build:single` | One self-contained `dist-single/index.html` (open it directly, host it anywhere, make a QR code for it) |
| `npm run preview` | Serve the production build |
| `npm run server` | Optional REST API (Express) on http://localhost:4000/api |

### Optional: run against the REST API

```bash
npm run server                                   # terminal 1
VITE_API_URL=http://localhost:4000/api npm run dev   # terminal 2
```

Windows PowerShell: `$env:VITE_API_URL="http://localhost:4000/api"; npm run dev`

The API stores data in `server/db.json` (created and seeded on first run) and reuses the exact same business logic as the frontend (`src/utils/invoiceCalc.js`), including a server-side check that rejects payments larger than the remaining balance.

### Before presenting

Data comes from the logged in account only. There is no demo reset button, so nothing is pre-filled or mixed in.

## Features

- **Dashboard**: 5 live KPIs, revenue chart, payment-status donut, overdue alert, recent invoices, recent payments, upcoming dues, business insights, expected cash flow
- **Invoices**: create / edit / delete / view, search by ID or customer, status tabs, filters (customer, date range, amount range), sortable columns
- **Invoice form**: line items, live subtotal → discount (₹ or %) → GST (CGST + SGST split) → grand total, Net 7/15/30/45 shortcuts, Save Draft, validation
- **Invoice details**: printable tax invoice, payment progress, activity timeline, record payment, send reminder, print / save as PDF
- **Payments**: record payments (UPI, Bank Transfer, Cash, Card) with live "after this payment" preview; balance, status and dashboard update instantly
- **Customers**: add / edit / delete / search (name, email, phone), profile with billed, paid, outstanding, payment history and behaviour rating
- **Automatic overdue detection**: due date passed + balance > 0 → Overdue, with days overdue computed daily
- **Payment aging**: 0–7, 8–30, 31–60, 60+ day buckets
- **Smart reminders**: tone auto-selected by lateness (Friendly / Firm / Final notice), editable message, Copy, WhatsApp (wa.me), Email (mailto), reminder history
- **Business insights**: rule-based insights computed from live data
- **Reports**: revenue by month, status distribution, paid vs pending, cash flow, aging, top customers, payment methods, customer behaviour, CSV export
- **UX**: toasts, confirmation dialogs, empty states, loading skeleton, inline validation, keyboard-friendly forms (Esc closes dialogs, Enter submits), responsive from 360px phones to desktops

## Status rules

| Condition | Status |
|---|---|
| Saved as draft | Draft |
| Balance = 0 | Paid |
| Balance > 0 and today > due date | Overdue |
| Paid > 0 and balance > 0 (not past due) | Partially Paid |
| Nothing paid, not past due | Pending |

Status is never stored. It is derived from invoice + payments + today's date every time the data changes, so it cannot go stale.

## Project structure

```
src/
  App.jsx                 routes + providers
  main.jsx
  index.css               Tailwind layers, design tokens, print styles
  layouts/AppLayout.jsx   sidebar + navbar shell
  pages/                  Dashboard, Invoices, InvoiceEditor, InvoiceDetails, Customers,
                          CustomerDetails, Payments, Overdue, Reports, Reminders, Settings
  components/             Sidebar, Navbar, StatCard, InvoiceTable, StatusBadge, InvoiceForm,
                          InvoiceDocument, PaymentModal, CustomerCard, CustomerFormModal,
                          ChartCard, Charts, ReminderModal, ReminderComposer, InsightsPanel,
                          Toast, ConfirmDialog, Modal, FormField, EmptyState, Skeleton, Button
  hooks/                  useData (store + actions), useRouter, useToast, useConfirm, useModals
  services/               api.js (service layer), localAdapter.js, httpAdapter.js
  utils/                  invoiceCalc.js (totals + status), analytics.js (KPIs, cash flow,
                          aging, behaviour, insights), reminders.js, validation.js, format.js
  data/seed.js            sample data: 12 customers, 26 invoices, 15 payments
server/index.js           optional Express REST API
```

## Tech

React 18, Vite, Tailwind CSS, Recharts, Lucide React, localStorage (swappable for REST via the service layer), Node.js + Express (optional).

### Login and register (when running against the API)

With `VITE_API_URL` set, the app shows Login and Register pages first. The token is saved in the browser, sent on every request, and cleared by the Log out button in the sidebar. Without `VITE_API_URL` there is no login (single local user, as before).

### Smart Tools page (needs the Spring Boot backend)

Sidebar → **Smart Tools** shows the backend-only features: server dashboard, reminder text
(WhatsApp/Email), UPI pay link, printable invoice, invoice search and CSV exports.
Start the Spring Boot API (`mvn spring-boot:run` in `paytrack-api`), then:

```bash
VITE_API_URL=http://localhost:4000/api npm run dev
```

Without `VITE_API_URL` the page just explains that the backend is not connected.
