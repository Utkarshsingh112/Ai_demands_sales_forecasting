# ForecastIQ - AI-Powered Sales Forecasting Platform

ForecastIQ is a robust, full-stack web application designed to help businesses predict sales trends, identify anomalies, and generate actionable insights using the power of Artificial Intelligence (Large Language Models) and advanced statistical forecasting. 

## 🚀 Features

- **📊 Intelligent Dashboard**: Get a bird's eye view of your sales performance and top forecast insights.
- **📈 Advanced Forecasting**: Predict future demand horizons using historical sales data.
- **🤖 AI Insights**: Automatically generates narrative explanations, detects anomalies, and provides actionable recommendations utilizing LLM technology.
- **📤 Easy Data Upload**: Support for CSV sales data uploads with automatic parsing and schema validation.
- **📄 Comprehensive Reports**: Export forecasts and insights directly to PDF or CSV formats.
- **🔐 Secure Authentication**: Integrated user authentication and registration workflows.
- **⚙️ Customizable Settings**: Manage user profiles, business preferences, and notification tolerances.

## 🛠 Tech Stack

**Frontend**
- **React 19** with **Vite** for incredibly fast development and optimized builds.
- **Tailwind CSS** + **Radix UI** for beautiful, responsive, and highly accessible component-driven design.
- **tRPC + React Query** for seamless, type-safe API communication and data fetching.
- **Recharts** for building interactive, responsive data visualizations.

**Backend**
- **Node.js** + **Express** server.
- **tRPC** for robust, end-to-end type-safe APIs.
- **MongoDB (Mongoose)** for flexible and scalable data storage.
- **LLM Integration** for dynamic insight generation.
- **PDF/CSV Generation** using `jspdf` and `papaparse`.

## 📂 Project Structure

```text
├── client/                 # Frontend React Application
│   ├── public/             # Static assets
│   └── src/                
│       ├── components/     # Reusable UI components
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Application routes (Dashboard, Upload, Reports, etc.)
│       └── main.tsx        # React entry point
├── server/                 # Backend Express Application
│   ├── _core/              # Core setup (Express, Vite middleware, LLM config)
│   ├── routers.ts          # tRPC API routes
│   ├── models.ts           # MongoDB Mongoose schemas
│   ├── aiInsights.ts       # AI prompt generation and response parsing
│   ├── forecastEngine.ts   # Core statistical forecasting logic
│   └── pdfExport.ts        # PDF generation utilities
├── shared/                 # Shared Types & Constants
│   └── types.ts            # Type definitions shared between Client & Server
└── package.json            # Unified Package Manager Config (pnpm/npm)
```

## 📦 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- `pnpm` (Project uses pnpm as the primary package manager)
- MongoDB instance (Local or Atlas)
- Relevant Environment Variables defined in a `.env` file.

### Installation & Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```
2. **Set up Environment Variables**:
   Ensure you have a `.env` file at the root of the project with required keys (MongoDB URI, LLM secrets, port configurations).
3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   *(This single command starts both the Express backend server and the Vite frontend server concurrently via Vite middleware).*
4. **Access the Application**:
   Open [http://localhost:3000](http://localhost:3000) (or the port specified in your console) in your web browser.

## 📜 Key Scripts

- `npm run dev`: Starts the application in development mode with Hot Module Replacement.
- `npm run build`: Bundles the application for production (compiles both React and Express).
- `npm run start`: Runs the production-ready build.
- `npm run format`: Formats codebase using Prettier.
- `npm run test`: Runs test suites via Vitest.
