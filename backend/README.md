# SANC Calibration Backend API

Node.js + Express + PostgreSQL + Prisma REST API for SANC Calibration Management System.

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 12+

### Installation

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables:
```bash
cp .env.example .env
```

Update `.env` with your database credentials and secrets.

3. Setup database:
```bash
npm run prisma:generate
npm run prisma:migrate
```

### Development

Run in watch mode:
```bash
npm run dev
```

### Production

Start server:
```bash
npm start
```

## API Documentation

Interactive API documentation available at `http://localhost:5000/api-docs` (Swagger UI)

## Project Structure

```
src/
├── config/          # Configuration (logger, swagger)
├── controllers/     # Route handlers
├── middleware/      # Express middleware (auth, validation)
├── routes/          # API routes
├── schemas/         # Request validation schemas (Joi)
├── server.js        # Express app entry point
prisma/
├── schema.prisma    # Database schema
└── migrations/      # Database migrations
```

## Authentication

Uses JWT tokens. Include in request headers:
```
Authorization: Bearer <token>
```

## Endpoints

### Auth
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/validate-session` - Validate token
- `POST /auth/change-password` - Change password

### Customers
- `GET /customers` - List all
- `GET /customers?search=query` - Search
- `POST /customers` - Create
- `PUT /customers/{id}` - Update
- `DELETE /customers/{id}` - Delete

### Instruments
- `GET /instruments` - List all
- `GET /instruments?search=query&ignored=false` - Search/filter
- `POST /instruments` - Create
- `PUT /instruments/{id}` - Update
- `DELETE /instruments/{id}` - Delete

### Standards
- `GET /standards` - List all
- `GET /standards?search=query` - Search
- `POST /standards` - Create
- `PUT /standards/{id}` - Update
- `DELETE /standards/{id}` - Delete

### Invoices
- `GET /invoices` - List all
- `GET /invoices?search=query&from=YYYY-MM-DD&to=YYYY-MM-DD` - Search/filter
- `GET /invoices/export-csv` - Export to CSV

### Reports
- `GET /reports` - List all
- `GET /reports?type=calibration|test&search=query` - Filter/search
- `GET /reports/{id}` - Get by ID
- `POST /reports` - Create
- `PUT /reports/{id}` - Update
- `DELETE /reports/{id}` - Delete

### Dashboard
- `GET /dashboard/kpis` - Get KPIs
- `GET /dashboard/quick-tasks` - Get pending tasks
- `GET /dashboard/recent-activities` - Get activity feed

## Error Handling

All errors return JSON with error message:
```json
{ "error": "Error message" }
```

Validation errors return detailed messages:
```json
{ "errors": ["Field is required", "Email must be valid"] }
```

## Logging

Logs are stored in `error.log` and `combined.log`. Console output in development mode.
