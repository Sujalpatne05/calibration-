# SANC Calibration Backend

Node.js + Express + Prisma backend for the SANC Calibration Management System.

## Structure

```text
backend/
├── prisma/
│   ├── migrations/       # Database migrations
│   └── schema.prisma     # Prisma schema
├── scripts/
│   ├── import-old-data.js
│   ├── seed.js
│   ├── seed-default-standards.js
│   └── start.js          # Production startup: generate, migrate, run server
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── schemas/
│   ├── services/
│   └── server.js
├── package.json
└── .env.example
```

## Local Development

```bash
npm install
npm run dev
```

Default URL: `http://localhost:10000`

Health check:

```text
GET /health
```

## Production

```bash
npm install
npm start
```

`npm start` runs:

1. `prisma generate`
2. `prisma migrate deploy`
3. optional seed when `RUN_DB_SEED=true`
4. `node src/server.js`

## Environment

Copy `.env.example` locally and configure deployment variables in the server dashboard.

Important variables:

```text
DATABASE_URL=
JWT_SECRET=
JWT_EXPIRE=7d
CORS_ORIGIN=
PORT=10000
ERPNEXT_BASE_URL=
ERPNEXT_API_KEY=
ERPNEXT_API_SECRET=
ERPNEXT_AUTH_SCHEME=basic
```

## API Areas

- `/auth`
- `/customers`
- `/instruments`
- `/standards`
- `/invoices`
- `/reports`
- `/dashboard`
- `/erpnext`

Swagger docs are available at:

```text
/api-docs
```
