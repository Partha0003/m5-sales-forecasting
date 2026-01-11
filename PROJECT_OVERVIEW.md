# Complete Project Overview: Retail Sales Forecasting System

## Executive Summary

This is a **retail sales forecasting system** built for the M5 Forecasting Competition (Walmart data). The system uses **LightGBM machine learning** to predict 28-day sales forecasts for ~30,000 retail products across multiple stores and states. A **Next.js dashboard** provides interactive visualization of historical sales and forecasts.

---

## 1. PROJECT PURPOSE (Simple Business Terms)

**What it does**: Predicts how many units of each product will sell in the next 28 days at Walmart stores.

**Why it matters**: 
- Helps inventory managers plan stock levels
- Reduces stockouts and overstocking
- Optimizes supply chain operations
- Supports data-driven decision making

**Who uses it**: Retail analysts, inventory managers, supply chain planners

---

## 2. DATA FLOW (Step-by-Step)

### 2.1 Input Data Sources (CSV Files - NOT Excel)

**Note**: The project uses CSV files, not Excel files as initially mentioned.

#### Primary Input Files (Root Directory):

1. **`sales_train_validation.csv`** (30,490 rows × 1,919 columns)
   - Wide format: Each row = one product/store combination
   - Columns: `id`, `item_id`, `dept_id`, `cat_id`, `store_id`, `state_id`, `d_1`, `d_2`, ..., `d_1913`
   - Contains daily sales from day 1 to day 1913 (training period)

2. **`calendar.csv`** (1,969 rows × 14 columns)
   - Date mapping: Maps day identifiers (`d_1`, `d_2`, etc.) to actual dates
   - Columns: `d`, `date`, `weekday`, `wday`, `month`, `year`, `event_name_1`, `event_type_1`, `event_name_2`, `event_type_2`, `snap_CA`, `snap_TX`, `snap_WI`, `wm_yr_wk`
   - Includes holidays, events, and SNAP benefit days

3. **`sell_prices.csv`** (6,841,121 rows × 4 columns)
   - Price history for each product/store/week combination
   - Columns: `store_id`, `item_id`, `wm_yr_wk`, `sell_price`

#### Additional Input (Used in Notebook):
- **`sales_train_evaluation.csv`** (30,490 rows × 1,947 columns)
  - Extended dataset with evaluation period data

### 2.2 Data Transformation Pipeline

**Step 1: Load & Optimize** (`read_data()` function)
- Loads CSV files into pandas DataFrames
- **Memory optimization**: Downcasts data types (int64 → int16, float64 → float32) to reduce memory by 30-80%

**Step 2: Wide-to-Long Transformation** (`transform_and_merge()` function)
- **Melt operation**: Converts wide format (one row per product) to long format (one row per product/day)
  - Input: 30,490 rows × 1,913 day columns
  - Output: ~31.3M rows × 3 columns (id, d, sales)
- Adds future forecast columns (`d_1914` to `d_1941`) with NaN values
- **Merges calendar data**: Adds date, events, SNAP days
- **Merges price data**: Adds sell_price for each store/item/week

**Step 3: Feature Engineering**

**Basic Features** (`feature_engineering_basic()`):
- `d_num`: Extracts numeric day number from `d_1`, `d_2`, etc.
- `day_of_week`: 0-6 (Monday=0)
- `month`: 1-12
- `is_weekend`: Binary (1 if Saturday/Sunday)
- `price_momentum`: Current price / average price (normalized price indicator)

**Lag Features** (`feature_engineering_lags()`):
- **Lags**: Sales values from 28, 35, 42, 49, 56 days ago
  - `lag_28`, `lag_35`, `lag_42`, `lag_49`, `lag_56`
- **Rolling Windows**: Moving averages on `lag_28` for windows [7, 14, 28, 60] days
  - `rolling_mean_7`, `rolling_mean_14`, `rolling_mean_28`, `rolling_mean_60`

**Step 4: Categorical Encoding** (`encode_categoricals()`)
- Label encoding for categorical variables:
  - `item_id`, `dept_id`, `cat_id`, `store_id`, `state_id`
  - `event_name_1`, `event_type_1`, `event_name_2`, `event_type_2`
- Fills missing events with 'NoEvent'

**Step 5: Memory Cleanup**
- Saves processed dataset to `processed_dataset.pkl` (31.3M rows × 30 columns)
- Memory reduced to ~1.5GB after optimization

### 2.3 Model Training

