# WTO Data

> This is part of the **Economy Data** add-on. Access via **Economy Data → WTO Data** in the menu bar.

A sidebar integration that connects to the **WTO Timeseries API**, fetches statistical series, and writes the results into Google Sheets. Explore indicators, run quick presets (tariffs and merchandise trade flows), export reference lists, and use Google Sheets' own charts and pivot tables on the returned data.

**API key required** — register at the [WTO API Portal](https://apiportal.wto.org/) to obtain a subscription key. Set it via **Economy Data → Settings** or in the sidebar's **Reference** tab.

## Usage

### Explorer

- Search and filter **indicators** (name, topic, frequency).
- Select an **indicator**, **reporting economy**, optional **partner** / **product** settings, **time period** (`ps`), and **max rows**.
- Use **Estimate row count** before large pulls.
- **Fetch data** creates a **new sheet** with a timestamped name.

The API accepts **one indicator code per request** (`i`). For several indicators, run separate fetches (respect rate limits).

### Quick Fetch

- Choose a **reporting economy** and a **time period** (selected year, last year, last 5 / 15 years, or all years).
- Under **Tariffs**, fetch the **average MFN applied tariff** (`TP_A_0010`).
- Under **Trade flows**, fetch monthly exports/imports (`ITS_MTV_MX`, `ITS_MTV_MM`) or annual volume changes (`ITS_MTP_AXVG`, `ITS_MTP_AMVG`).

**Monthly** series return **many more rows** than annual series — use a shorter period or a lower cap if requests are slow.

For **Total merchandise exports — monthly** (`ITS_MTV_MX`) and **Total merchandise imports — monthly** (`ITS_MTV_MM`), the add-on adds a **`YearMonth`** column (e.g. `2020-M02`) next to **`year`**, derived from **`year`** + **`periodCode`**.

### Reference

- Short notes on the **WTO**, **MFN / tariffs**, and API parameters.
- **Export reference lists** to a new sheet: indicators, products/sectors, reporting economies, or partner economies.
- **API Key** section — paste your key, save, and test the connection.

### API Key Setup

1. Open the sidebar via **Economy Data → WTO Data**
2. Go to the **Reference** tab
3. Expand **API Key**, paste the key, and click **Save**

Alternatively, use **Economy Data → Settings** to manage all API keys in one place.

The key is stored in Script Properties as `WTO_API_KEY` (not in your sheet cells). Use **Test connection** to confirm the key works.

### Menu

**Economy Data → WTO Data** opens the sidebar. Use the sidebar's Reference tab to refresh the metadata cache if needed.

## Data and Interpretation

- Data come from the [WTO Timeseries API](https://apiportal.wto.org/) (v1). Series can cover long histories (often from 1948 where available); coverage depends on the indicator and economy.
- **MFN applied tariff** (`TP_A_0010`) is an economy-wide average tariff level, not merchandise trade values. Higher values generally mean higher protection.
- **Merchandise exports/imports (monthly)** are value series (e.g. million USD); **volume change** series are percentage changes over the previous year — read column headers and units in the sheet.
- Dimensions such as reporter, partner, product, and period depend on each indicator; invalid combinations return API validation errors.

For interactive exploration, compare with the [WTO Stats portal](https://stats.wto.org/).

## Limitations and Considerations

- **Rate limits:** WTO documents roughly 1 request per second for `/data` and `/data_count`, plus broader hourly caps. The add-on throttles data calls; very large exports may still take time or need narrower periods.
- **Execution time:** Apps Script has a maximum execution time (~6 minutes). Extremely large `max` values or `all` years on monthly data may time out — reduce period or row cap.
- **Row cap:** Fetches are bounded by a maximum records parameter.
- **One indicator per request** for timeseries data.
- **API key** must stay valid; portal policies may change.

## Troubleshooting

| Issue                                      | What to try                                                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **"API key not found" / connection fails** | Save the key under Reference → API Key, or set `WTO_API_KEY` in Script properties. Use **Test connection**.                                       |
| **400 — validation errors**                | Check **period** format (`ps`), **reporter** code, and whether the **indicator** supports partners/products for your query. Try a smaller period. |
| **429 — rate limit**                       | Wait a minute; avoid rapid repeated fetches; remember the ~1/s limit on data endpoints.                                                           |
| **No data rows**                           | Narrow the period; confirm the economy reports that indicator; verify on [stats.wto.org](https://stats.wto.org/).                                 |
| **Empty or unexpected sheet**              | Confirm indicator code; try **Estimate row count** in Explorer first.                                                                             |
| **Monthly fetch slow or truncated**        | Shorten the time range; monthly series are large.                                                                                                 |

## Links

| Resource                     | URL                        |
| ---------------------------- | -------------------------- |
| WTO                          | https://www.wto.org/       |
| WTO Stats (interactive)      | https://stats.wto.org/     |
| WTO API Portal (keys & docs) | https://apiportal.wto.org/ |
