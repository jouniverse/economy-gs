var FRED_BASE_URL = "https://api.stlouisfed.org/fred";

function fred_getApiKey_() {
  var key = PropertiesService.getScriptProperties().getProperty("FRED_API_KEY");
  if (!key) {
    throw new Error(
      "FRED API key not found. Save your key in the Reference tab or set Script Property FRED_API_KEY."
    );
  }
  return key;
}

// ---------------------------------------------------------------------------
// Low-level API helper
// ---------------------------------------------------------------------------

function fredFetch_(endpoint, params) {
  params = params || {};
  params.api_key = fred_getApiKey_();
  params.file_type = "json";

  var queryParts = [];
  for (var key in params) {
    if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
      queryParts.push(
        encodeURIComponent(key) + "=" + encodeURIComponent(params[key])
      );
    }
  }

  var url = FRED_BASE_URL + "/" + endpoint + "?" + queryParts.join("&");

  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var code = response.getResponseCode();

  if (code !== 200) {
    var body = response.getContentText();
    if (code === 429) {
      throw new Error("FRED API rate limit exceeded. Wait a moment and retry.");
    }
    throw new Error("FRED API error (" + code + "): " + body);
  }

  return JSON.parse(response.getContentText());
}

// ---------------------------------------------------------------------------
// Series observations
// ---------------------------------------------------------------------------

/**
 * Fetch observations for a FRED series.
 *
 * @param {string} seriesId  FRED series ID (e.g. "CPIAUCSL").
 * @param {Object} [options]
 * @param {string} [options.units]              "lin"|"chg"|"ch1"|"pch"|"pc1"|"pca"|"cch"|"cca"|"log"
 * @param {string} [options.frequency]          "d"|"w"|"bw"|"m"|"q"|"sa"|"a"
 * @param {string} [options.aggregation_method] "avg"|"sum"|"eop"
 * @param {string} [options.observation_start]  YYYY-MM-DD
 * @param {string} [options.observation_end]    YYYY-MM-DD
 * @param {string} [options.sort_order]         "asc"|"desc"
 * @returns {Object} Parsed JSON from fred/series/observations.
 */
function fred_getSeriesObservations(seriesId, options) {
  options = options || {};
  var params = { series_id: seriesId };

  var allowedKeys = [
    "units",
    "frequency",
    "aggregation_method",
    "observation_start",
    "observation_end",
    "sort_order",
  ];
  for (var i = 0; i < allowedKeys.length; i++) {
    var k = allowedKeys[i];
    if (options[k]) {
      params[k] = options[k];
    }
  }

  return fredFetch_("series/observations", params);
}

// ---------------------------------------------------------------------------
// Series search
// ---------------------------------------------------------------------------

/**
 * Search for FRED series by keyword.
 *
 * @param {string} searchText  Keywords to search for.
 * @param {Object} [options]
 * @param {string} [options.search_type] "full_text"|"series_id"
 * @param {number} [options.limit]       Max results (default 20).
 * @param {string} [options.order_by]    "search_rank"|"series_id"|"title"|"popularity" etc.
 * @returns {Array} Array of series objects.
 */
function fred_searchSeries(searchText, options) {
  options = options || {};
  var params = {
    search_text: searchText,
    search_type: options.search_type || "full_text",
    limit: options.limit || 20,
  };
  if (options.order_by) {
    params.order_by = options.order_by;
  }

  var data = fredFetch_("series/search", params);
  return data.seriess || [];
}

// ---------------------------------------------------------------------------
// Write observations to sheet
// ---------------------------------------------------------------------------

/**
 * Write observation data into the active spreadsheet.
 * Creates a new sheet named after the series or overwrites if it exists.
 *
 * @param {Array}  observations  Array of {date, value} objects.
 * @param {string} seriesId      FRED series ID used as sheet name.
 * @param {string} title         Human-readable series title for the header.
 */