**Step 1: Train/Validation Split** (`perform_split()`)
- **Training**: Days 1 to 1885 (before forecast horizon)
- **Validation**: Days 1886 to 1913 (last 28 days of known data)
- **Forecast**: Days 1914 to 1941 (future 28 days)

**Step 2: LightGBM Training** (`run_lgbm()`)
- **Algorithm**: LightGBM Gradient Boosting
- **Objective**: Tweedie regression (optimized for sales count data with zero-inflation)
- **Hyperparameters**:
  - Learning rate: 0.03
  - Number of trees: 1,400 (with early stopping after 5 rounds)
  - Max leaves: 2,047
  - Min data per leaf: 4,095
  - Feature fraction: 0.5 (random subspace)
  - Subsample: 0.5 (bagging)
  - Tweedie variance power: 1.1

**Step 3: Model Evaluation**
- Validation RMSE: **2.1319** (final model)
- Training RMSE: 2.40909
- Model saved to: `lgbm_model_v1.txt`

### 2.4 Prediction Generation

**Step 1: Generate Forecasts** (`predict_forecast()`)
- Uses trained model to predict sales for days 1914-1941
- Input: Feature matrix for forecast period
- Output: Predictions for each product/store/day combination

**Step 2: Format Submission** (`format_submission()`)
- **Pivot operation**: Converts long format back to wide format
  - Each row = one product/store
  - Columns: `id`, `F1`, `F2`, ..., `F28` (forecast days)
- Creates both `_validation` and `_evaluation` versions
- Output saved to: **`submission.csv`**

### 2.5 Output Files Generated

1. **`submission.csv`** (60,980 rows × 29 columns)
   - Main forecast output
   - Format: `id`, `F1`, `F2`, ..., `F28`
   - Contains predictions for all 30,490 products × 2 versions (validation + evaluation)

2. **`item_master.csv`** (30,490 rows × 6 columns)
   - Product metadata
   - Columns: `id`, `item_id`, `dept_id`, `cat_id`, `store_id`, `state_id`
   - Used by frontend for filtering and navigation

3. **`historical_90_days.csv`** (Aggregated)
   - Last 90 days of historical sales in long format
   - Columns: `id`, `date`, `sales`
   - Used by frontend for recent performance charts

4. **`historical_monthly.csv`** (Aggregated)
   - Monthly sales aggregates by year/month
   - Columns: `id`, `year`, `month`, `sales`
   - Used by frontend for historical analysis

5. **`processed_dataset.pkl`** (31.3M rows × 30 columns)
   - Full processed dataset (for notebook reuse)

6. **`lgbm_model_v1.txt`** (Model file)
   - Trained LightGBM model (serialized)

### 2.6 Frontend Data Consumption

**Step 1: Data Setup**
- CSV files copied to `public/` folder (via `setup.ps1` or `setup.sh`)
- Required files: `item_master.csv`, `submission.csv`, `calendar.csv`, `sales_train_evaluation.csv`, `historical_90_days.csv`, `historical_monthly.csv`

**Step 2: Client-Side Loading** (`lib/dataLoader.ts`)
- Uses **PapaParse** library to parse CSV files in browser
- **Caching**: Files loaded once and cached in memory
- Data transformations:
  - Forecast aggregation: Sums forecasts across all stores for same item
  - Historical filtering: Filters by item ID and date ranges
  - Monthly aggregation: Groups by year/month

**Step 3: Visualization**
- Dashboard displays KPIs, charts, and insights
- Product detail pages show historical trends and forecasts
- All data processing happens in browser (no backend API)

---

## 3. ML NOTEBOOK DETAILS

### 3.1 Problem Type
**Time Series Regression**
- **Task**: Predict continuous numeric values (daily sales quantities)
- **Horizon**: 28 days ahead (multi-step forecasting)
- **Granularity**: Daily predictions for 30,490 product/store combinations

### 3.2 Target Variable
- **Name**: `sales`
- **Type**: Non-negative integer (count data, often zero-inflated)
- **Distribution**: Highly skewed, many zeros, positive values when sales occur
- **Range**: Typically 0-100+ units per day per product/store

### 3.3 Features Used

**Categorical Features** (Label Encoded):
1. `item_id` - Product identifier
2. `dept_id` - Department identifier
3. `cat_id` - Category identifier (FOODS, HOBBIES, HOUSEHOLD)
4. `store_id` - Store identifier (CA_1, CA_2, TX_1, etc.)
5. `state_id` - State identifier (CA, TX, WI)
6. `event_name_1` - Primary event name (holidays)
7. `event_type_1` - Primary event type
8. `event_name_2` - Secondary event name
9. `event_type_2` - Secondary event type

