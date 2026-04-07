# ForecastIQ — AI Demand & Sales Forecasting

A full-stack web app that lets business owners upload sales data (CSV or Excel) and get a 30-day demand forecast per product, powered by an on-device ML engine (no external AI API required).

---

## Key Things You Must Have Before Running

### 1. Node.js + pnpm

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **pnpm** v10 — install it once globally after Node:

```bash
npm install -g pnpm
```

### 2. MongoDB Atlas (your database)

This app stores users, uploaded datasets, and forecasts in MongoDB.

- Go to [cloud.mongodb.com](https://cloud.mongodb.com) and sign up free
- Create a free M0 cluster
- Under **Database Access** → add a user with a password
- Under **Network Access** → add `0.0.0.0/0` (allow all IPs) or your specific IP
- Click **Connect → Drivers** and copy the connection string — it looks like:

```
mongodb+srv://<username>:<password>@main-cluster.uyv7ps0.mongodb.net/?appName=Main-cluster
```

Your current connection string is already in `.env`. If it stops working, replace it there.

### 3. The `.env` File

Create a file called `.env` in the project root (same folder as `package.json`). All keys are required unless marked optional:

```env
# App identifier
VITE_APP_ID=forecastiq-development

# JWT — signs session cookies. Keep this secret. Min 32 chars, random string.
JWT_SECRET=replace-this-with-a-long-random-string

# MongoDB Atlas connection string
DATABASE_URL=mongodb+srv://<username>:<password>@your-cluster.mongodb.net/?appName=YourApp

# Email that automatically gets admin role on first login (optional)
OWNER_OPEN_ID=your-email@example.com

# SMTP — only needed for Forgot Password emails
# In dev, the OTP is printed to the server console instead, so this is optional locally
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password
```

> **Gmail App Password:** You need an App Password, not your normal Gmail password.
> Go to: Google Account → Security → 2-Step Verification → App Passwords → generate one for "Mail".

---

## Running the App

### Install dependencies (once)

```bash
pnpm install
```

### Start development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Both the React frontend and the Express backend run on **the same port** — you only need one terminal, not two.

### Build for production

```bash
pnpm build
pnpm start
```

---

## How the App Works — End to End

```
User registers / logs in
        │
        ▼
Session JWT stored in an httpOnly cookie (auto secure on HTTPS)
        │
        ▼
Dashboard — loads charts and metrics from your latest uploaded dataset
        │
        ▼
Upload Data page
  → Drop a CSV or Excel (.xlsx / .xls) file
  → App auto-detects which column is Date / Product / Qty / Revenue
     (analyses both column names AND actual cell values)
  → Preview shows exactly how the first 5 rows will be read
  → Click "Analyse & Generate Forecast"
        │
        ▼
Server saves records to MongoDB
        │
        ▼
ML Forecast Engine runs entirely on your server (no external API):
  1. Aggregates sales by day across all records
  2. Applies a weighted 7-day moving average to smooth noise
  3. Runs linear regression to find the overall trend line
  4. Detects day-of-week seasonality (e.g. weekends sell more)
  5. Projects 30 days forward with upper/lower confidence bands
  6. Repeats per-product for individual product-level forecasts
  7. Generates insight text (Stock Up / Reduce Order / Monitor)
        │
        ▼
Forecast Results page — area charts, confidence bands, product cards, key insights
```

---

## What Kind of Data File to Upload

The app needs **sales transaction logs** — each row = one sale event on a specific date.

### Required columns (any column names — the app auto-detects them)

| What it is | What it must contain | Example values |
|------------|---------------------|----------------|
| Date | When the sale happened | `2024-01-15`, `15/01/2024`, `Jan 15 2024` |
| Product | Name or ID of the product | `Widget A`, `SKU-001`, `Chair` |
| Quantity | Units sold in that transaction | `100`, `25`, `3` |
| Revenue | Money earned from that sale | `5000`, `1250.50`, `299` |

### Minimal working example

```csv
date,product,quantity,revenue
2024-01-01,Widget A,100,5000
2024-01-01,Widget B,150,7500
2024-01-02,Widget A,95,4750
2024-01-02,Widget B,130,6500
2024-01-03,Widget A,110,5500
```

### Files that will NOT work

| File type | Why it fails |
|-----------|-------------|
| Product catalog | No date column → nothing to forecast from |
| Inventory list | Shows stock levels, not when things were sold |
| Single-day snapshot | Need time-series data across multiple days |
| Files with < 7 rows | Not enough history for meaningful regression |

> **For best accuracy:** upload at least **2–3 weeks** of daily transaction data. The more history, the more the seasonality and trend detection has to work with.

---

## Project Structure

```
forecastiq/
├── client/                    # React frontend (Vite + TypeScript)
│   └── src/
│       ├── pages/             # Login, Register, Dashboard, DataUpload,
│       │                      # ForecastResults, Reports, Settings, ForgotPassword
│       ├── components/
│       │   ├── DashboardLayout.tsx   # Sidebar navigation + user avatar/logout
│       │   └── ProtectedRoute.tsx    # Redirects unauthenticated users to /login
│       ├── contexts/
│       │   └── AuthContext.tsx       # Single auth state source (tRPC auth.me query)
│       └── lib/trpc.ts              # tRPC client with credentials: "include"
│
├── server/                    # Express backend (Node.js + TypeScript)
│   ├── routers.ts             # All API endpoints:
│   │                          #   auth.register / login / logout / me
│   │                          #   data.upload / list / get / delete
│   │                          #   forecast.run / list / get
│   │                          #   reports, profile, insights
│   ├── models.ts              # MongoDB schemas: User, SalesData, Forecast, Report, UserProfile
│   ├── db.ts                  # Database query functions (Mongoose)
│   ├── forecastEngine.ts      # ML pipeline — regression + seasonality + confidence bands
│   ├── aiInsights.ts          # Generates insight strings from forecast output
│   └── _core/
│       ├── index.ts           # Express server entry point, port selection
│       ├── context.ts         # tRPC context — reads cookie → verifies JWT → looks up user
│       ├── trpc.ts            # publicProcedure / protectedProcedure / adminProcedure
│       ├── jwt.ts             # signSession() / verifySession() using jose
│       ├── hash.ts            # hashPassword() / verifyPassword() using scrypt
│       └── cookies.ts         # Cookie options: httpOnly, sameSite lax/none based on HTTPS
│
├── shared/
│   └── const.ts               # COOKIE_NAME, ONE_YEAR_MS — shared between client and server
│
├── .env                       # Environment variables (never commit to git)
├── .env.example               # Safe template to share with teammates
├── package.json               # Scripts: dev, build, start, check, test
└── README.md                  # This file
```

---

## Common Problems and Fixes

### App won't connect to the database

- Double-check `DATABASE_URL` in `.env` — username and password must not contain `@` or `/` (URL-encode them if they do)
- Go to MongoDB Atlas → Network Access → confirm your IP is whitelisted
- If you're on a VPN or mobile hotspot your IP may have changed — add `0.0.0.0/0` for testing

### Always getting "Invalid email or password"

- Make sure you registered first at `/register` before trying to log in
- Passwords are stored hashed — there is no way to recover them, just register again

### Logged out immediately after logging in

- This happens if the session cookie is being rejected
- In development (HTTP/localhost) the cookie uses `sameSite: lax` — this works fine on localhost
- If you're testing on a custom domain without HTTPS, the cookie won't be set — use localhost

### "Invalid time value" error when running a forecast

- Your Date column contains non-date values (e.g. "in_stock", product IDs, prices)
- Use the "change" link next to the Date field on the upload page to pick the correct column
- The preview table shows exactly what dates the app is reading — check it before submitting

### Forecast results look flat / unrealistic

- Too few data points — upload more history (ideally 30+ days)
- All sales on the same date — the engine needs variation across days to detect a trend

### Port already in use

- The server tries ports 3000–3019 and picks the first available one
- Check the terminal: `Server running on http://localhost:XXXX/`

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + TypeScript + Vite | UI |
| Styling | Tailwind CSS v4 + shadcn/ui | Components and layout |
| Routing | Wouter | Client-side routing |
| API layer | tRPC + TanStack Query | Type-safe API calls + caching |
| Charts | Recharts | Line, bar, area, pie charts |
| Backend | Express.js + Node.js | HTTP server |
| Database | MongoDB + Mongoose | Storing users, datasets, forecasts |
| Auth | JWT (jose library) + httpOnly cookies | Session management |
| Passwords | Node.js scrypt (built-in crypto) | Secure password hashing |
| File parsing | PapaParse (CSV) + SheetJS/xlsx (Excel) | Client-side file reading |
| ML engine | Custom TypeScript (no external API) | Weighted MA + linear regression + seasonality |
| Email | Nodemailer | Password reset OTP emails |
| Package manager | pnpm v10 | Fast, disk-efficient installs |
