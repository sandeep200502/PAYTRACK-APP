# PayTrack API — Spring Boot backend

A Spring Boot re-implementation of PayTrack's REST API (originally a small
Express server in `server/index.js`). It's a **drop-in replacement**: same
endpoints, same JSON shapes, so the existing React frontend talks to it
without any code changes — only `VITE_API_URL` needs to point here.

## Stack

- Java 17, Spring Boot 3.3 (Spring Web, Spring Data JPA, springdoc Swagger UI)
- H2 database, file-based (`./data/paytrackdb.mv.db`) so data survives restarts
- Real JPA entities with relations: `Customer` 1—* `Invoice` 1—* `InvoiceItem`,
  `Invoice` 1—* `Payment`, `Invoice` 1—* `Reminder`, plus a singleton `Settings` row

## Run it

```bash
cd paytrack-api
mvn spring-boot:run
```

The API starts on **http://localhost:4000/api**. On the very first run (empty
database) it seeds the same realistic sample data as the original app — 12
customers, 26 invoices, matching payments, 3 reminders — dated relative to
today, exactly like `src/data/seed.js` did on the frontend.

Browse the data directly at http://localhost:4000/h2-console (JDBC URL:
`jdbc:h2:file:./data/paytrackdb`, user `sa`, no password).

## Wire up the React frontend

From the `paytrack/` frontend folder:

```bash
VITE_API_URL=http://localhost:4000/api npm run dev
```

Windows PowerShell: `$env:VITE_API_URL="http://localhost:4000/api"; npm run dev`

That's it — the frontend's `httpAdapter.js` already speaks this exact API
contract, so the whole app (dashboard, invoices, payments, customers,
reports, reminders...) works unchanged against this backend.

You no longer need `npm run server` (the old Express server) — this project
replaces it.

## API surface

Mirrors the original Express routes one-for-one:

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | `{ ok: true }` |
| GET | `/api/bootstrap` | everything the UI needs in one call |
| GET | `/api/customers`, `/api/invoices`, `/api/payments`, `/api/reminders` | list |
| GET | `/api/{resource}/{id}` | single record, 404 if missing |
| POST | `/api/{resource}` | create (client supplies `id`) |
| PATCH | `/api/customers/{id}`, `/api/invoices/{id}` | partial update |
| DELETE | `/api/{resource}/{id}` | 204 |
| PUT | `/api/settings` | partial update of the business profile |
| POST | `/api/system/reset` | wipes and reseeds the demo dataset |
| POST | `/api/system/clear` | wipes customers/invoices/payments/reminders, keeps settings |

Errors come back as `{ "error": "message" }` with the matching HTTP status
(400 / 404 / 422), same as the Express version.

### The one business rule enforced server-side

Same as before: **a payment can never exceed the invoice's remaining
balance.** `InvoiceCalcService` is a Java port of `invoiceCalc.js`'s
`calcTotals()` (subtotal → discount → GST → total), and `PaymentService`
uses it to reject an over-payment with `422 Amount must be between 1 and X`.

## New in this version

All additions are new endpoints or stricter rules. Existing endpoints and JSON shapes are unchanged, so the React frontend keeps working.

| Method | Path | What it does |
|---|---|---|
| GET | `/api/dashboard` | totals, collection rate, ageing buckets, 6 month collections, payment methods, top debtors |
| GET | `/api/invoices/search` | filter by `status`, `customerId`, `q`, `from`, `to`; sort with `sortBy` (dueDate, issueDate, total, balance, number) and `desc` |
| GET | `/api/invoices/next-number` | next invoice number from the Settings prefix |
| GET | `/api/invoices/{id}/summary` | status (Draft, Unpaid, Partially Paid, Overdue, Paid), paid, balance, days overdue |
| GET | `/api/invoices/{id}/upi-link` | `upi://pay` link for the remaining balance |
| GET | `/api/invoices/{id}/reminder-message` | reminder text (`channel`=WhatsApp or Email, `tone`=friendly, firm or final) with a click to send link |
| GET | `/api/invoices/{id}/print` | printable invoice page (Print, Save as PDF) |
| GET | `/api/reminders/suggestions` | overdue invoices with recommended tone and channel |
| GET | `/api/customers/{id}/statement` | invoices, payments and totals for one customer |
| GET | `/api/export/invoices.csv`, `/api/export/payments.csv` | CSV downloads |