**Numerical Features**:
1. `d_num` - Day number (sequential)
2. `day_of_week` - Day of week (0-6)
3. `month` - Month (1-12)
4. `is_weekend` - Binary (0 or 1)
5. `sell_price` - Product price
6. `price_momentum` - Price / average price
7. `lag_28` - Sales 28 days ago
8. `lag_35` - Sales 35 days ago
9. `lag_42` - Sales 42 days ago
10. `lag_49` - Sales 49 days ago
11. `lag_56` - Sales 56 days ago
12. `rolling_mean_7` - 7-day rolling average
13. `rolling_mean_14` - 14-day rolling average
14. `rolling_mean_28` - 28-day rolling average
15. `rolling_mean_60` - 60-day rolling average

**Total Features**: ~15-20 features (exact count depends on encoding)

### 3.4 Algorithm/Model

**Algorithm**: **LightGBM** (Light Gradient Boosting Machine)
- **Type**: Gradient Boosting Decision Trees (GBDT)
- **Library**: `lightgbm` Python package
- **Why LightGBM**: 
  - Fast training on large datasets (31M rows)
  - Handles categorical features natively
  - Good performance on tabular data
  - Efficient memory usage

**Loss Function**: **Tweedie Regression**
- **Variance Power**: 1.1
- **Why Tweedie**: Designed for count data with zero-inflation (many zero sales days)
- **Properties**: Handles both continuous and discrete sales patterns

**Training Configuration**:
- **Epochs**: 1,400 (with early stopping after 5 rounds without improvement)
- **Actual epochs trained**: 207 (early stopping)
- **Learning rate**: 0.03 (conservative)
- **Regularization**: 
  - Feature fraction: 0.5 (random feature sampling)
  - Subsample: 0.5 (random row sampling)
  - Min data per leaf: 4,095 (prevents overfitting)

### 3.5 Training & Evaluation Logic

**Train/Validation Split**:
- **Training set**: Days 1-1885 (1,885 days × ~30,490 products = ~57M samples)
- **Validation set**: Days 1886-1913 (28 days × ~30,490 products = ~853K samples)
- **No explicit test set**: Validation set used for early stopping and model selection

**Training Process**:
1. Create LightGBM Dataset objects for train and validation
2. Train with callbacks:
   - Early stopping: Stop if validation RMSE doesn't improve for 5 rounds
   - Log evaluation: Print metrics every 100 iterations
3. Model checkpoints saved at best validation score
4. Final model saved to disk

**Evaluation Metrics**:
- **Primary**: RMSE (Root Mean Squared Error)
  - Training RMSE: 2.40909
  - Validation RMSE: 2.1319
- **Note**: Lower RMSE on validation than training suggests good generalization (validation period may have different patterns)

**Prediction Process**:
1. Generate features for forecast period (days 1914-1941)
2. Use trained model to predict sales for each product/store/day
3. Format predictions into submission format (F1-F28 columns)
4. Export to CSV

### 3.6 Model Limitations

1. **No External Features**: Model only uses historical sales, prices, and calendar events
   - Missing: Promotions, marketing campaigns, competitor data, weather
   
2. **Static Features**: Lag features require historical data
   - First predictions may be less accurate due to missing lag values
   
3. **Fixed Horizon**: Model optimized for 28-day forecast
   - Not tested for longer horizons (60, 90 days)
   
4. **No Store/Item Interactions**: Model treats each product/store independently
   - Doesn't model cross-product effects or store-level trends
   
5. **Tweedie Assumptions**: Assumes Tweedie distribution
   - May not capture all nuances of zero-inflated sales patterns
   
6. **Computational Constraints**: 
   - Training requires significant memory (~1.5GB+ processed data)
   - Not suitable for real-time predictions without optimization
   
7. **No Uncertainty Quantification**: 
   - Provides point forecasts only
   - No confidence intervals or prediction intervals
   
8. **Limited Hyperparameter Tuning**:
   - Hyperparameters appear to be manually set
   - No grid search or Bayesian optimization evident

---

## 4. CSV FILES DETAILED BREAKDOWN

### 4.1 Input Files (Root Directory)

