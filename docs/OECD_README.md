# OECD Data

> This is part of the **Economy Data** add-on. Access via **Economy Data → OECD Data** in the menu bar.

A sidebar integration for fetching OECD statistical data directly into Google Sheets. Search over 1,400 OECD datasets, select dimensions and time periods, and pull data into sheets — no API key required.

## Features

- **Explorer** — Search and browse all OECD datasets, select dimension filters, and fetch data into sheets.
- **Quick Fetch** — 18 pre-configured indicators (GDP, inflation, unemployment, etc.) with one-click data retrieval.
- **Codebook export** — Generate a reference sheet listing all dimension codes and their human-readable names for any dataset.
- **Reference** — Links to key OECD datasets and documentation.

## Usage

### Explorer Tab

The Explorer lets you search and fetch data from any of the 1,400+ OECD datasets.

1. **Search** — Type keywords (e.g. "gdp", "unemployment", "trade") in the search box and press Enter or click Search.
2. **Select a dataset** — Click on a result card to view its dimensions (filters).
3. **Filter dimensions** — Each dimension (country, frequency, measure, etc.) has a multi-select dropdown. Hold Ctrl/Cmd to select multiple values. Leave empty to fetch all. For dimensions with many options (>10), a search/filter input appears above the dropdown.
4. **Time options** — Expand "Time Options" to set a start period, end period, or limit to the last N observations.
5. **Fetch Data** — Click to pull the data into a new sheet named after the dataset ID.
6. **Export Codes to Sheet** — Click to generate a codebook sheet listing every dimension code and its full name.

### Quick Fetch Tab

Quick Fetch provides 18 pre-configured indicators that can be fetched with a single click.

| Category                  | Preset                             | Default Countries       | Frequency |
| ------------------------- | ---------------------------------- | ----------------------- | --------- |
| **GDP & Growth**          | Real GDP Growth (%)                | USA, DEU, JPN, GBR, FRA | Annual    |
|                           | Quarterly GDP                      | USA, DEU, JPN, GBR      | Quarterly |
|                           | GDP Growth — Economic Outlook      | USA, CHN, DEU, JPN, GBR | Annual    |
| **Prices & Inflation**    | CPI, All Items (% change)          | USA, DEU, JPN, GBR      | Monthly   |
|                           | G20 Consumer Price Indices         | USA, DEU, JPN, GBR, CHN | Monthly   |
| **Labour Market**         | Unemployment Rate (Monthly)        | USA, DEU, GBR, FRA, JPN | Monthly   |
|                           | Employment Rate (Quarterly)        | USA, DEU, GBR, FRA, JPN | Quarterly |
| **Trade & BOP**           | Current Account Balance            | USA, DEU, JPN, GBR      | Annual    |
| **Short-term Indicators** | Composite Leading Indicators       | USA, DEU, JPN, GBR, CHN | Monthly   |
|                           | Key Short-term Economic Indicators | USA, DEU, JPN           | Monthly   |
| **Finance**               | Financial Market Indicators        | USA, DEU, JPN, GBR      | Monthly   |
| **Productivity**          | Productivity Statistics            | USA, DEU, JPN, GBR, FRA | Annual    |
| **Economic Outlook**      | Inflation — Economic Outlook       | USA, DEU, JPN, GBR, FRA | Annual    |
|                           | Unemployment — Economic Outlook    | USA, DEU, JPN, GBR, FRA | Annual    |
|                           | Current Account (% GDP) — EO       | USA, DEU, JPN, GBR, CHN | Annual    |
|                           | Govt Gross Debt (% GDP) — EO       | USA, DEU, JPN, GBR, FRA | Annual    |
| **Society**               | Income Distribution (Gini)         | USA, DEU, GBR, FRA, SWE | Annual    |
|                           | House Price Indicators             | USA, DEU, GBR, FRA, JPN | Quarterly |

**Override Options** — Expand the Override Options panel at the bottom of the Quick Fetch tab to change the default countries (comma-separated ISO3 codes), start/end period, or limit to the last N observations.

**Codes button** — Each preset has a "Codes" button that generates a codebook sheet explaining every dimension code for that dataset.

**Dimensions toggle** — Click "Dimensions" below any preset to see a summary of the pre-configured filters with human-readable labels.

### Reference Tab

The Reference tab provides:

- A brief description of OECD data coverage and the SDMX REST API.
- Direct links to 10 key OECD datasets in the OECD Data Explorer.
- Country code information (ISO 3166-1 alpha-3).
- An explanation of the SDMX time period format.
- An **Export All Datasets to Sheet** button that writes a complete list of all 1,400+ dataflows to a sheet.

## Troubleshooting

| Issue                               | Solution                                                                                                                                 |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **"No data found"** error           | Try broader dimension selections (leave filters empty for "all"). Some dimension combinations have no data.                              |
| **Rate limit (HTTP 429)**           | The OECD API allows 60 requests per hour. Wait a few minutes and retry.                                                                  |
| **Timeout / slow fetch**            | Large datasets with many countries and long time ranges take longer. Narrow your selection or use `lastNObservations`.                   |
| **Truncated option text**           | Hover over any dimension option to see its full name in a tooltip. Alternatively, click "Export Codes to Sheet" for a complete codebook. |
| **Unknown dimension codes in data** | Use the "Codes" button (Quick Fetch) or "Export Codes to Sheet" (Explorer) to generate a reference sheet.                                |
| **"No data structure found"**       | The dataset may have been removed or renamed by the OECD. Try searching for it by keyword instead.                                       |
| **Sheet not created**               | Make sure you have edit permissions on the spreadsheet.                                                                                  |
| **Sidebar not loading**             | Close and reopen the sidebar. If the issue persists, reload the spreadsheet.                                                             |

## API Details

- **Base URL**: `https://sdmx.oecd.org/public/rest`
- **Format**: SDMX JSON (application/vnd.sdmx.data+json)
- **Authentication**: None required
- **Rate limit**: 60 requests per hour
- **Country codes**: ISO 3166-1 alpha-3 (e.g. USA, DEU, GBR, JPN)
- **Time periods**: SDMX conventions — `2024` (annual), `2024-Q1` (quarterly), `2024-06` (monthly)

## Links

- [OECD Data Explorer](https://data-explorer.oecd.org/)
- [Data Explorer FAQ](https://data-explorer.oecd.org/faq/)
- [OECD API Developer Guide](https://gitlab.algobank.oecd.org/public-documentation/dotstat-migration/-/blob/main/DeveloperGuide.md)
- [SDMX Standards & Documentation](https://sdmx.org/)
