# UN Comtrade Data

> This is part of the **Economy Data** add-on. Access via **Economy Data → UN Comtrade Data** in the menu bar.

A sidebar integration that fetches international trade data from the [UN Comtrade Database](https://comtradeplus.un.org/) and injects it directly into Google Sheets for further analysis.

Built as a lightweight alternative to the UN Comtrade web interface, the sidebar provides a focused query builder with five analysis modes, calculated columns, and automatic sheet creation.

**API key required** — register for a free subscription key at the [UN Comtrade Developer Portal](https://comtradedeveloper.un.org/). Set it via **Economy Data → Settings** or in the sidebar's **Reference** tab.

## Features

- **Five query modes** (Explorer tab) for different analytical perspectives:
  - **Trade Summary** — Total trade value for a country (exports, imports, or both)
  - **Trade Balance** — Side-by-side exports vs imports with calculated balance
  - **Partners Breakdown** — Trade values by partner country with trade share percentages
  - **Products Breakdown** — Trade values by commodity with unit values and trade shares
  - **Bilateral Trade** — Detailed commodity-level trade between two specific countries, with optional mirror data fallback
- **Quick Fetch** — One-click presets for common queries (summary, balance, partners, products) for both goods and services, with country and year selectors
- **Built-in reference** — Query mode documentation, output column reference, classification guides, and useful links
- **Goods and Services** — Supports both merchandise trade (HS, SITC, BEC classifications) and services trade (EBOPS 2002, EBOPS 2010, EBOPS Combined)
- **Calculated columns** — Unit values (USD/kg), trade shares (%), trade balance, and year-on-year growth (when querying multiple years)
- **Mirror data** — For bilateral queries, optionally falls back to the partner country's reported data when direct data is unavailable
- **Searchable country dropdowns** — Type-ahead search for reporter and partner countries
- **Metadata caching** — Country and classification lists are cached to reduce API calls
- **Live updates** - Live updates of latest entries made about countries to the UN Comtrade database.

## Usage

### Setting Up the API Key

1. Open the sidebar via **Economy Data → UN Comtrade Data**
2. Go to the **Reference** tab
3. Expand the **API Key** section, paste your subscription key, and click **Save**

Alternatively, use **Economy Data → Settings** to manage all API keys in one place.

### Explorer Tab — Custom Queries

1. Select a **Query Mode** (Trade Summary, Trade Balance, Partners, Products, or Bilateral)
2. Choose **Data Type**: Goods or Services
3. Set the **Frequency** (Annual or Monthly — Services is annual only)
4. Select a **Classification** (e.g. HS for goods, EBOPS 2010 for services)
5. Search and select a **Reporter** country
6. Set the **Partner** country (mode-dependent — some modes set this automatically)
7. Choose the **Period** (year or year range)
8. Check the desired **Trade Flows** (Import, Export, Re-import, Re-export)
9. For Products and Bilateral modes, choose the **Commodity Level** (Total, 2-digit chapters / major categories, 4-digit headings / sub-categories, or specific codes)
10. Click **Fetch Data**

Results are written to a new sheet with an auto-generated name like `Trade_BRA_Summary_2022`.

### Quick Fetch Tab — One-Click Presets

1. Search and select a **country**
2. Choose a **year**
3. Click any preset button to fetch data immediately:

| Preset                  | Description                                  |
| ----------------------- | -------------------------------------------- |
| **Trade Summary**       | Total goods imports & exports                |
| **Trade Balance**       | Goods exports vs imports with balance        |
| **Top Partners**        | All goods trading partners with trade shares |
| **Top Products**        | 2-digit HS chapters with trade shares        |
| **Services Summary**    | Total services imports & exports             |
| **Services Balance**    | Services exports vs imports with balance     |
| **Services Partners**   | Top services trading partners                |
| **Services Categories** | Major EBOPS service categories               |

Override options (partner, flow filter) are available in the collapsible **Quick Fetch Options** panel.

### Reference Tab

The Reference tab contains built-in documentation covering query modes, output columns, classification systems, and usage tips. It also provides links to the UN Comtrade portal, API documentation, and related resources. The API key can be managed from the collapsible section at the bottom of this tab.

## Output Examples

### Trade Summary

| Period | Reporter | Reporter ISO | Flow   | Trade Value (USD) | Net Weight (kg) | Unit Value (USD/kg) |
| ------ | -------- | ------------ | ------ | ----------------- | --------------- | ------------------- |
| 2022   | Brazil   | BRA          | Export | 334,463,079,195   | 0               |                     |
| 2022   | Brazil   | BRA          | Import | 292,343,725,728   | 0               |                     |

### Trade Balance

| Period | Reporter | Partner | Exports (USD) | Imports (USD) | Trade Balance (USD) |
| ------ | -------- | ------- | ------------- | ------------- | ------------------- |
| 2025   | Brazil   | Finland | 505,058,138   | 1,078,676,964 | −573,618,826        |

### Partners Breakdown

| Period | Reporter       | Reporter ISO | Partner | Partner ISO | Flow   | Trade Value (USD) | Trade Share (%) |
| ------ | -------------- | ------------ | ------- | ----------- | ------ | ----------------- | --------------- |
| 2022   | United Kingdom | GBR          | China   | CHN         | Import | 110,328,925,110   | 13.43           |

### Products Breakdown

| Period | Reporter | Reporter ISO | Commodity Code | Commodity                    | Flow   | Trade Value (USD) | Trade Share (%) |
| ------ | -------- | ------------ | -------------- | ---------------------------- | ------ | ----------------- | --------------- |
| 2022   | Brazil   | BRA          | 27             | Mineral fuels, mineral oils… | Export | 56,851,352,868    | 17.00           |

### Bilateral Trade

| Period | Reporter | Reporter ISO | Partner | Flow   | Commodity Code | Commodity         | Trade Value (USD) | Data Source | YoY Growth (%) |
| ------ | -------- | ------------ | ------- | ------ | -------------- | ----------------- | ----------------- | ----------- | -------------- |
| 2022   | Finland  | FIN          | Sweden  | Import | 2716           | Electrical energy | 2,731,679,272     | reported    | 102.74         |

## API Reference

This integration uses the [UN Comtrade API v1](https://comtradedeveloper.un.org/). Key endpoints:

| Endpoint                                                   | Purpose                                           |
| ---------------------------------------------------------- | ------------------------------------------------- |
| `data/v1/get/{typeCode}/{freqCode}/{clCode}`               | Standard data queries (all modes)                 |
| `tools/v1/getBilateralData/{typeCode}/{freqCode}/{clCode}` | Bilateral trade data (primary bilateral endpoint) |
| `files/v1/app/reference/{clCode}.json`                     | Classification and reference data                 |

For full parameter documentation, see [List of References and Parameter Codes](https://uncomtrade.org/docs/list-of-references-parameter-codes/).

### Free Tier Limits

The free API tier with subscription key allows **100,000 records/call** and **500 calls/day**. The add-on mitigates this by:

- Using aggregate commodity codes (TOTAL, AG2, AG4) to reduce record counts
- Collapsing secondary dimensions (partner2, mode of transport, customs) for goods
- Caching metadata lists to avoid redundant reference calls

## Limitations and Known Issues

### Services Data Coverage

Services trade data (EBOPS classifications) has significantly less coverage than goods data. Many countries do not report services trade to UN Comtrade, and coverage varies by year, classification version, and commodity level:

- **EBOPS 2010** and **EBOPS 2002** return data for many countries, but not all
- **EBOPS (Combined)** often has less data, though there are exceptions
- **Sub-categories** (AG4 level) may return no data for some classification/country combinations
- You may need to try different classification versions and commodity levels to find available data

### Other Limitations

- **Record limits**: Free API tier caps at 100,000 records per call. Very detailed queries (6-digit HS codes × many partners) may be truncated.
- **Rate limiting**: The API enforces rate limits per subscription key. If you hit the limit, wait 60 seconds before retrying.
- **Monthly data**: Monthly frequency is available for goods only; services data is annual only.
- **Net weight**: Not all reporters provide net weight data. Unit values will be blank when weight is zero or missing.
- **Mirror data**: Mirror data swaps the reporter and partner perspectives. It's a useful fallback but may not exactly match directly reported data.
- **Apps Script timeouts**: Google Apps Script has a 6-minute execution limit. Very large queries may time out before completing.

## Links

- [UN Comtrade Database](https://comtradeplus.un.org/) — Official web interface
- [UN Comtrade Developer Portal](https://comtradedeveloper.un.org/) — API documentation and key registration
- [UNCTAD Trade Matrix](https://unctadstat.unctad.org/datacentre/dataviewer/US.TradeMatrix) — Trade matrix visualisation tool
- [List of References and Parameter Codes](https://uncomtrade.org/docs/list-of-references-parameter-codes/) — Complete API parameter reference