function fred_writeObservationsToSheet_(observations, seriesId, title) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(seriesId);

  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet(seriesId);
  }

  var header = [["Date", title || seriesId]];
  sheet.getRange(1, 1, 1, 2).setValues(header);
  sheet
    .getRange(1, 1, 1, 2)
    .setFontWeight("bold")
    .setBackground("#4285f4")
    .setFontColor("#ffffff");

  if (!observations || observations.length === 0) {
    return;
  }

  var rows = [];
  for (var i = 0; i < observations.length; i++) {
    var obs = observations[i];
    var val = obs.value === "." ? "" : parseFloat(obs.value);
    rows.push([new Date(obs.date), val]);
  }

  sheet.getRange(2, 1, rows.length, 2).setValues(rows);
  sheet.getRange(2, 1, rows.length, 1).setNumberFormat("yyyy-mm-dd");
  sheet.getRange(2, 2, rows.length, 1).setNumberFormat("#,##0.0###");
  sheet.autoResizeColumns(1, 2);
  sheet.setFrozenRows(1);

  ss.setActiveSheet(sheet);
}

// ---------------------------------------------------------------------------
// Generic fetch-and-write (called from the sidebar)
// ---------------------------------------------------------------------------

/**
 * Fetch a FRED series and write it to the spreadsheet.
 * Intended to be called via google.script.run from the sidebar.
 *
 * @param {string} seriesId  FRED series ID.
 * @param {string} title     Series title for the header.
 * @param {Object} [options] Options forwarded to fred_getSeriesObservations.
 * @returns {string} Status message.
 */
function fred_fetchAndWriteSeries(seriesId, title, options) {
  var data = fred_getSeriesObservations(seriesId, options);
  fred_writeObservationsToSheet_(data.observations, seriesId, title);
  return data.observations.length + " observations written for " + seriesId;
}

// ---------------------------------------------------------------------------
// Indicator functions
// ---------------------------------------------------------------------------

function FRED_CPI(options) {
  options = options || {};
  var data = fred_getSeriesObservations("CPIAUCSL", options);
  fred_writeObservationsToSheet_(data.observations, "CPIAUCSL", "Consumer Price Index (CPI)");
  return data.observations.length + " observations written";
}

function FRED_PCE(options) {
  options = options || {};
  var data = fred_getSeriesObservations("PCE", options);
  fred_writeObservationsToSheet_(data.observations, "PCE", "Personal Consumption Expenditures (PCE)");
  return data.observations.length + " observations written";
}

function FRED_UNRATE(options) {
  options = options || {};
  var data = fred_getSeriesObservations("UNRATE", options);
  fred_writeObservationsToSheet_(data.observations, "UNRATE", "Unemployment Rate");
  return data.observations.length + " observations written";
}

function FRED_PAYEMS(options) {
  options = options || {};
  var data = fred_getSeriesObservations("PAYEMS", options);
  fred_writeObservationsToSheet_(data.observations, "PAYEMS", "Nonfarm Payrolls");
  return data.observations.length + " observations written";
}

function FRED_GDP(options) {
  options = options || {};
  var data = fred_getSeriesObservations("GDPC1", options);
  fred_writeObservationsToSheet_(data.observations, "GDPC1", "Real GDP");
  return data.observations.length + " observations written";
}

function FRED_VIX(options) {
  options = options || {};
  var data = fred_getSeriesObservations("VIXCLS", options);
  fred_writeObservationsToSheet_(data.observations, "VIXCLS", "VIX Index");
  return data.observations.length + " observations written";
}

function FRED_FEDFUNDS(options) {
  options = options || {};
  var data = fred_getSeriesObservations("FEDFUNDS", options);
  fred_writeObservationsToSheet_(data.observations, "FEDFUNDS", "Fed Funds Effective Rate");
  return data.observations.length + " observations written";
}

function FRED_DGS10(options) {
  options = options || {};
  var data = fred_getSeriesObservations("DGS10", options);
  fred_writeObservationsToSheet_(data.observations, "DGS10", "10-Year Treasury Yield");
  return data.observations.length + " observations written";
}

