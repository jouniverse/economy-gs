# IMF Data

> This is part of the **Economy Data** add-on. Access via **Economy Data → IMF Data** in the menu bar.

A sidebar integration for fetching macroeconomic data from the [IMF Data Portal](https://data.imf.org/en) directly into Google Sheets. Uses the IMF's SDMX 3.0 REST API — no API key required.

## Features

- **Explorer** — Search and browse 150+ IMF datasets. Select dimensions interactively with human-readable labels, filter by country, indicator, frequency, and time period, then fetch data into a new sheet.
- **Quick Fetch** — One-click access to 20 pre-configured indicators covering GDP, inflation, trade, exchange rates, interest rates, government finance, labor, and climate. Includes sensible defaults with optional overrides.
- **Reference** — Links to key IMF datasets, the IMF API documentation, and guidance on SDMX conventions.

Data is written to dedicated sheets with full dimension labels and time period columns, ready for charting and analysis.

## Usage

Open the sidebar from the menu bar: **Economy Data → IMF Data**

The sidebar has three tabs: **Explorer**, **Quick Fetch**, and **Reference**.

### Explorer Tab

1. **Search** — Type a keyword (e.g., "consumer price", "trade", "GDP") in the search box. Results show the dataset ID, name, and agency.
2. **Select a dataset** — Click a result to load its dimensions. Each dimension shows available values with human-readable names (e.g., "USA — United States" instead of just "USA").
3. **Filter dimensions** — Select one or more values from each dimension. Hold Ctrl/Cmd to multi-select. Leave a dimension empty to include all values.
4. **Set options** — Expand the Options panel to set start/end periods or limit the number of observations.
5. **Fetch** — Click "Fetch Data" to retrieve the data and write it to a new sheet.

### Quick Fetch Tab

Pre-configured presets for common indicators. Click "Fetch" to retrieve data with default settings, or expand the preset to override countries, time range, or frequency.

#### Available Presets

| Category               | Preset                           | Dataset | Default Countries       |
| ---------------------- | -------------------------------- | ------- | ----------------------- |
| **GDP & Growth**       | Real GDP Growth (%)              | WEO     | USA, CHN, DEU, JPN, GBR |
|                        | GDP, PPP (Intl $, Bn)            | WEO     | USA, CHN, DEU, JPN, GBR |
|                        | GDP, Nominal (National Accounts) | ANEA    | USA                     |
| **Prices & Inflation** | Consumer Price Index             | CPI     | USA                     |
|                        | CPI, Year-over-Year (%)          | CPI     | USA                     |
|                        | Producer Price Index             | PPI     | USA                     |
|                        | Crude Oil Price (Brent, USD)     | PCPS    | G001 (World)            |
| **Trade & BOP**        | Current Account Balance          | BOP     | USA                     |
|                        | Trade Balance (by Partner)       | IMTS    | USA                     |
| **Fiscal**             | Government Revenue               | GFS_SOO | USA                     |
|                        | Public Debt (% of GDP)           | GDD     | USA, JPN, GBR, DEU      |
| **Money & Rates**      | Exchange Rate (per USD)          | ER      | GBR, JPN, USA           |
|                        | Key Interest Rates               | MFS_IR  | USA, GBR, JPN, DEU      |
| **Labor**              | Unemployment Rate (%)            | WEO     | USA, DEU, GBR, FRA, JPN |
|                        | Labor Statistics                 | LS      | USA                     |
| **WEO Forecasts**      | Inflation, Avg. Consumer (%)     | WEO     | USA, CHN, DEU, JPN, GBR |
|                        | Govt Gross Debt (% of GDP)       | WEO     | USA, CHN, DEU, JPN, GBR |
|                        | Current Account (% of GDP)       | WEO     | USA, CHN, DEU, JPN, GBR |
| **Environment**        | Renewable Energy                 | RE      | USA                     |
|                        | Climate Change Indicators        | CCI     | USA                     |

Quick Fetch presets can be customized with overrides:

- **Countries** — Comma-separated ISO 3166-1 alpha-3 codes (e.g., `USA, DEU, JPN`)
- **Start Period** — e.g., `2000` or `2010-M01`
- **End Period** — e.g., `2024`
- **Frequency** — `A` (annual), `Q` (quarterly), `M` (monthly)

### Reference Tab

Contains links to:

- Key IMF datasets on the IMF Data Portal
- The [IMF API documentation](https://data.imf.org/en/Resource-Pages/IMF-API)
- World Economic Outlook publications
- SDMX standards documentation

Also includes an "Export All Datasets to Sheet" button that writes the full list of available IMF dataflows (150+) to a sheet for reference.

## Datasets and the IMF API

The IMF publishes data through the [SDMX 3.0 REST API](https://data.imf.org/en/Resource-Pages/IMF-API). The base URL is:

```
https://api.imf.org/external/sdmx/3.0/
```

No API key is required. Data is returned in SDMX JSON format.

### Key Concepts

- **Dataflow** — A dataset identified by agency and ID (e.g., `IMF.STA:CPI` for the Consumer Price Index).
- **Dimensions** — Each dataflow has multiple dimensions (e.g., COUNTRY, INDICATOR, FREQUENCY). Data is queried by specifying values for each dimension.
- **Series Key** — A dot-separated string of dimension values used in the API query (e.g., `USA.CPI._T.IX.M`).
- **Time Period** — SDMX time conventions: `2024` (annual), `2024-Q1` (quarterly), `2024-M06` (monthly).

### Country Codes

The IMF uses ISO 3166-1 alpha-3 country codes: USA, CHN, DEU, GBR, JPN, FRA, etc. Some datasets also include aggregate groups (e.g., G001 for World in commodity prices).

### Common Agencies

| Agency  | Description                                    |
| ------- | ---------------------------------------------- |
| IMF.STA | IMF Statistics Department (CPI, BOP, ER, etc.) |
| IMF.RES | IMF Research Department (WEO)                  |
| IMF.FAD | IMF Fiscal Affairs Department (GDD)            |

## Troubleshooting

### "No data found" Error

The selected dimension combination doesn't match any available data. Try:

- Removing or broadening dimension filters (leave dimensions empty for "all")
- Using the Explorer tab to check which values are actually available for the dataset
- Checking that country codes are correct (ISO alpha-3, e.g., `GBR` not `GB`)

### Timeout Errors

Google Apps Script has a maximum execution time of 6 minutes. Large queries may exceed this:

- **Narrow the time range** — Set a start period (e.g., `2000`) to reduce the amount of data
- **Reduce dimensions** — Select specific indicators instead of wildcards
- **Use fewer countries** — Fetch data for 5–10 countries at a time rather than all

### API Rate Limiting

The IMF API may throttle requests if too many are sent in quick succession. The add-on uses caching (6 hours for metadata, 1 hour for availability) to minimize API calls. If you encounter errors, wait a moment and retry.

## Links

- [IMF Data Portal](https://data.imf.org/en)
- [IMF API Documentation](https://data.imf.org/en/Resource-Pages/IMF-API)
- [SDMX Standards](https://sdmx.org/)
- [World Economic Outlook Publications](https://www.imf.org/en/Publications/WEO)