#### `sales_train_validation.csv`
- **Role**: Primary training data - historical daily sales
- **Schema**:
  - **Metadata columns**: `id`, `item_id`, `dept_id`, `cat_id`, `store_id`, `state_id`
  - **Sales columns**: `d_1`, `d_2`, ..., `d_1913` (daily sales values)
- **Size**: 30,490 rows × 1,919 columns
- **Format**: Wide format (one row per product/store)
- **Key Characteristics**:
  - Contains 1,913 days of historical data
  - Each `id` is unique: `{item_id}_{store_id}_{state_id}_validation`
  - Example ID: `FOODS_1_001_CA_1_validation`

#### `calendar.csv`
- **Role**: Date and event mapping
- **Schema**:
  - `d`: Day identifier (`d_1`, `d_2`, etc.)
  - `date`: Actual date (YYYY-MM-DD)
  - `weekday`, `wday`: Day of week
  - `month`, `year`: Date components
  - `event_name_1`, `event_type_1`: Primary events (holidays)
  - `event_name_2`, `event_type_2`: Secondary events
  - `snap_CA`, `snap_TX`, `snap_WI`: SNAP benefit days (binary)
  - `wm_yr_wk`: Week identifier for price matching
- **Size**: 1,969 rows × 14 columns
- **Usage**: Maps day numbers to dates, adds calendar features

#### `sell_prices.csv`
- **Role**: Historical pricing data
- **Schema**:
  - `store_id`: Store identifier
  - `item_id`: Item identifier
  - `wm_yr_wk`: Week identifier
  - `sell_price`: Price for that week
- **Size**: 6,841,121 rows × 4 columns
- **Usage**: Merged with sales data to add price features
- **Key**: One price per store/item/week combination

#### `sales_train_evaluation.csv` (Optional)
- **Role**: Extended dataset including evaluation period
- **Schema**: Similar to `sales_train_validation.csv` but with more days (up to d_1941)
- **Usage**: Used for generating historical aggregation files for frontend

### 4.2 Output Files (Root Directory → Copied to `public/`)

#### `submission.csv`
- **Role**: **Primary ML output** - 28-day forecasts
- **Schema**:
  - `id`: Product/store identifier
  - `F1`, `F2`, ..., `F28`: Forecast values for days 1-28
- **Size**: 60,980 rows × 29 columns
- **Format**: Wide format (one row per product/store)
- **Content**: Contains both `_validation` and `_evaluation` versions
- **Relationship to Input**: 
  - Input `id` format: `{item_id}_{store_id}_{state_id}_validation`
  - Output includes both `_validation` and `_evaluation` versions
  - Each input row generates 2 output rows (validation + evaluation)

#### `item_master.csv`
- **Role**: Product metadata reference
- **Schema**:
  - `id`: Full identifier (matches submission.csv)
  - `item_id`: Base item identifier
  - `dept_id`: Department
  - `cat_id`: Category
  - `store_id`: Store
  - `state_id`: State
- **Size**: 30,490 rows × 6 columns
- **Usage**: Frontend uses this for filtering and navigation
- **Relationship**: Extracted from input sales file metadata columns

#### `historical_90_days.csv`
- **Role**: Pre-aggregated recent sales for frontend
- **Schema**:
  - `id`: Product/store identifier
  - `date`: Date (YYYY-MM-DD)
  - `sales`: Daily sales value
- **Format**: Long format (one row per product/store/date)
- **Content**: Last 90 days of historical sales
- **Usage**: Powers "Recent Performance" charts in frontend

#### `historical_monthly.csv`
- **Role**: Pre-aggregated monthly sales for frontend
- **Schema**:
  - `id`: Product/store identifier
  - `year`: Year (2011-2016)
  - `month`: Month (1-12)
  - `sales`: Monthly aggregated sales
- **Format**: Long format (one row per product/store/year/month)
- **Usage**: Powers "Historical Analysis" charts in frontend

### 4.3 Data Relationships

```
sales_train_validation.csv (Input)
    ↓ [Extract metadata]
item_master.csv (Output)

sales_train_validation.csv (Input)
    ↓ [Melt + Merge calendar + Merge prices]
    ↓ [Feature engineering]
    ↓ [Train model]
    ↓ [Generate predictions]
submission.csv (Output)

sales_train_evaluation.csv (Input)
    ↓ [Melt + Filter last 90 days]
historical_90_days.csv (Output)

sales_train_evaluation.csv (Input)
    ↓ [Melt + Group by year/month]
historical_monthly.csv (Output)
```

### 4.4 ID Structure