function FRED_INDPRO(options) {
  options = options || {};
  var data = fred_getSeriesObservations("INDPRO", options);
  fred_writeObservationsToSheet_(data.observations, "INDPRO", "Industrial Production Index");
  return data.observations.length + " observations written";
}

function FRED_TB3MS(options) {
  options = options || {};
  var data = fred_getSeriesObservations("TB3MS", options);
  fred_writeObservationsToSheet_(data.observations, "TB3MS", "3-Month Treasury Bill Rate");
  return data.observations.length + " observations written";
}

function FRED_M2SL(options) {
  options = options || {};
  var data = fred_getSeriesObservations("M2SL", options);
  fred_writeObservationsToSheet_(data.observations, "M2SL", "M2 Money Stock");
  return data.observations.length + " observations written";
}

function FRED_DGS30(options) {
  options = options || {};
  var data = fred_getSeriesObservations("DGS30", options);
  fred_writeObservationsToSheet_(data.observations, "DGS30", "30-Year Treasury Yield");
  return data.observations.length + " observations written";
}

function FRED_MORTGAGE30US(options) {
  options = options || {};
  var data = fred_getSeriesObservations("MORTGAGE30US", options);
  fred_writeObservationsToSheet_(data.observations, "MORTGAGE30US", "30-Year Fixed Mortgage Rate");
  return data.observations.length + " observations written";
}

function FRED_T10Y2Y(options) {
  options = options || {};
  var data = fred_getSeriesObservations("T10Y2Y", options);
  fred_writeObservationsToSheet_(data.observations, "T10Y2Y", "10Y-2Y Treasury Spread");
  return data.observations.length + " observations written";
}

function FRED_UMCSENT(options) {
  options = options || {};
  var data = fred_getSeriesObservations("UMCSENT", options);
  fred_writeObservationsToSheet_(data.observations, "UMCSENT", "Consumer Sentiment (UMich)");
  return data.observations.length + " observations written";
}

function FRED_DJIA(options) {
  options = options || {};
  var data = fred_getSeriesObservations("DJIA", options);
  fred_writeObservationsToSheet_(data.observations, "DJIA", "Dow Jones Industrial Average");
  return data.observations.length + " observations written";
}

function FRED_SP500(options) {
  options = options || {};
  var data = fred_getSeriesObservations("SP500", options);
  fred_writeObservationsToSheet_(data.observations, "SP500", "S&P 500");
  return data.observations.length + " observations written";
}

function FRED_NASDAQCOM(options) {
  options = options || {};
  var data = fred_getSeriesObservations("NASDAQCOM", options);
  fred_writeObservationsToSheet_(data.observations, "NASDAQCOM", "NASDAQ Composite Index");
  return data.observations.length + " observations written";
}

function FRED_EXPINF1YR(options) {
  options = options || {};
  var data = fred_getSeriesObservations("EXPINF1YR", options);
  fred_writeObservationsToSheet_(data.observations, "EXPINF1YR", "Expected Inflation 1 Year");
  return data.observations.length + " observations written";
}

function FRED_EXPINF30YR(options) {
  options = options || {};
  var data = fred_getSeriesObservations("EXPINF30YR", options);
  fred_writeObservationsToSheet_(data.observations, "EXPINF30YR", "Expected Inflation 30 Year");
  return data.observations.length + " observations written";
}

function FRED_DHHNGSP(options) {
  options = options || {};
  var data = fred_getSeriesObservations("DHHNGSP", options);
  fred_writeObservationsToSheet_(data.observations, "DHHNGSP", "Henry Hub Natural Gas Spot Price");
  return data.observations.length + " observations written";
}

function FRED_WTISPLC(options) {
  options = options || {};
  var data = fred_getSeriesObservations("WTISPLC", options);
  fred_writeObservationsToSheet_(data.observations, "WTISPLC", "WTI Crude Oil Spot Price");
  return data.observations.length + " observations written";
}

