# World Bank Data

> This is part of the **Economy Data** add-on. Access via **Economy Data → World Bank Data** in the menu bar.

A sidebar integration that fetches development indicators from the [World Bank Open Data](https://data.worldbank.org) catalogue into Google Sheets. No API key required.

## Features

### Explorer Tab

The main workhorse tab for pulling indicator time-series into your sheet.

- **Indicator search** with relevance-ranked results. Type a keyword (e.g. "GDP", "population", "co2") or pick from five built-in presets: Economic Basics, Demographics, Health, Education, and Trade. Multiple indicators can be selected at once.
- **Country selection** with quick-pick group buttons (All, G7, G20, BRICS, EU, Nordics, OECD, Clear), region and income-level dropdown filters, and a free-text search.
- **Time period** — choose a year range or request the N most recent values (optionally non-empty only).
- **Output format** — four layout options:
  - Long (one row per observation)
  - Wide (years as columns)
  - Wide (countries as columns) -> most useful for charting
  - Wide (indicators as columns)
- **Destination** — write to a new sheet or at the cursor position in the active sheet.
- Optional metadata header row and aggregate-economy filtering.

### Browse Tab

Explore all World Bank indicator topics. Click a topic to see its indicators, view descriptions and source organisations, then send any indicator to the Explorer tab with one click.

### Reference Tab

Inject full reference tables into your spreadsheet and learn more about the data source:

- All Countries (with region, income level, capital, coordinates)
- All Regions
- All Topics
- All Sources
- All Indicators
- Indicator search results for any keyword
- About the World Bank and the Indicators API
- Usage tips and links to API documentation

### Custom Functions

Four spreadsheet formulas are available for power users:

| Function                                     | Description                                    |
| -------------------------------------------- | ---------------------------------------------- |
| `=WB_DATA("SP.POP.TOTL", "USA", 2010, 2020)` | Time-series table for an indicator and country |
| `=WB_LATEST("NY.GDP.MKTP.CD", "FIN")`        | Most recent value for an indicator and country |
| `=WB_INDICATOR("SP.POP.TOTL")`               | Full name of an indicator from its code        |
| `=WB_COUNTRY("USA")`                         | Country name from its ISO3 code                |

Custom functions have a 30-second execution limit and are best suited for small, targeted queries. For bulk data, use the sidebar.

## Usage

### Opening the Sidebar

Click **Economy Data → World Bank Data** from the menu bar. The sidebar opens on the right side of the sheet.

### Fetching Data

1. **Select indicators** — use the search box or pick a preset bundle. Selected indicators appear as chips below the search field. Click the × on a chip to remove it.
2. **Select countries** — click a group button (e.g. G7) to auto-select those countries, or use the region/income filters and free-text search to narrow the list. The badge shows the current count.
3. **Set the time period** — choose "Year Range" and pick start/end years, or choose "Most Recent Values" and set a count.
4. **Choose an output format** and destination (new sheet or active sheet at cursor).
5. Click **Fetch Data**.

The data is written to the spreadsheet as a standard table with headers.

### Browsing Indicators

Switch to the **Browse** tab. Topics are listed as clickable items. Click a topic to expand its indicators, then click an indicator to see its description, source, and code. Press **Use in Fetch** to add it to the Explorer tab's selection.

### Using Custom Functions

Type any of the custom functions directly into a cell:

```
=WB_DATA("SP.POP.TOTL", "FIN", 2000, 2023)
=WB_LATEST("NY.GDP.MKTP.CD", "USA")
=WB_INDICATOR("FP.CPI.TOTL.ZG")
=WB_COUNTRY("GBR")
```

## Technical Highlights

- **Parallel batch fetching** — large queries are split across concurrent API calls for speed.
- **Client-side caching** — metadata is cached for 6 hours via Apps Script CacheService, with automatic chunking for payloads over 90 KB.
- **User settings** are persisted between sessions via PropertiesService.

## Data Source

All data is retrieved from the [World Bank Indicators API v2](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation). No authentication is required. The API is free and open for public use under the [Creative Commons Attribution 4.0](https://www.worldbank.org/en/about/legal/terms-of-use-for-datasets) license.

## Links

- [World Bank Open Data](https://data.worldbank.org)
- [World Bank Indicators API Documentation](https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation)
- [World Bank Data Terms of Use](https://www.worldbank.org/en/about/legal/terms-of-use-for-datasets)
