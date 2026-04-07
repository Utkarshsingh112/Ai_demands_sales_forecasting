# ForecastIQ

AI-powered demand and sales forecasting. Upload a CSV or Excel file, get a 30-day product-level forecast — no external AI API required.

## Prerequisites

- **Node.js** v18+
- **pnpm** v10 — `npm install -g pnpm`
- **MongoDB Atlas** free cluster ([cloud.mongodb.com](https://cloud.mongodb.com))

## Setup

**1. Create `.env` in the project root:**

```env
VITE_APP_ID=forecastiq-development
JWT_SECRET=replace-with-a-long-random-string
DATABASE_URL=mongodb+srv://<user>:<pass>@your-cluster.mongodb.net/?appName=YourApp
OWNER_OPEN_ID=your-email@example.com        # gets admin role on first login (optional)

# SMTP — only needed for password reset emails; OTP prints to console in dev
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password
```

**2. Install and run:**

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

```bash
pnpm build && pnpm start   # production
```

## Data Format

Each row must represent a single sale event. The app auto-detects column names.

| Column | Example values |
|--------|---------------|
| Date | `2024-01-15`, `15/01/2024`, `Jan 15 2024` |
| Product | `Widget A`, `SKU-001` |
| Quantity | `100`, `25` |
| Revenue | `5000`, `1250.50` |

Minimum ~7 rows; 30+ days of history recommended for accurate forecasts.

## Tech Stack

| | |
|--|--|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| API | tRPC + TanStack Query |
| Backend | Express.js + Node.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (jose) + httpOnly cookies |
| ML | Custom TypeScript — weighted MA + linear regression + day-of-week seasonality |
| File parsing | PapaParse (CSV) + SheetJS (Excel) |

## Project Structure

```
├── client/src/
│   ├── pages/          # Login, Register, Dashboard, DataUpload, ForecastResults, Reports, Settings
│   ├── components/     # DashboardLayout, ProtectedRoute
│   └── contexts/       # AuthContext
├── server/
│   ├── routers.ts      # All tRPC endpoints
│   ├── models.ts       # MongoDB schemas
│   ├── forecastEngine.ts
│   └── _core/          # Express entry, JWT, cookies, tRPC setup
└── shared/const.ts
```

## Common Issues

| Problem | Fix |
|---------|-----|
| Database won't connect | Check `DATABASE_URL`; whitelist your IP in Atlas Network Access |
| Cookie/session issues | Use `localhost` in dev — custom domains need HTTPS |
| "Invalid time value" on forecast | Wrong column mapped to Date — use the change link on the upload page |
| Flat forecast | Upload more history; need variation across multiple days |
| Port conflict | Server auto-tries ports 3000–3019; check terminal for actual port |