**Input Format**: `{item_id}_{store_id}_{state_id}_validation`
- Example: `FOODS_1_001_CA_1_validation`
  - `FOODS_1_001`: Item ID (Category_Dept_Item)
  - `CA_1`: Store ID (State_StoreNumber)
  - `validation`: Dataset type

**Output Format**: Same structure, but includes both:
- `{item_id}_{store_id}_{state_id}_validation`
- `{item_id}_{store_id}_{state_id}_evaluation`

**Frontend Aggregation**: 
- Frontend extracts base `item_id` (first 3 parts) to aggregate across stores
- Example: `FOODS_1_001` represents item across all stores/states

---

## 5. FRONTEND DETAILS

### 5.1 Tech Stack

**Framework**: Next.js 14 (App Router)
- **React**: 18.2.0
- **TypeScript**: 5.3.0
- **Build Tool**: Next.js built-in (Turbopack/Webpack)

**Styling**:
- **Tailwind CSS**: 3.3.6
- **PostCSS**: 8.4.32
- **Autoprefixer**: 10.4.16

**Data Visualization**:
- **Recharts**: 2.10.0 (React charting library)

**Data Processing**:
- **PapaParse**: 5.4.1 (CSV parsing in browser)

**Deployment**:
- **Client-side only**: No backend server
- **Static site generation**: Can be deployed to Vercel, Netlify, etc.

### 5.2 Connection to ML/Output

**Direct CSV Consumption**:
- Frontend reads CSV files directly from `public/` folder
- No API layer - files served as static assets
- All data processing happens in browser (client-side)

**Data Flow**:
1. **Initial Load**: 
   - `item_master.csv` → Populates filter options
   - `submission.csv` → Cached for forecast lookups
   - `calendar.csv` → Used for date mapping

2. **On Item Selection**:
   - `historical_90_days.csv` → Recent performance chart
   - `historical_monthly.csv` → Historical analysis (yearly view)
   - `submission.csv` → Forecast chart (aggregated across stores)

3. **Aggregation Logic** (`lib/dataLoader.ts`):
   - **Forecasts**: Sums F1-F28 values across all stores for same base item_id
   - **Historical**: Filters by base item_id, sums across stores
   - **Dates**: Maps day numbers to actual dates using calendar

### 5.3 Key Screens/Components

#### Dashboard Page (`app/page.tsx`)

**Layout**:
- **Left Sidebar**: FilterSidebar component (1/4 width)
- **Main Content**: KPI cards + charts (3/4 width)

**Components**:
1. **FilterSidebar** (`components/FilterSidebar.tsx`)
   - Cascading filters: State → Store → Category → Department → Item
   - Each filter updates available options in dependent filters
   - Items list below filters (max 50 displayed)

2. **KPI Cards** (`components/KPICard.tsx`)
   - Total Historical Sales (last 90 days)
   - Average Daily Sales
   - Forecasted Growth % (next 28 days vs last 28 days)

3. **Recent Performance Chart** (`components/RecentPerformanceChart.tsx`)
   - Line chart showing last 90 days of sales
   - X-axis: Dates
   - Y-axis: Sales volume
   - Tooltips on hover

4. **Forecast Chart** (`components/ForecastChart.tsx`)
   - Line chart showing next 28 days of forecasts
   - X-axis: Dates
   - Y-axis: Forecasted sales
   - Visual distinction from historical (dashed line, different color)

5. **Items List**
   - Clickable list of filtered items
   - Navigates to product detail page
   - Shows item_id, store_id, category

#### Product Detail Page (`app/product/[item_id]/page.tsx`)

**Layout**: Single column, stacked sections

**Components**:
1. **Product Summary Card**
   - Displays: Item ID, State, Store, Category, Department
   - Note: All metrics aggregated across all stores

2. **KPI Cards** (Same as dashboard, but for selected item)

3. **Recent Performance Chart** (Last 90 days)

4. **Historical Analysis Section**
   - Year selector dropdown (2011-2016)
   - Monthly Sales Chart (`components/MonthlySalesChart.tsx`)
   - Bar chart showing monthly sales for selected year

5. **Forecast Analysis Chart** (28-day forecast)

6. **Business Insights Section**
   - Auto-generated insights (`lib/insights.ts`)
   - Logic-based (not AI-generated):
     - Forecast growth trends
     - Recent trend analysis
     - Volatility assessment
     - Seasonality detection (Q4 peaks)

### 5.4 Component Architecture

