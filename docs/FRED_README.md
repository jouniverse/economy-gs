# FRED Data

> This is part of the **Economy Data** add-on. Access via **Economy Data → FRED Data** in the menu bar.

A sidebar integration that fetches economic data from the [FRED API](https://fred.stlouisfed.org/docs/api/fred/) (Federal Reserve Economic Data) directly into Google Sheets.

**API key required** — get a free key at [fred.stlouisfed.org/docs/api/api_key.html](https://fred.stlouisfed.org/docs/api/api_key.html). Set it via **Economy Data → Settings** or in the sidebar's **Reference** tab.

## Features

- **Search** — Search for any FRED series by keyword (full text) or series ID (with wildcards), then fetch observations with one click.
- **Quick Fetch** — One-click access to 22 key economic indicators organized by category (inflation, inflation expectations, labor, growth, interest rates, money supply, sentiment, equities, commodities & energy).
- **Reference** — Commonly used series with links to FRED pages; save your API key in the sidebar; export all FRED sources to a sheet; browse categories from the API root with lazy loading, in-memory caching, and export category series (metadata table) to a sheet with automatic pagination for categories with more than 1,000 series.
- **Configurable options** — Choose units (levels, percent change, etc.), frequency aggregation, date range, and aggregation method.

## Usage

1. Open the sidebar via **Economy Data → FRED Data**
2. Use the **Search** tab to find series by keyword or ID, or switch to **Quick Fetch** for pre-configured indicators.
3. Configure options (units, frequency, date range) as needed.
4. Click **Fetch** to pull data into the active sheet.

### API Key Setup

Set your FRED API key using either method:

- **Recommended:** Open the sidebar's **Reference** tab, expand **API Key**, paste your key, and click **Save**.
- **Alternative:** Use **Economy Data → Settings…** to manage all API keys in one place.

The key is stored as Script Property `FRED_API_KEY`.

### Rate Limits

FRED allows approximately **120 requests per minute**. Large exports that span multiple API calls consume several requests in one action.

## Available Indicator Functions

All functions accept an optional `options` object and can be called from the sidebar or programmatically.

| Function              | Series ID    | Description                           |
| --------------------- | ------------ | ------------------------------------- |
| `FRED_CPI()`          | CPIAUCSL     | Consumer Price Index                  |
| `FRED_PCE()`          | PCE          | Personal Consumption Expenditures     |
| `FRED_UNRATE()`       | UNRATE       | Unemployment Rate                     |
| `FRED_PAYEMS()`       | PAYEMS       | Nonfarm Payrolls                      |
| `FRED_GDP()`          | GDPC1        | Real GDP                              |
| `FRED_INDPRO()`       | INDPRO       | Industrial Production Index           |
| `FRED_FEDFUNDS()`     | FEDFUNDS     | Fed Funds Effective Rate              |
| `FRED_DGS10()`        | DGS10        | 10-Year Treasury Yield                |
| `FRED_DGS30()`        | DGS30        | 30-Year Treasury Yield                |
| `FRED_TB3MS()`        | TB3MS        | 3-Month Treasury Bill Rate            |
| `FRED_MORTGAGE30US()` | MORTGAGE30US | 30-Year Fixed Mortgage Rate           |
| `FRED_T10Y2Y()`       | T10Y2Y       | 10Y-2Y Treasury Spread                |
| `FRED_M2SL()`         | M2SL         | M2 Money Stock                        |
| `FRED_VIX()`          | VIXCLS       | VIX Index                             |
| `FRED_UMCSENT()`      | UMCSENT      | Consumer Sentiment (UMich)            |
| `FRED_DJIA()`         | DJIA         | Dow Jones Industrial Average          |
| `FRED_SP500()`        | SP500        | S&P 500                               |
| `FRED_NASDAQCOM()`    | NASDAQCOM    | NASDAQ Composite Index                |
| `FRED_EXPINF1YR()`    | EXPINF1YR    | Expected Inflation Rate over 1 Year   |
| `FRED_EXPINF30YR()`   | EXPINF30YR   | Expected Inflation Rate over 30 Years |
| `FRED_DHHNGSP()`      | DHHNGSP      | Henry Hub Natural Gas Spot Price      |
| `FRED_WTISPLC()`      | WTISPLC      | WTI Crude Oil Spot Price              |

### Example

```javascript
FRED_CPI({ units: "pc1", frequency: "a", observation_start: "2000-01-01" });
```

### Options

- `units` — `"lin"` (levels), `"chg"`, `"ch1"`, `"pch"`, `"pc1"`, `"pca"`, `"cch"`, `"cca"`, `"log"`
- `frequency` — `"d"`, `"w"`, `"bw"`, `"m"`, `"q"`, `"sa"`, `"a"`
- `aggregation_method` — `"avg"`, `"sum"`, `"eop"`
- `observation_start` / `observation_end` — `"YYYY-MM-DD"`

### Reference Tab: Category Browse

- Starts at category id `0` (top-level topics). Each click loads subcategories via `fred/category/children` (results are cached in the sidebar until you save a new API key).
- **Series count** uses `fred/category/series` (first page). **Export** pulls all pages (limit 1000, increasing `offset`) and writes metadata columns: `id`, `title`, `observation_start`, `observation_end`, `frequency`, `frequency_short`, `units`, `units_short`, `seasonal_adjustment`, `last_updated`.
- E.g. _stock market indicators_: All categories > Money, Banking, & Finance > Financial Indicators > Stock Market Indexes; _consumer price indices_: All categories > Prices > Consumer Price Indexes (CPI and PCE)

## Links

- [FRED Homepage](https://fred.stlouisfed.org/)
- [FRED API Documentation](https://fred.stlouisfed.org/docs/api/fred/)
- [Get a FRED API Key](https://fred.stlouisfed.org/docs/api/api_key.html)
