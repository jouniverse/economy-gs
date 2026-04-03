# BIS Data

> This is part of the **Economy Data** add-on. Access via **Economy Data → BIS Data** in the menu bar.

A sidebar integration for fetching statistical data from the [Bank for International Settlements (BIS)](https://www.bis.org/) directly into Google Sheets. Connects to the [BIS SDMX RESTful API (v2)](https://stats.bis.org/api-doc/v2/) and provides an interactive interface for browsing, filtering, and importing BIS datasets.

Data is returned in [SDMX 2.1](https://sdmx.org/standards-2/) format (Structure-Specific XML) and parsed into tabular form suitable for spreadsheet analysis.

## Features

- **Explorer** — Browse all BIS datasets, filter by dimensions (with automatic availability filtering), set time ranges, and control observation limits.
- **Quick Fetch** — One-click preset queries for all BIS statistical topics.
- **Reference** — In-app documentation with dataset categories, analytics function reference, and common filter codes.
- **Analytics Functions** — Four custom spreadsheet functions for in-cell data analysis.
- **Caching** — Metadata is cached for 6 hours to minimise API calls and speed up repeated queries.
- **Recent Queries** — The last 5 queries are saved and can be re-executed from the sidebar.

## Quick Fetch Datasets

Pre-configured one-click queries for all BIS statistical topics:

| Button                           | Dataset            | Frequency     | Obs | BIS Data Portal                                          |
| -------------------------------- | ------------------ | ------------- | --- | -------------------------------------------------------- |
| Central Bank Policy Rates        | `WS_CBPOL`         | Monthly       | 12  | [CBPOL](https://data.bis.org/topics/CBPOL)               |
| Effective Exchange Rates         | `WS_EER`           | Monthly       | 12  | [EER](https://data.bis.org/topics/EER)                   |
| Exchange Rates (USD)             | `WS_XRU`           | Daily         | 30  | [XRU](https://data.bis.org/topics/XRU)                   |
| Credit to Non-Financial Sector   | `WS_TC`            | Quarterly     | 8   | [TOTAL_CREDIT](https://data.bis.org/topics/TOTAL_CREDIT) |
| Residential Property Prices      | `WS_SPP`           | Quarterly     | 8   | [RPP](https://data.bis.org/topics/RPP)                   |
| Consumer Prices                  | `WS_LONG_CPI`      | Monthly       | 12  | [CPI](https://data.bis.org/topics/CPI)                   |
| Debt Service Ratios              | `WS_DSR`           | Quarterly     | 8   | [DSR](https://data.bis.org/topics/DSR)                   |
| Global Liquidity Indicators      | `WS_GLI`           | Quarterly     | 8   | [GLI](https://data.bis.org/topics/GLI)                   |
| Locational Banking Statistics    | `WS_LBS_D_PUB`     | Quarterly     | All | [LBS](https://data.bis.org/topics/LBS)                   |
| Consolidated Banking Statistics  | `WS_CBS_PUB`       | Quarterly     | All | [CBS](https://data.bis.org/topics/CBS)                   |
| Debt Securities Statistics       | `WS_NA_SEC_DSS`    | Quarterly     | 8   | [DSS](https://data.bis.org/topics/DSS)                   |
| International Debt Securities    | `WS_DEBT_SEC2_PUB` | Quarterly     | 8   | [IDS](https://data.bis.org/topics/IDS)                   |
| Credit-to-GDP Gaps               | `WS_CREDIT_GAP`    | Quarterly     | 8   | [CREDIT_GAP](https://data.bis.org/topics/CREDIT_GAP)     |
| Exchange-Traded Derivatives      | `WS_XTD_DERIV`     | Mixed (A/M/Q) | 8   | [XTD_DER](https://data.bis.org/topics/XTD_DER)           |
| OTC Derivatives Outstanding      | `WS_OTC_DERIV2`    | Semi-annual   | All | [OTC_DER](https://data.bis.org/topics/OTC_DER)           |
| Triennial Survey                 | `WS_DER_OTC_TOV`   | Triennial     | All | [DER](https://data.bis.org/topics/DER)                   |
| Commercial Property Prices       | `WS_CPP`           | Quarterly     | 8   | [CPP](https://data.bis.org/topics/CPP)                   |
| Central Bank Total Assets        | `WS_CBTA`          | Monthly       | 12  | [CBTA](https://data.bis.org/topics/CBTA)                 |
| Retail Payments & Currency       | `WS_CPMI_CT1`      | Annual        | 5   | [CPMI_CT](https://data.bis.org/topics/CPMI_CT)           |
| Financial Market Infrastructures | `WS_CPMI_SYSTEMS`  | Annual        | 5   | [CPMI_FMI](https://data.bis.org/topics/CPMI_FMI)         |

All available BIS datasets and topics can be explored on the [BIS Data Portal](https://data.bis.org/).

## Analytics Functions

Custom spreadsheet functions available after the add-on is loaded:

| Function                                 | Description                                                                         |
| ---------------------------------------- | ----------------------------------------------------------------------------------- |
| `=BIS_GROWTH_RATE(range, periods)`       | Period-over-period growth rate (%). Default `periods = 1`.                          |
| `=BIS_MOVING_AVG(range, window)`         | Simple moving average over a rolling window.                                        |
| `=BIS_YOY_CHANGE(range, periodsPerYear)` | Year-over-year change (%). Use `12` for monthly, `4` for quarterly, `1` for annual. |
| `=BIS_SUMMARY(range)`                    | Summary statistics: Count, Min, Max, Mean, Median, Std Dev.                         |

## Usage

1. Open a Google Sheet.
2. Go to **Economy Data → BIS Data** to open the sidebar.
3. The sidebar opens with three tabs:
   - **Explorer** — Select a dataset from the categorised list, configure dimension filters and time ranges, then click **Fetch Data**.
   - **Quick Fetch** — Click any preset button to import data into a new sheet.
   - **Reference** — View dataset categories, analytics function documentation, and common filter codes.

### Explorer Tips

- Use dimension dropdowns to narrow your query. Hold <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> to select multiple values.
- Leave a dimension set to "(All)" to fetch all values for that dimension.
- Use **Start/End period** fields with formats like `2020`, `2020-Q1`, or `2020-01`.
- The **Max observations** field limits how many time periods are returned per series.
- Dimension filters automatically show only values that have actual data (via the BIS availability endpoint). The count of available values is shown next to each dimension label.
- _Extra tip:_ Export all datasets into sheet from the **Reference** tab.

### Common Filter Codes

**Measures:**

- `628` — Index, 2010 = 100
- `771` — Year-on-year change in %

**Reference areas:**

- `XM` — Euro area
- `4T` — Advanced Economies
- `5R` — Emerging Market Economies
- `5A` — All Reporting Economies

## Technical Notes

- **API format**: The BIS SDMX REST API v2 returns data in Structure-Specific SDMX-ML (XML). Structure/metadata endpoints return SDMX-JSON 2.0.0.
- **Caching**: Dataset structure metadata is cached for 6 hours using Apps Script's `CacheService`. Large responses are automatically chunked into 90 KB segments.
- **Retry logic**: HTTP 429 (rate limit) and 5xx errors trigger automatic retries with exponential backoff.
- **Large datasets**: Some datasets (e.g. Total Credit) return thousands of rows. Google Sheets has a 10-million cell limit and Apps Script has a 6-minute execution timeout. Use dimension filters or the `lastNObservations` parameter to keep queries manageable.
- **Availability filtering**: The Explorer tab uses the BIS `/availability/` endpoint to automatically filter dimension dropdowns, showing only values that have actual data.

## Links

- [BIS Data Portal](https://data.bis.org/)
- [BIS Data Portal — Topics](https://data.bis.org/topics)
- [BIS SDMX REST API v2 Documentation](https://stats.bis.org/api-doc/v2/)
- [SDMX Standards](https://sdmx.org/standards-2/)
- [BIS Terms and Conditions](https://www.bis.org/terms_conditions.htm)