// ---------------------------------------------------------------------------
// Category browsing (lazy API; pagination for large categories)
// ---------------------------------------------------------------------------

var FRED_CATEGORY_SERIES_PAGE_SIZE_ = 1000;

/**
 * Subcategories of a FRED category (use 0 for root / depth-1 topics).
 * @param {number} categoryId
 * @returns {{ categories: Array, category_id: number }}
 */
function fred_getCategoryChildren(categoryId) {
  var id =
    categoryId === undefined || categoryId === null ? 0 : Number(categoryId);
  var data = fredFetch_("category/children", { category_id: id });
  return {
    categories: data.categories || [],
    category_id: id,
  };
}

/**
 * Total series count for a category (one API call; offset 0).
 * @param {number} categoryId
 * @returns {{ count: number }}
 */
function fred_getCategorySeriesMeta(categoryId) {
  var id = Number(categoryId);
  var data = fredFetch_("category/series", {
    category_id: id,
    limit: FRED_CATEGORY_SERIES_PAGE_SIZE_,
    offset: 0,
  });
  return { count: data.count != null ? data.count : 0 };
}

/**
 * Fetch all series metadata for a category (multiple requests if count > 1000)
 * and write to a new sheet. Does not fetch observation data.
 * @param {number} categoryId
 * @param {string} categoryName  Label for the sheet title row.
 * @returns {{ ok: boolean, count: number, message: string }}
 */
function fred_exportCategorySeriesToSheet(categoryId, categoryName) {
  var id = Number(categoryId);
  var name = categoryName || "Category " + id;

  var all = [];
  var offset = 0;
  var total = null;

  while (true) {
    var data = fredFetch_("category/series", {
      category_id: id,
      limit: FRED_CATEGORY_SERIES_PAGE_SIZE_,
      offset: offset,
    });
    if (total === null) {
      total = data.count != null ? data.count : 0;
    }
    var batch = data.seriess || [];
    if (!Array.isArray(batch)) {
      batch = batch && typeof batch === "object" ? [batch] : [];
    }
    if (batch.length === 0) {
      break;
    }
    for (var i = 0; i < batch.length; i++) {
      all.push(batch[i]);
    }
    offset += batch.length;
    if (all.length >= total) {
      break;
    }
    if (batch.length < FRED_CATEGORY_SERIES_PAGE_SIZE_) {
      break;
    }
  }

  if (all.length === 0) {
    throw new Error(
      "No series in this category. Try a parent category or another branch.",
    );
  }

  fred_writeCategorySeriesListToSheet_(all, id, name);

  var msg =
    "Success: exported " +
    all.length +
    " series to sheet" +
    (total > all.length ? " (reported total " + total + ")" : "") +
    ".";

  return { ok: true, count: all.length, total: total, message: msg };
}

var FRED_CATEGORY_SERIES_COLS_ = 10;

/**
 * One row for category/series metadata (fixed width for setValues).
 * @param {Object} s
 * @returns {Array}
 */
function fred_seriesMetadataRow_(s) {
  if (!s || typeof s !== "object") {
    return ["", "", "", "", "", "", "", "", "", ""];
  }
  return [
    s.id != null ? String(s.id) : "",
    s.title != null ? String(s.title) : "",
    s.observation_start != null ? String(s.observation_start) : "",
    s.observation_end != null ? String(s.observation_end) : "",
    s.frequency != null ? String(s.frequency) : "",
    s.frequency_short != null ? String(s.frequency_short) : "",
    s.units != null ? String(s.units) : "",
    s.units_short != null ? String(s.units_short) : "",
    s.seasonal_adjustment != null ? String(s.seasonal_adjustment) : "",
    s.last_updated != null ? String(s.last_updated) : "",
  ];
}

/**
 * Build a strict rectangular 2D array for setValues (avoids ragged rows).
 * @param {Array} matrix
 * @param {number} numCols
 * @returns {Array}
 */
