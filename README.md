# SANC Calibration Management System

Production React + Express application for SANC calibration, test certificate, ERPNext invoice sync, instruments, standards, invoices, and dashboard workflows.

## Project Layout

```text
.
├── backend/              # Express API, Prisma schema, migrations, schedulers
├── public/               # Frontend public assets used by Vite
├── src/                  # React frontend source
├── docs/                 # Non-runtime notes and helper docs
├── package.json          # Frontend scripts/dependencies
└── vercel.json           # Frontend deployment config
```

The frontend and backend deploy separately.

## Frontend

```bash
npm install
npm run dev
npm run build
```

Default local URL: `http://localhost:5173`

Set this in Vercel:

```text
VITE_API_URL=https://your-backend-url
```

## Backend

```bash
cd backend
npm install
npm run dev
npm start
```

Default local URL: `http://localhost:10000`

Required server environment variables are documented in [backend/.env.example](backend/.env.example).

## Deployment Notes

- Frontend deploy target: Vercel or any static hosting provider.
- Backend deploy target: Render or any Node.js server.
- Database: PostgreSQL-compatible connection through `DATABASE_URL`.
- Secrets stay in deployment environment variables, never in Git.
- Runtime logs, local DB files, Excel imports, `node_modules`, and build output are ignored.

## Main Features

- ERPNext approved invoice sync
- Calibration report generation from ERPNext customer/PO data + internal instrument data
- Test & Conformance certificate generation
- Instrument and standard management
- Customer and invoice management
- PDF rendering/export
- API health/status dashboard
