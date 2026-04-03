/**
 * UN Comtrade Data Fetcher for Google Sheets
 * UN_COMTRADE_Code.gs — API key management, cache management, orchestration
 */

// ─── API Key Management ─────────────────────────────────────────────────────

function comtrade_saveApiKey(key) {
  if (!key || typeof key !== "string" || key.trim().length === 0) {
    throw new Error("Please provide a valid API key.");
  }
  PropertiesService.getScriptProperties().setProperty(
    "COMTRADE_API_KEY",
    key.trim(),
  );
  return "API key saved successfully.";
}

function comtrade_getApiKeyStatus() {
  var key =
    PropertiesService.getScriptProperties().getProperty("COMTRADE_API_KEY");
  return { saved: !!key };
}

function comtrade_getApiKey_() {
  var key =
    PropertiesService.getScriptProperties().getProperty("COMTRADE_API_KEY");
  if (!key) {
    throw new Error(
      "API key not found. Please save your API key in the sidebar.",
    );
  }
  return key;
}

// ─── Cache Management ───────────────────────────────────────────────────────

function comtrade_clearAllCache() {
  comtrade_clearMetadataCache();
  SpreadsheetApp.getUi().alert("All caches cleared.");
}

function comtrade_refreshMetadataCache() {
  comtrade_clearMetadataCache();
  comtrade_getReporters();
  comtrade_getPartners();
  SpreadsheetApp.getUi().alert("Metadata cache refreshed.");
}

// ─── Reference Data Injection ───────────────────────────────────────────────

/**
 * Fetch latest data updates from the UN Comtrade Live Update endpoint
 * and inject them into a new sheet.
 * @returns {Object} { sheetName, rowCount }
 */
function comtrade_fetchLiveUpdates() {
  var apiKey = comtrade_getApiKey_();
  var url =
    "https://comtradeapi.un.org/data/v1/getLiveUpdate?subscription-key=" +
    encodeURIComponent(apiKey);

  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  var code = response.getResponseCode();
  if (code !== 200) {
    throw new Error("Failed to fetch live updates (HTTP " + code + ").");
  }

  var json = JSON.parse(response.getContentText());
  var rows = json.data || [];
  if (rows.length === 0) {
    throw new Error("No live update records returned.");
  }

  var reporterMap = {};
  try {
    var reporters = comtrade_getReporters();
    for (var r = 0; r < reporters.length; r++) {
      reporterMap[String(reporters[r].id)] = reporters[r].text;
    }
  } catch (e) {
    // If reporter fetch fails, we still proceed without names
  }

  var columns = [
    { key: "lastUpdated", header: "Last Updated" },
    { key: "reporterCode", header: "Reporter Code" },
    { key: "_reporterName", header: "Reporter" },
    { key: "typeCode", header: "Type" },
    { key: "freqCode", header: "Frequency" },
    { key: "classificationCode", header: "Classification" },
    { key: "period", header: "Period" },
    { key: "releaseStatus", header: "Release Status" },
    { key: "status", header: "Processing Status" },
  ];

  var headers = columns.map(function (c) {
    return c.header;
  });
  var data = [headers];
  for (var i = 0; i < rows.length; i++) {
    var row = [];
    for (var j = 0; j < columns.length; j++) {
      if (columns[j].key === "_reporterName") {
        row.push(reporterMap[String(rows[i].reporterCode)] || "");
      } else {
        var val = rows[i][columns[j].key];
        row.push(val !== undefined && val !== null ? val : "");
      }
    }
    data.push(row);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "LiveUpdates";
  var existing = ss.getSheetByName(sheetName);
  if (existing) ss.deleteSheet(existing);
  var sheet = ss.insertSheet(sheetName);

  sheet.getRange(1, 1, data.length, headers.length).setValues(data);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  sheet.setFrozenRows(1);
  for (var c = 1; c <= headers.length; c++) {
    sheet.autoResizeColumn(c);
  }
  ss.setActiveSheet(sheet);

  return { sheetName: sheetName, rowCount: rows.length };
}

/**
 * Metadata catalogue: code → { url, label, type }.
 */
var COMTRADE_REF_CATALOGUE_ = {
  // ── Classifications ──
  B4: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/B4.json",
    label: "Product [BEC Rev. 4]",
    type: "classification",
  },
  B5: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/B5.json",
    label: "Product [BEC Rev. 5]",
    type: "classification",
  },
  EB02: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/EB02.json",
    label: "Product [EBOPS 2002]",
    type: "classification",
  },
  EB10: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/EB10.json",
    label: "Product [EBOPS 2010]",
    type: "classification",
  },
  EB10S: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/EB10S.json",
    label: "Product [EBOPS 2010 SDMX]",
    type: "classification",
  },
  EB: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/EB.json",
    label: "Product [EBOPS Combined]",
    type: "classification",
  },
  H0: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/H0.json",
    label: "Product [HS 1992]",
    type: "classification",
  },
  H1: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/H1.json",
    label: "Product [HS 1996]",
    type: "classification",
  },
  H2: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/H2.json",
    label: "Product [HS 2002]",
    type: "classification",
  },
  H3: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/H3.json",
    label: "Product [HS 2007]",
    type: "classification",
  },
  H4: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/H4.json",
    label: "Product [HS 2012]",
    type: "classification",
  },
  H5: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/H5.json",
    label: "Product [HS 2017]",
    type: "classification",
  },
  H6: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/H6.json",
    label: "Product [HS 2022]",
    type: "classification",
  },
  HS: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/HS.json",
    label: "Product [HS Combined]",
    type: "classification",
  },
  S1: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/S1.json",
    label: "Product [SITC Rev. 1]",
    type: "classification",
  },
  S2: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/S2.json",
    label: "Product [SITC Rev. 2]",
    type: "classification",
  },
  S3: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/S3.json",
    label: "Product [SITC Rev. 3]",
    type: "classification",
  },
  S4: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/S4.json",
    label: "Product [SITC Rev. 4]",
    type: "classification",
  },
  SS: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/SS.json",
    label: "Product [SITC Combined]",
    type: "classification",
  },
  // ── Other reference data ──
  reporters: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/Reporters.json",
    label: "Reporter Countries/Areas",
    type: "reference",
  },
  partners: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/partnerAreas.json",
    label: "Partner Countries/Areas",
    type: "reference",
  },
  frequency: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/Frequency.json",
    label: "Frequency",
    type: "reference",
  },
  customs: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/CustomsCodes.json",
    label: "Customs Procedure Codes",
    type: "reference",
  },
  mot: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/ModeOfTransportCodes.json",
    label: "Mode of Transport",
    type: "reference",
  },
  mos: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/ModeOfSupply.json",
    label: "Mode of Supply",
    type: "reference",
  },
  tradeItems: {
    url: "https://comtradeapi.un.org/files/v1/app/reference/TradeDataItems.json",
    label: "Trade Data Items",
    type: "reference",
  },
  regimes: {
    url: null,
    label: "Trade Regimes (Flow Codes)",
    type: "reference",
  },
};

