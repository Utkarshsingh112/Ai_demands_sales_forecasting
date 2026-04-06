# ForecastIQ Development TODO

## Phase 1: Foundation & Design System
- [x] Configure Tailwind with editorial aesthetic (cream bg, serif fonts, geometric lines)
- [x] Set up Google Fonts (Didone serif for headlines, serif for subheadings, sans-serif for details)
- [x] Create global CSS with design tokens and theme variables
- [x] Set up dark/light theme toggle with localStorage persistence

## Phase 2: Database & Backend Core
- [x] Create User model (businessName, email, passwordHash, industry, currency)
- [x] Create SalesData model (userId, datasetName, records array with date/product/category/quantity/revenue)
- [x] Create Forecast model (userId, datasetId, horizon, trend, confidence, forecastData, productForecasts, insights)
- [x] Create Report model (userId, forecastId, generatedAt, pdfUrl, csvUrl)
- [x] Implement auth routes (register, login, JWT flow)
- [x] Build forecast engine (moving average, linear regression, seasonality detection)
- [x] Build data routes (upload, manual entry, list, delete)
- [x] Build forecast routes (run forecast, list, get single)

## Phase 3: UI Components & Layout
- [x] Build Button component (primary, secondary, ghost variants)
- [x] Build Card component with editorial styling
- [x] Build Input/Select components with focus states
- [x] Build Badge component (up/down/neutral/info variants)
- [x] Build TrendIndicator component (↑↓→ with colors)
- [x] Build Spinner and ProgressBar components
- [x] Build Tooltip component
- [x] Build Navbar with logo and theme toggle
- [x] Build Sidebar navigation
- [x] Build PageLayout wrapper
- [x] Build ProtectedRoute component

## Phase 4: Authentication Pages
- [x] Build Landing page with hero, features, testimonials, CTA
- [x] Build Login page with form and error handling
- [x] Build Register page with business info and industry selection
- [x] Implement JWT storage and auth context
- [x] Test auth flow end-to-end

## Phase 5: Data Input Pages
- [x] Build FileUploader component (drag-drop, CSV/XLSX support)
- [x] Build DataPreviewTable component
- [x] Build column mapper UI (date, product_name, quantity_sold, revenue, category)
- [x] Build ManualEntryTable with inline editing
- [x] Build DataInput page with 3 tabs (Upload, Manual, Saved Data)
- [x] Wire to POST /api/data/upload and POST /api/data/manual
- [x] Implement data validation and error states

## Phase 6: Forecast Engine & Results
- [x] Implement moving average calculation (7-day, 30-day weighted)
- [x] Implement linear regression (slope, intercept, R² score)
- [x] Implement seasonality detection (day-of-week, month patterns)
- [x] Implement confidence band calculation (±15%)
- [x] Implement per-product forecasting
- [x] Build ForecastChart (historical + forecast + confidence band)
- [x] Build ProductForecastCards with sparklines and tags
- [x] Build SeasonalityChart
- [x] Build ForecastResults page
- [x] Wire to POST /api/forecast/run

## Phase 7: Dashboard
- [x] Build SalesHistoryChart (area chart with time toggles)
- [x] Build ProductBreakdownChart (horizontal bar chart)
- [x] Build InsightsFeed (scrollable insight cards)
- [x] Build Dashboard page with stats row and charts
- [x] Wire to GET /api/data and GET /api/forecast endpoints

## Phase 8: Reports & Cloud Storage
- [x] Integrate S3 storage for PDF and CSV files
- [x] Build PDF export functionality (jsPDF + html2canvas)
- [x] Build CSV export functionality
- [x] Build Reports page with list and download buttons
- [x] Store report URLs in database
- [x] Implement permanent URL sharing for reports

## Phase 9: Advanced Features
- [x] Build Settings page (profile, currency, theme, password, delete account)
- [x] Implement AI insights generation using LLM (trend narratives, anomaly detection)
- [x] Implement owner notification system (demand spikes, drops, seasonal alerts)
- [x] Add notification preferences to Settings
- [x] Test notification triggers

## Phase 10: Polish & Testing
- [x] Test responsive design (mobile, tablet, desktop)
- [x] Test all loading states and error states
- [x] Test empty states for all pages
- [x] Test auth flow and protected routes
- [x] Test file upload with various formats
- [x] Test forecast calculations accuracy
- [x] Test PDF/CSV export
- [x] Test theme toggle persistence
- [x] Performance optimization
- [x] Accessibility audit

## Completed
- [x] Project initialized with web-db-user scaffold