```
app/
├── layout.tsx (Root layout)
├── page.tsx (Dashboard)
└── product/
    └── [item_id]/
        └── page.tsx (Product detail)

components/
├── FilterSidebar.tsx
├── KPICard.tsx
├── RecentPerformanceChart.tsx
├── ForecastChart.tsx
└── MonthlySalesChart.tsx

lib/
├── types.ts (TypeScript interfaces)
├── dataLoader.ts (CSV loading + data transformations)
└── insights.ts (Business insight generation)
```

### 5.5 Data Processing Logic

**Filtering** (`getFilteredItems()`):
- Filters item_master by state, store, category, department, item
- Returns matching items for display

**Forecast Aggregation** (`getForecastForItem()`):
- Finds all forecast rows matching base item_id (across all stores)
- Sums F1-F28 values for each day
- Maps to dates using calendar data

**Historical Aggregation**:
- `getLast90DaysSales()`: Filters historical_90_days by item_id, sums across stores
- `getYearlySalesData()`: Filters historical_monthly by item_id and year, groups by month

**Insight Generation** (`generateInsights()`):
- Compares forecast average vs recent average → Growth %
- Compares first half vs second half of recent period → Trend
- Calculates coefficient of variation → Volatility
- Detects seasonal patterns (peak months, Q4 peaks)

---

## 6. ASSUMPTIONS, DEPENDENCIES & RISKS

### 6.1 Assumptions

1. **Data Format Stability**: Assumes input CSV schemas remain consistent
2. **ID Structure**: Assumes ID format `{item_id}_{store_id}_{state_id}_{type}` remains stable
3. **Date Continuity**: Assumes calendar.csv covers all required date ranges
4. **Price Availability**: Assumes prices exist for all store/item/week combinations (may have missing values)
5. **Browser Compatibility**: Assumes modern browsers with ES6+ support
6. **File Size**: Assumes CSV files can be loaded in browser memory (may be issue for very large files)
7. **Forecast Period**: Assumes 28-day forecast horizon is fixed (model trained for this)
8. **Historical Data**: Assumes sufficient historical data exists for lag features (needs 56+ days minimum)

### 6.2 Dependencies

**Python/ML Dependencies**:
- pandas, numpy, lightgbm
- sklearn (for LabelEncoder)
- matplotlib (for visualization - optional)

**Node.js/Frontend Dependencies**:
- next: ^14.0.0
- react: ^18.2.0
- react-dom: ^18.2.0
- papaparse: ^5.4.1
- recharts: ^2.10.0
- tailwindcss: ^3.3.6
- typescript: ^5.3.0

**External Data Dependencies**:
- M5 Forecasting Competition dataset (sales, calendar, prices)
- All CSV files must be present and properly formatted

**System Dependencies**:
- Python 3.x (for notebook execution)
- Node.js 18+ (for frontend)
- Sufficient memory for processing large datasets (8GB+ recommended)

### 6.3 Risks

**Data Quality Risks**:
1. **Missing Values**: Price data may have gaps, affecting feature engineering
2. **Data Drift**: Model trained on 2011-2016 data may not generalize to future years
3. **Outliers**: Extreme sales events (promotions, stockouts) may not be captured well
4. **ID Mismatches**: If ID formats change, frontend aggregation may break

**Model Performance Risks**:
1. **Overfitting**: Despite validation, model may overfit to training patterns
2. **Seasonality Changes**: Future seasonality may differ from historical patterns
3. **New Products**: Model cannot forecast products with no historical data
4. **External Factors**: Missing external features (promotions, marketing) limits accuracy

**Scalability Risks**:
1. **Browser Memory**: Large CSV files may cause browser crashes on low-memory devices
2. **Load Times**: Parsing large CSVs in browser may be slow
3. **Model Retraining**: Retraining requires significant computational resources
4. **Real-time Updates**: Current architecture doesn't support real-time forecast updates

**Operational Risks**:
1. **File Management**: Manual CSV copying required (setup scripts help but are manual)
2. **Version Control**: CSV files are large and shouldn't be in git
3. **Deployment**: Frontend requires all CSV files in public folder
4. **Data Freshness**: No automatic pipeline - manual notebook execution required

**Security Risks**:
1. **Client-Side Data**: All data exposed to browser (may be sensitive)
2. **No Authentication**: Frontend has no access control
3. **CSV Injection**: CSV parsing may be vulnerable if data is untrusted

---