/**
 * Returns the catalogue so the sidebar can populate its dropdown.
 */
function comtrade_getReferenceCatalogue() {
  var classifications = [];
  var references = [];
  var keys = Object.keys(COMTRADE_REF_CATALOGUE_);
  for (var i = 0; i < keys.length; i++) {
    var entry = {
      code: keys[i],
      label: COMTRADE_REF_CATALOGUE_[keys[i]].label,
      type: COMTRADE_REF_CATALOGUE_[keys[i]].type,
    };
    if (entry.type === "classification") {
      classifications.push(entry);
    } else {
      references.push(entry);
    }
  }
  return { classifications: classifications, references: references };
}

/**
 * Fetch a reference JSON from the API and inject into a new sheet.
 * @param {string} code - Key in COMTRADE_REF_CATALOGUE_.
 * @returns {Object} { sheetName, rowCount }
 */
function comtrade_injectReferenceData(code) {
  var entry = COMTRADE_REF_CATALOGUE_[code];
  if (!entry) throw new Error("Unknown reference code: " + code);

  var json;
  if (entry.url) {
    var response = UrlFetchApp.fetch(entry.url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) {
      throw new Error(
        "Failed to fetch reference data (HTTP " +
          response.getResponseCode() +
          ").",
      );
    }
    json = JSON.parse(response.getContentText());
  } else {
    json = comtrade_getTradeRegimesFallback_();
  }

  var rows = json.results;
  if (!rows || rows.length === 0) {
    throw new Error("Reference data is empty.");
  }

  var headerSet = {};
  var headerOrder = [];
  for (var i = 0; i < rows.length; i++) {
    var keys = Object.keys(rows[i]);
    for (var j = 0; j < keys.length; j++) {
      if (!headerSet[keys[j]]) {
        headerSet[keys[j]] = true;
        headerOrder.push(keys[j]);
      }
    }
  }

  var data = [headerOrder];
  for (var i = 0; i < rows.length; i++) {
    var row = [];
    for (var j = 0; j < headerOrder.length; j++) {
      var val = rows[i][headerOrder[j]];
      row.push(val !== undefined && val !== null ? val : "");
    }
    data.push(row);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName = "Ref_" + code;
  var existing = ss.getSheetByName(sheetName);
  if (existing) ss.deleteSheet(existing);
  var sheet = ss.insertSheet(sheetName);

  sheet.getRange(1, 1, data.length, headerOrder.length).setValues(data);
  sheet.getRange(1, 1, 1, headerOrder.length).setFontWeight("bold");
  sheet.setFrozenRows(1);

  var colsToResize = Math.min(headerOrder.length, 10);
  for (var c = 1; c <= colsToResize; c++) {
    sheet.autoResizeColumn(c);
  }

  ss.setActiveSheet(sheet);
  return { sheetName: sheetName, rowCount: rows.length };
}

/**
 * Hard-coded trade regimes fallback (no live URL available).
 */
function comtrade_getTradeRegimesFallback_() {
  return {
    results: [
      { id: "M", text: "Import" },
      { id: "X", text: "Export" },
      { id: "DX", text: "Domestic Export" },
      { id: "FM", text: "Foreign Import" },
      { id: "MIP", text: "Import of goods for inward processing" },
      { id: "MOP", text: "Import of goods after outward processing" },
      { id: "RM", text: "Re-import" },
      { id: "RX", text: "Re-export" },
      { id: "XIP", text: "Export of goods for inward processing" },
      { id: "XOP", text: "Export of goods after outward processing" },
    ],
  };
}

// ─── Main Orchestrator ──────────────────────────────────────────────────────

/**
 * Primary entry point called from the sidebar.
 * @param {Object} params - Query parameters from the UI.
 * @returns {Object} Result with sheetName and rowCount.
 */
function comtrade_runComtradeFetch(params) {
  var validation = comtrade_validateParams(params);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  var apiKey = comtrade_getApiKey_();

  var result;
  if (params.mode === "bilateral" && params.useMirror) {
    result = comtrade_fetchWithMirror(params, apiKey);
  } else {
    result = fetchComtradeData(params, apiKey);
  }

  if (!result.data || result.data.length === 0) {
    var hint = "";
    if (params.mode === "bilateral" && !params.useMirror) {
      hint = ' Try enabling the "Use Mirror Data" option.';
    }
    throw new Error("No data found for the selected parameters." + hint);
  }

  return comtrade_processResponse(result.data, params);
}
