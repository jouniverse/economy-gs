# ECB Data

> This is part of the **Economy Data** add-on. Access via **Economy Data → ECB Data** in the menu bar.

A sidebar integration that fetches statistical data from the **European Central Bank (ECB)** SDMX 2.1 REST API and injects it directly into your spreadsheet. No API key required.

The **ECB** publishes over 200 datasets covering exchange rates, interest rates, monetary aggregates, inflation (HICP or harmonised index of consumer prices), balance of payments, financial markets, banking statistics, and more.

## Features

The sidebar provides a three-tab interface:

### Explorer

- **Search** datasets by keyword (e.g., "interest", "inflation", "exchange")
- **Browse All Datasets** — an alphabetical index of all 210+ ECB datasets
- **Select a dataset** to view its filtering dimensions and available codes
- **Filter dimensions** — only codes with actual data are shown (powered by `detail=serieskeysonly`)
- **Fetch Data** — select dimension values and inject the matching time series into the active sheet
- **Codes** — export the codebook (dimension codes and human-readable names) for any dataset to a sheet

### Quick Fetch

One-click access to 16 pre-configured datasets across six categories:

| Category                | Preset                               | Sheet Name            |
| ----------------------- | ------------------------------------ | --------------------- |
| **Exchange Rates**      | EUR/USD Exchange Rate                | `EXR EUR-USD`         |
|                         | Major Currencies vs EUR              | `EXR Major`           |
|                         | Monthly Avg. Rates vs EUR            | `EXR Monthly`         |
| **Interest Rates**      | Key ECB Interest Rates               | `ECB Key Rates`       |
|                         | Euro Short-Term Rate (€STR)          | `€STR`                |
|                         | Euribor Rates                        | `Euribor`             |
| **Inflation**           | HICP Euro Area (YoY %)               | `HICP Euro Area`      |
|                         | HICP Major Economies (YoY %)         | `HICP Countries`      |
|                         | HICP Index (2015=100)                | `HICP Index`          |
| **Money & Banking**     | Monetary Aggregate M3                | `BSI M3`              |
|                         | MFI Lending Rates (Households)       | `MIR Lending`         |
| **External Sector**     | Current Account Balance (BPS)        | `BPS Current Account` |
| **Financial Markets**   | Euro Area Yield Curve                | `Yield Curve`         |
|                         | Systemic Stress Indicator (CISS)     | `CISS`                |
| **Surveys & Forecasts** | Professional Forecasters — Inflation | `SPF Inflation`       |

Each preset card shows a collapsible **Dimensions** summary and a **Codes** button to export the preset's codebook to a sheet.

### Reference

- Overview of ECB data coverage and SDMX format
- Links to key ECB datasets (EXR, ICP, FM, BSI, MIR, BPS, YC, EST, SPF, SEC)
- Reference for area codes (e.g., U2 = Euro area, DE = Germany)
- **Export All Datasets to Sheet** — exports IDs, names, agencies, and DSD references for all available datasets

## Usage Examples

### Quick Fetch a preset

1. Open the sidebar (**Economy Data → ECB Data**)
2. Go to the **Quick Fetch** tab
3. Click any preset (e.g., "EUR/USD Exchange Rate")
4. Data is written to a new sheet named after the preset (e.g., `EXR EUR-USD`)

### Explore and fetch a custom dataset

1. Go to the **Explorer** tab
2. Search for a dataset (e.g., "exchange") or use **Browse All Datasets**
3. Select a dataset from the results
4. Choose values for each filtering dimension (only available codes are shown)
5. Optionally set a start period or limit to the last N observations
6. Click **Fetch Data** — results appear in the active sheet

### Export a codebook

- In **Explorer**: after selecting a dataset, click **Codes** to export all dimension codes and names
- In **Quick Fetch**: click the **Codes** button on any preset card to export that preset's reduced codebook

## Technical Notes

### Performance Optimization

Some ECB Data Structure Definitions (DSDs) are very large (e.g., ECB_FMD2 at 23 MB with 103,000+ codes). Parsing these in Google Apps Script exceeds the 6-minute execution limit.

Two techniques are used to avoid this:

1. **Pre-stored dimension ordering** — Quick Fetch presets include a `dimOrder` array so the add-on can build SDMX data keys without fetching the DSD at all.

2. **`detail=serieskeysonly`** — instead of fetching the full DSD + content constraint (two large XML requests), a single lightweight JSON request returns both dimension metadata and only the codes that actually have data, with human-readable names:

   ```
   data/{flowRef}?detail=serieskeysonly&format=jsondata
   ```

   Responses are typically 5–75 KB and return in under a second.

### Caching

API responses are cached using Google Apps Script's `CacheService` (6-hour TTL, 100 KB per entry limit) to minimize redundant API calls.

## Links

### ECB Resources

- [ECB Data Portal](https://data.ecb.europa.eu/)
- [ECB Data Overview](https://data.ecb.europa.eu/help/data/overview)
- [ECB API Documentation](https://data.ecb.europa.eu/help/api/overview)
- [API Data Endpoint Guide](https://data.ecb.europa.eu/help/api/data)
- [API Metadata Guide](https://data.ecb.europa.eu/help/api/metadata)
- [Data Examples](https://data.ecb.europa.eu/help/data-examples)
- [Content Negotiation](https://data.ecb.europa.eu/help/api/content-negotiation)
- [API Status Codes](https://data.ecb.europa.eu/help/api/status-codes)
- [API Useful Tips](https://data.ecb.europa.eu/help/api/useful-tips)
- [ECB Key Figures](https://data.ecb.europa.eu/key-figures)
- [ECB HICP](https://www.ecb.europa.eu/stats/macroeconomic_and_sectoral/hicp/more/html/index.en.html)

### SDMX Standards

- [SDMX Official Site](https://sdmx.org/)
- [SDMX 2.1 REST API Specification](https://github.com/sdmx-twg/sdmx-rest)
- [SDMX JSON Format](https://github.com/sdmx-twg/sdmx-json)