## 7. SYSTEM ARCHITECTURE DIAGRAM (Text-Based)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         INPUT DATA LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  sales_train_validation.csv  │  calendar.csv  │  sell_prices.csv      │
│  (30K rows × 1.9K cols)      │  (2K rows)     │  (6.8M rows)          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATA PROCESSING LAYER                              │
│                    (Jupyter Notebook Pipeline)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │  1. Data Load    │→ │  2. Transform    │→ │  3. Feature Eng. │    │
│  │  - Read CSVs     │  │  - Wide→Long     │  │  - Lags          │    │
│  │  - Downcast      │  │  - Merge calendar│  │  - Rolling means │    │
│  │  - Optimize mem  │  │  - Merge prices  │  │  - Calendar feats│    │
│  └──────────────────┘  └──────────────────┘  │  - Encode cats   │    │
│                                               └──────────────────┘    │
│                                                      ↓                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐    │
│  │  4. Train Model  │→ │  5. Generate     │→ │  6. Format       │    │
│  │  - Train/Val     │  │     Forecasts    │  │     Output       │    │
│  │  - LightGBM      │  │  - Predict       │  │  - Pivot format  │    │
│  │  - Early stop    │  │    1914-1941     │  │  - Export CSV    │    │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                         OUTPUT DATA LAYER                               │
├─────────────────────────────────────────────────────────────────────────┤
│  submission.csv       │  item_master.csv  │  historical_90_days.csv   │
│  (60K rows × 29 cols) │  (30K rows)       │  historical_monthly.csv   │
│  lgbm_model_v1.txt    │  processed_dataset.pkl                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
                        [Manual Copy to public/]
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER (Next.js)                           │
│                         (Client-Side Only)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  Browser (Client)                                            │     │
│  │                                                               │     │
│  │  ┌──────────────────┐  ┌──────────────────┐                │     │
│  │  │  Data Loader     │→ │  Components      │                │     │
│  │  │  (PapaParse)     │  │  - FilterSidebar │                │     │
│  │  │  - Load CSVs     │  │  - Charts        │                │     │
│  │  │  - Cache data    │  │  - KPICards      │                │     │
│  │  │  - Transform     │  │  - Insights      │                │     │
│  │  └──────────────────┘  └──────────────────┘                │     │
│  │         ↓                           ↓                        │     │
│  │  ┌──────────────────────────────────────┐                  │     │
│  │  │  Pages                               │                  │     │
│  │  │  - / (Dashboard)                     │                  │     │
│  │  │  - /product/[item_id] (Detail)       │                  │     │
│  │  └──────────────────────────────────────┘                  │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

