# PayTrack

Smart invoice and payment tracker for small businesses.
One folder, two parts:

```
paytrack-app/
  backend/    Spring Boot API (Java 17, Maven, H2 database)
  frontend/   React app (Vite)
  package.json   shortcuts to run both together
```

## Run everything (one time setup, then one command)

You need Java 17+, Maven and Node 18+.

```bash
cd paytrack-app
npm run setup      # installs the tools used to start both parts and the frontend packages
npm run dev        # starts the backend (port 4000) and the frontend (port 5173) together
```

Open http://localhost:5173

Stop everything with Ctrl+C.

Other commands (always from the `paytrack-app` folder):

| Command | What it does |
|---|---|
| `npm run backend` | backend only |
| `npm run frontend` | frontend only (already pointed at the backend) |
| `npm test` | runs the 33 backend tests |

## First use

1. Register an account. Any email works.
2. Your account starts empty. Add customers and invoices yourself.
3. Open **Smart Tools** for the dashboard, reminder messages, UPI links, print and CSV export.

## Administrator

The administrator account is created automatically when the backend starts. Log in with
`admin@paytrack.in` and password `Admin@123` (change both in `backend/src/main/resources/application.properties`,
keys `paytrack.admin.email` and `paytrack.admin.password`). Nobody can register as admin.
Admins get an **Admin** page: all accounts, usage counts, add a user, reset a user's password, disable or enable an account, delete an account, search and filter accounts, see last login, platform totals and an activity log.
Admins see counts only, never other users' customers or invoices.

## Without the backend

`cd frontend && npm install && npm run dev` runs the frontend alone on browser storage, with no login, as before.

## More

- `backend/README.md`: API list, login details, Swagger UI at http://localhost:4000/swagger-ui.html (use the Authorize button).
- `backend/docs/PAYTRACK_GUIDE.md`: demo script and line by line code explanation.
- If you used an older version, delete `backend/data` once. The tables changed.