function fred_normalizeRows2D_(matrix, numCols) {
  var out = [];
  for (var r = 0; r < matrix.length; r++) {
    var row = matrix[r] || [];
    var line = [];
    for (var c = 0; c < numCols; c++) {
      line[c] = row[c] != null ? String(row[c]) : "";
    }
    out.push(line);
  }
  return out;
}

/**
 * Reset a sheet so setValues never hits leftover merges (merge + clear is unreliable).
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} minCols
 */
function fred_wipeSheetForCategoryExport_(sheet, minCols) {
  var maxR = sheet.getMaxRows();
  var maxC = Math.max(sheet.getMaxColumns(), minCols, 26);
  try {
    sheet.getRange(1, 1, maxR, maxC).breakApart();
  } catch (e) {
    // ignore
  }
  sheet.clear();
}

/**
 * @param {Array} seriesList  Objects from category/series seriess array.
 */
function fred_writeCategorySeriesListToSheet_(seriesList, categoryId, categoryName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var base = "FRED_Cat_" + String(categoryId);
  if (base.length > 95) {
    base = base.substring(0, 95);
  }
  var numCols = FRED_CATEGORY_SERIES_COLS_;

  var rawList = Array.isArray(seriesList) ? seriesList : [];
  var rows = [];
  for (var i = 0; i < rawList.length; i++) {
    rows.push(fred_seriesMetadataRow_(rawList[i]));
  }
  rows = fred_normalizeRows2D_(rows, numCols);

  var headerMatrix = fred_normalizeRows2D_(
    [
      [
        "id",
        "title",
        "observation_start",
        "observation_end",
        "frequency",
        "frequency_short",
        "units",
        "units_short",
        "seasonal_adjustment",
        "last_updated",
      ],
    ],
    numCols,
  );

  var sheet = ss.getSheetByName(base);
  if (sheet) {
    var allSheets = ss.getSheets();
    if (allSheets.length > 1) {
      ss.deleteSheet(sheet);
      sheet = ss.insertSheet(base);
    } else {
      fred_wipeSheetForCategoryExport_(sheet, numCols);
    }
  } else {
    sheet = ss.insertSheet(base);
  }

  var title =
    "FRED category series: " + (categoryName || categoryId) + " (metadata only)";
  sheet.getRange(1, 1).setValue(title);
  sheet.getRange(1, 1).setFontWeight("bold").setWrap(true);

  sheet.getRange(2, 1, 1, numCols).setValues(headerMatrix);
  sheet
    .getRange(2, 1, 1, numCols)
    .setFontWeight("bold")
    .setBackground("#4285f4")
    .setFontColor("#ffffff");

  if (rows.length > 0) {
    sheet.getRange(3, 1, rows.length, numCols).setValues(rows);
  }

  sheet.setFrozenRows(2);
  sheet.autoResizeColumns(1, numCols);
  ss.setActiveSheet(sheet);
}

// ---------------------------------------------------------------------------
// Fetch all FRED sources to sheet
// ---------------------------------------------------------------------------

function fred_fetchFredSources() {
  var data = fredFetch_("sources", {});
  var sources = data.sources || [];

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "FRED Sources";
  var sheet = ss.getSheetByName(sheetName);

  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet(sheetName);
  }

  var header = [["ID", "Name", "Link"]];
  sheet.getRange(1, 1, 1, 3).setValues(header);
  sheet
    .getRange(1, 1, 1, 3)
    .setFontWeight("bold")
    .setBackground("#4285f4")
    .setFontColor("#ffffff");

  if (sources.length === 0) {
    return "No sources found.";
  }

  var rows = [];
  for (var i = 0; i < sources.length; i++) {
    var s = sources[i];
    rows.push([s.id, s.name, s.link || ""]);
  }

  sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  sheet.autoResizeColumns(1, 3);
  sheet.setFrozenRows(1);
  ss.setActiveSheet(sheet);

  return sources.length + " sources written to sheet.";
}