DATA FLOW SUMMARY:
Input CSVs → Notebook Processing → ML Model Training → Forecast Generation 
→ Output CSVs → Copy to public/ → Frontend Loads → Browser Visualization
```

---

## 8. IMPROVEMENT RECOMMENDATIONS

### 8.1 Data Quality

1. **Handle Missing Prices**: 
   - Implement price imputation (forward fill, interpolation)
   - Add missing price indicators as features

2. **Outlier Detection**: 
   - Identify and handle extreme sales values
   - Add outlier flags as features

3. **Data Validation**: 
   - Add schema validation for input CSVs
   - Check for date gaps, duplicate IDs, negative sales

4. **Feature Engineering**: 
   - Add promotion indicators (if available)
   - Add competitor data (if available)
   - Add weather data (if applicable)
   - Add product lifecycle features (days since launch)

### 8.2 Model Performance

1. **Hyperparameter Tuning**: 
   - Use Optuna or Hyperopt for automated tuning
   - Cross-validation across multiple time periods

2. **Ensemble Methods**: 
   - Combine multiple models (LightGBM + XGBoost + CatBoost)
   - Weighted ensemble based on validation performance

3. **Advanced Features**: 
   - Add Fourier features for seasonality
   - Add interaction features (item × store, category × month)
   - Add time-to-event features (days until next holiday)

4. **Hierarchical Forecasting**: 
   - Model aggregate levels (category, department)
   - Reconcile bottom-up and top-down forecasts

5. **Uncertainty Quantification**: 
   - Add prediction intervals (quantile regression)
   - Provide confidence scores for forecasts

6. **Evaluation Metrics**: 
   - Add more metrics (MAE, MAPE, WMAPE)
   - Evaluate by product category, store type
   - Add business metrics (inventory cost, stockout rate)

### 8.3 Scalability

1. **Backend API**: 
   - Move data processing to Node.js/Python backend
   - Use REST API or GraphQL for data queries
   - Implement pagination for large datasets

2. **Database Integration**: 
   - Replace CSV files with database (PostgreSQL, BigQuery)
   - Enable efficient queries and filtering
   - Support incremental data updates

3. **Caching Strategy**: 
   - Use Redis for server-side caching
   - Implement browser IndexedDB for client-side storage
   - Add CDN for static CSV files

4. **Model Serving**: 
   - Deploy model as API (Flask, FastAPI, TensorFlow Serving)
   - Enable on-demand predictions
   - Support model versioning

5. **Data Pipeline Automation**: 
   - Set up scheduled notebook execution (Airflow, Prefect)
   - Automate CSV generation and deployment
   - Add data quality checks in pipeline

6. **Frontend Optimization**: 
   - Implement virtual scrolling for large item lists
   - Add lazy loading for charts
   - Use Web Workers for CSV parsing

### 8.4 User Experience (UX)

1. **Performance**: 
   - Add loading skeletons
   - Implement progressive data loading
   - Optimize chart rendering (virtualize data points)

2. **Interactivity**: 
   - Add date range selectors for historical view
   - Enable forecast horizon selection (7, 14, 28, 60 days)
   - Add export functionality (PDF, Excel)

3. **Visualization**: 
   - Add comparison mode (compare multiple items)
   - Add forecast accuracy overlay (if actuals available)
   - Add interactive drill-down (category → department → item)

4. **Filtering**: 
   - Add search functionality for item IDs
   - Add saved filter presets
   - Add bulk item selection

5. **Insights**: 
   - Add AI-generated insights (GPT integration)
   - Add anomaly detection alerts
   - Add recommended actions based on forecasts

6. **Mobile Responsiveness**: 
   - Optimize layout for mobile devices
   - Add mobile-friendly charts
   - Implement touch gestures

7. **Accessibility**: 
   - Add ARIA labels
   - Support keyboard navigation
   - Add high-contrast mode

8. **Documentation**: 
   - Add tooltips explaining metrics
   - Add user guide/documentation page
   - Add data dictionary

---

## 9. SUMMARY

### Simple Language Summary

This system helps Walmart predict how many products they'll sell in the next 28 days. It uses machine learning (LightGBM) to learn from 5+ years of historical sales data, then makes predictions for 30,000+ products across multiple stores. A web dashboard lets users explore historical sales and see forecasts in charts and graphs.

### Technical Summary

**Architecture**: Offline ML pipeline (Jupyter notebook) + Static web frontend (Next.js)

**ML Approach**: 
- LightGBM gradient boosting with Tweedie loss
- Time series regression with lag and rolling features
- 28-day forecast horizon
- Validation RMSE: 2.1319

**Data Flow**: 
CSV inputs → Pandas processing → Feature engineering → Model training → CSV outputs → Frontend visualization

**Frontend**: 
- Next.js 14 with TypeScript
- Client-side CSV parsing (PapaParse)
- Recharts for visualization
- No backend API (static deployment)

**Strengths**: 
- Simple architecture (no complex infrastructure)
- Good model performance for baseline
- Interactive visualization
- Easy to deploy frontend

**Weaknesses**: 
- Manual data pipeline (not automated)
- No real-time capabilities
- Limited scalability (CSV-based)
- Missing external features
- No uncertainty quantification

**Use Case**: 
Suitable for offline forecasting scenarios where manual model retraining is acceptable and forecasts don't need to update in real-time.

---

## 10. QUICK REFERENCE

### Key Files

**Notebook**: `forecasting-sales-with-lightgbm-m5-pipeline.ipynb`
**Frontend Entry**: `app/page.tsx`
**Data Loader**: `lib/dataLoader.ts`
**Main Config**: Notebook `ProjectConfig` class

### Key Metrics

- **Training Samples**: ~57M (days 1-1885)
- **Validation Samples**: ~853K (days 1886-1913)
- **Forecast Samples**: ~853K (days 1914-1941)
- **Products**: 30,490 unique product/store combinations
- **Model RMSE**: 2.1319 (validation)
- **Features**: ~15-20 engineered features

### Key Commands

**Setup Frontend**:
```bash
npm install
.\setup.ps1  # Windows
npm run dev
```

**Run Notebook**:
- Open in Jupyter Lab/Notebook
- Execute cells sequentially
- Ensure data path is correct in `ProjectConfig`

---

**Document Generated**: Complete analysis of M5 Forecasting System
**Last Updated**: Based on current codebase analysis
