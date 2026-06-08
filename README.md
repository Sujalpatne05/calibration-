# SANC — Calibration Report System

A modern, responsive **React** frontend for SANC's Calibration Management Software,
built to match the reference UI: a purple→pink gradient *Calibration Report* wordmark,
soft gray canvas, white cards, blue primary actions and a clean white sidebar.

> Frontend only — all data is **mock JSON**. No backend / APIs.

## Tech stack

- **React 18** + **Vite 5**
- **React Router 6** for navigation
- **Tailwind CSS 3** (custom brand theme tokens)
- **Lucide React** icons
- Fonts: **Poppins** (display) + **DM Sans** (body) via Google Fonts

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Build for production:

```bash
npm run build
npm run preview
```

### Login

Any non-empty username & password signs you in (mock auth, persisted to
`localStorage`). The form is pre-filled with `sanc`.

## Pages

| Route          | Page                         |
| -------------- | ---------------------------- |
| `/login`       | Login                        |
| `/dashboard`   | KPI cards, quick actions, tasklist, recent activity |
| `/customers`   | Customer table + add/edit modal |
| `/instruments` | Instruments + "View Ignored" toggle + add/edit modal |
| `/standards`   | Reference standards + add/edit modal |
| `/invoices`    | Calibration reports, date filter, CSV export |

## Project structure

```
src/
 ├── components/      # Button, FormInput, Modal, DataTable, SearchBar,
 │                    # DateRangeFilter, DashboardCard, StatusBadge,
 │                    # RowActions, SancLogo
 ├── layouts/         # Sidebar, TopNavbar, DashboardLayout
 ├── pages/           # Login, Dashboard, Customers, Instruments,
 │                    # Standards, Invoices
 ├── routes/          # AppRoutes (React Router config)
 ├── data/            # Mock JSON: customers, instruments, standards,
 │                    # invoices, dashboard
 ├── hooks/           # useAuth (context), useSearch
 ├── assets/          # static assets / logo notes
 ├── App.jsx          # providers + router
 └── main.jsx         # entry point
```

## Theming

Brand colours, radii, shadows and animations live in `tailwind.config.js`
under `theme.extend`. The gradient wordmark and table header styles are in
`src/index.css` as component classes (`.text-gradient-brand`, `.table-head`).

## Swapping the logo

`src/components/SancLogo.jsx` is an inline-SVG reconstruction of the SANC
gear/gauge mark. To use the official artwork, drop the file into `src/assets/`
and replace the `<svg>` with an `<img src={logo} />`.

## Responsiveness

- **Desktop:** fixed sidebar (collapsible to icons), full data tables.
- **Tablet/Mobile:** sidebar becomes an off-canvas drawer (hamburger in the
  top bar); data tables collapse into stacked cards for readability.
```
