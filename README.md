# Retail Sales Analytics & Forecasting Dashboard

A professional, business-grade retail sales analytics and forecasting web application built with Next.js, Tailwind CSS, and Recharts.

## Features

- **Dashboard Page** with cascading filters (State → Store → Category → Department → Item)
- **Product Detail Page** with comprehensive sales analysis
- **KPI Cards** showing key metrics
- **Interactive Charts** for sales visualization and forecasting
- **Historical Analysis** with year-wise and month-wise aggregation
- **Business Insights** generated using simple logic-based calculations
- **28-Day Demand Forecasts** visualized alongside historical data

## Technology Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **PapaParse** for CSV parsing
- **Client-side only** - no backend or APIs required

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Prepare Data Files

The application expects CSV files to be in the `public` folder. You need to copy your data files to the `public` directory.

**Quick Setup (Recommended)**:
- **Windows**: Run `.\setup.ps1` in PowerShell
- **Linux/Mac**: Run `chmod +x setup.sh && ./setup.sh`

**Manual Setup**:
If your CSV files are currently in the project root, copy them to the `public` directory:

```bash
# On Windows (PowerShell)
Copy-Item item_master.csv public/
Copy-Item submission.csv public/
Copy-Item calendar.csv public/
Copy-Item sales_train_evaluation.csv public/

# On Linux/Mac
cp item_master.csv public/
cp submission.csv public/
cp calendar.csv public/
cp sales_train_evaluation.csv public/
```

**Required Files**:
```
public/
  ├── item_master.csv
  ├── submission.csv
  ├── calendar.csv
  └── sales_train_evaluation.csv
```

**Important**: These CSV files must be in the `public` folder for Next.js to serve them to the browser.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### 4. Build for Production

```bash
npm run build
npm start
```

## Data File Structure

### item_master.csv
Contains product hierarchy metadata with columns:
- `id`: Unique identifier (e.g., "FOODS_1_001_CA_1_validation")
- `item_id`: Item identifier
- `dept_id`: Department identifier
- `cat_id`: Category identifier
- `store_id`: Store identifier
- `state_id`: State identifier

### submission.csv
Contains 28-day forecast output with columns:
- `id`: Unique identifier matching item_master
- `F1` through `F28`: Forecast values for days 1-28

### calendar.csv
Contains date mapping with columns:
- `date`: Date in YYYY-MM-DD format
- `d`: Day identifier (e.g., "d_1", "d_2")
- `year`: Year
- `month`: Month

### sales_train_evaluation.csv
Contains historical sales data in wide format:
- Metadata columns: `id`, `item_id`, `dept_id`, `cat_id`, `store_id`, `state_id`
- Sales columns: `d_1`, `d_2`, ..., `d_1941` (daily sales values)

## Application Structure

### Dashboard Page (`/`)
- Left sidebar with cascading filters
- KPI cards showing:
  - Total historical sales (last 90 days)
  - Average daily sales
  - Forecasted growth percentage
- Recent Performance Chart (last 90 days)
- Forecast Chart (next 28 days)
- Clickable items list for navigation

### Product Detail Page (`/product/[item_id]`)
- Product summary card
- Recent Performance (last 90 days) - default view
- Historical Analysis with year selector (2011-2016) and monthly aggregation
- Forecast Analysis (28 days)
- Business Insights (automatically generated)

## Performance Notes

- The application uses client-side data loading and caching
- Large CSV files are cached in memory after first load
- Historical sales data is transformed from wide format to long format on-demand
- The dashboard loads only item master and forecast summary initially
- Historical sales data loads only when an item is selected

## Browser Compatibility

- Modern browsers with ES6+ support
- Recommended: Chrome, Firefox, Safari, Edge (latest versions)

## License

This project is for educational/demonstration purposes.