New rules: no payment on a draft invoice (422); due date cannot be before issue date, tax 0 to 100, no negative discount, quantity or price (422); invoice numbers are unique (409); customer name is required and GSTIN must be a valid 15 character GSTIN (422); a customer who still has invoices cannot be deleted (409); deleting an invoice also deletes its payments and reminders. Broken JSON now returns 400 and database conflicts return 409 instead of 500.

## Swagger UI

With the app running open http://localhost:4000/swagger-ui.html to try every endpoint from the browser.

## Tests

```bash
mvn test
```

33 end to end tests (17 business rules, 8 login, 8 admin) start the app with an in memory H2 database (see `src/test/resources/application.properties`), so your real `./data` is never touched.

## Documentation

`docs/PAYTRACK_GUIDE.md` has the full feature list, a demo script and a line by line explanation of the code.

## Project layout

```
src/main/java/com/paytrack/
  PaytrackApiApplication.java   entry point + auto-seed on first run
  config/CorsConfig.java        CORS for the Vite dev server
  model/                        JPA entities (Customer, Invoice, InvoiceItem,
                                 Payment, Reminder, Settings)
  repository/                   Spring Data JPA repositories
  dto/                          request/response DTOs
  service/                      business logic (incl. InvoiceCalcService,
                                 SeedService — the Java port of seed.js)
  controller/                   REST controllers, one per resource
  exception/                    ApiException + a @RestControllerAdvice that
                                 returns { "error": "..." } like the Express API
```

## Why JPA entities instead of a flat JSON store

The original Express server just kept one `db.json` file. This version
models the real relations instead — `Invoice.customer`, `InvoiceItem.invoice`,
`Payment.invoice`, `Reminder.invoice` — as proper `@ManyToOne`/`@OneToMany`
mappings with cascades (deleting an invoice removes its line items). The
JSON the API returns still matches the frontend's expected shape (e.g. an
invoice's `customerId` is a computed field, not a nested object), so nothing
on the React side had to change.

## Login and accounts (new)
Every endpoint except `POST /api/auth/register`, `POST /api/auth/login` and `GET /api/health` needs a login token.

```bash
# 1. create an account (returns a token)
curl -X POST http://localhost:4000/api/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Demo","email":"demo@shop.in","password":"secret123"}'
# 2. use the token
export TOKEN=paste-the-token-here
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/bootstrap
# 3. load the sample data for this account
curl -X POST -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/system/reset
```

- Passwords are stored as salted PBKDF2 hashes. Tokens are signed JWTs valid for 24 hours (`paytrack.jwt.hours`).
- Set your own secret in `application.properties` (`paytrack.jwt.secret`) before real use.
- Every customer, invoice, payment and reminder belongs to one user. Users never see each other's data.
- Swagger UI has an Authorize button: paste the token there.
- Print pages and CSV downloads accept `?access_token=<token>` because a new browser tab cannot send headers.
- The sample data keeps its ids (`inv_1`...) for the first account that loads it. A later account gets a `u<userid>_` prefix.
- If you used an older version, delete the `data` folder once: the tables changed (new `users` table and an `owner_id` column).

## Administrator (new)
The administrator is created automatically at startup (`AdminSeeder`) from `paytrack.admin.email` (default `admin@paytrack.in`) and `paytrack.admin.password` (default `Admin@123`). Registration always creates normal users, so nobody can register as admin.

- `GET /api/admin/overview`: platform totals.
- `GET /api/admin/users`: all accounts with customer, invoice and payment counts.
- `PATCH /api/admin/users/{id}` with `{"active":false}`: disable or enable an account (takes effect immediately).
- `DELETE /api/admin/users/{id}`: delete an account and all its data.
- `POST /api/admin/users` with name, email, password: create a normal account.
- `POST /api/admin/users/{id}/password` with `{"password":"..."}`: set a temporary password for a user who forgot theirs.
- `GET /api/admin/activity`: the newest 50 admin actions (create, disable, enable, reset password, delete).
- The overview also returns total money collected and new accounts in the last 7 days. The accounts list shows each user's last login.
- Everything under `/api/admin` returns 403 for normal users. Admins see counts only, never other users' invoices, and cannot act on themselves or other admins.
