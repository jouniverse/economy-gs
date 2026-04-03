/**
 * WORLD_BANK_CustomFunctions.gs — Spreadsheet formulas for power users.
 *
 * These functions are typed directly into cells like =WB_DATA(...)
 * and return 2-D arrays or scalar values. JSDoc @customfunction
 * annotations make them appear in Sheets autocomplete.
 *
 * Note: Custom functions have a 30-second execution limit and cannot
 * write to other cells. They are best for small, targeted queries.
 */

/**
 * Fetches time-series data from the World Bank API.
 *
 * @param {"SP.POP.TOTL"} indicator  The World Bank indicator code.
 * @param {"USA"} country  The ISO3 country code (or "all" for all countries).
 * @param {2015} startYear  (Optional) The starting year.
 * @param {2020} endYear  (Optional) The ending year.
 * @return A table with headers: Country Code, Country, Year, Value.
 * @customfunction
 */
function WB_DATA(indicator, country, startYear, endYear) {
  if (!indicator) return "#ERROR: Indicator code is required.";

  try {
    indicator = String(indicator).trim();
    country = country ? String(country).trim() : "all";

    // Validate indicator code (alphanumeric, dots, underscores)
    if (!/^[A-Za-z0-9._]+$/.test(indicator)) {
      return "#ERROR: Invalid indicator code.";
    }

    var params = {};
    params.format = "json";
    params.per_page = 1000;

    if (startYear && endYear) {
      params.date = parseInt(startYear, 10) + ":" + parseInt(endYear, 10);
    } else if (startYear) {
      params.date = String(parseInt(startYear, 10));
    }

    var url =
      WB_API_BASE +
      "/country/" +
      encodeURIComponent(country) +
      "/indicator/" +
      encodeURIComponent(indicator) +
      "?format=json&per_page=1000";

    if (params.date) url += "&date=" + params.date;

    var result = wbFetch(url);

    if (result.error) return "#ERROR: " + result.error;
    if (!result.data || result.data.length === 0)
      return "#ERROR: No data found.";

    var rows = [["Country Code", "Country", "Year", "Value"]];
    result.data.forEach(function (r) {
      rows.push([
        r.country.id,
        r.country.value,
        r.date,
        r.value !== null && r.value !== undefined ? r.value : "",
      ]);
    });

    return rows;
  } catch (e) {
    return "#ERROR: " + (e.message || String(e));
  }
}

/**
 * Returns the most recent value for an indicator and country.
 *
 * @param {"NY.GDP.MKTP.CD"} indicator  The World Bank indicator code.
 * @param {"FIN"} country  The ISO3 country code.
 * @return The most recent numeric value, or an error message.
 * @customfunction
 */
function WB_LATEST(indicator, country) {
  if (!indicator) return "#ERROR: Indicator code is required.";
  if (!country) return "#ERROR: Country code is required.";

  try {
    indicator = String(indicator).trim();
    country = String(country).trim();

    var url =
      WB_API_BASE +
      "/country/" +
      encodeURIComponent(country) +
      "/indicator/" +
      encodeURIComponent(indicator) +
      "?format=json&per_page=1&mrnev=1";

    var result = wbFetch(url);

    if (result.error) return "#ERROR: " + result.error;
    if (!result.data || result.data.length === 0)
      return "#ERROR: No data found.";

    var val = result.data[0].value;
    return val !== null && val !== undefined ? val : "#ERROR: Value is null.";
  } catch (e) {
    return "#ERROR: " + (e.message || String(e));
  }
}

/**
 * Returns the name of a World Bank indicator given its code.
 *
 * @param {"SP.POP.TOTL"} code  The indicator code.
 * @return The indicator's full name.
 * @customfunction
 */
function WB_INDICATOR(code) {
  if (!code) return "#ERROR: Indicator code is required.";

  try {
    code = String(code).trim();
    var url =
      WB_API_BASE + "/indicator/" + encodeURIComponent(code) + "?format=json";
    var result = wbFetch(url);

    if (result.error) return "#ERROR: " + result.error;
    if (!result.data || result.data.length === 0)
      return "#ERROR: Indicator not found.";

    return result.data[0].name || "";
  } catch (e) {
    return "#ERROR: " + (e.message || String(e));
  }
}

/**
 * Returns the name of a country given its ISO3 code.
 *
 * @param {"USA"} code  The 3-letter ISO country code.
 * @return The country name.
 * @customfunction
 */
function WB_COUNTRY(code) {
  if (!code) return "#ERROR: Country code is required.";

  try {
    code = String(code).trim();
    var url =
      WB_API_BASE + "/country/" + encodeURIComponent(code) + "?format=json";
    var result = wbFetch(url);

    if (result.error) return "#ERROR: " + result.error;
    if (!result.data || result.data.length === 0)
      return "#ERROR: Country not found.";

    return result.data[0].name || "";
  } catch (e) {
    return "#ERROR: " + (e.message || String(e));
  }
}
