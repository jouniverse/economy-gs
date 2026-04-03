/**
 * UN Comtrade Data Fetcher for Google Sheets
 * UN_COMTRADE_Metadata.gs — Reference data fetch, caching, country/commodity lookups
 */

var COMTRADE_REFERENCE_BASE_URL = "https://comtradeapi.un.org/files/v1/app/reference/";
var COMTRADE_CACHE_TTL = 21600; // 6 hours in seconds (CacheService maximum)
var COMTRADE_CACHE_CHUNK_SIZE = 90000; // ~90KB per chunk (CacheService limit is 100KB per key)
var COMTRADE_REF_SHEET_NAME = "_comtrade_ref";

// ─── Reporters & Partners ───────────────────────────────────────────────────

function comtrade_getReporters() {
  return comtrade_getCachedList_("reporters", "Reporters.json", function (item) {
    return {
      id: String(item.id),
      text: item.text,
      iso3: item.reporterCodeIsoAlpha3 || "",
      isGroup: item.isGroup || false,
    };
  });
}

function comtrade_getPartners() {
  return comtrade_getCachedList_("partners", "partnerAreas.json", function (item) {
    return {
      id: String(item.id),
      text: item.text,
      iso3: item.PartnerCodeIsoAlpha3 || "",
      isGroup: item.isGroup || false,
    };
  });
}

/**
 * Generic cached list fetcher with chunked CacheService storage.
 * @private
 */
function comtrade_getCachedList_(cachePrefix, fileName, mapper) {
  var cache = CacheService.getScriptCache();

  // Try to read from cache (may be chunked)
  var cached = comtrade_readChunkedCache_(cache, cachePrefix);
  if (cached) {
    return cached;
  }

  // Fetch from API
  var url = COMTRADE_REFERENCE_BASE_URL + fileName;
  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) {
    throw new Error("Failed to fetch reference data from " + fileName);
  }

  var raw = JSON.parse(response.getContentText());
  var results = raw.results || raw;

  // Filter out expired/historical entries and map
  var now = new Date().toISOString();
  var items = [];
  for (var i = 0; i < results.length; i++) {
    var r = results[i];
    if (r.entryExpiredDate && r.entryExpiredDate < now) continue;
    items.push(mapper(r));
  }

  // Sort alphabetically by text
  items.sort(function (a, b) {
    return a.text.localeCompare(b.text);
  });

  // Store in chunked cache
  comtrade_writeChunkedCache_(cache, cachePrefix, items);

  return items;
}

// ─── Classification Codes (Hidden Sheet Cache) ─────────────────────────────

/**
 * Get commodity classification codes for a given classification system.
 * Stored in a hidden sheet because data can be large (>100KB).
 * @param {string} clCode - Classification code (e.g. 'HS', 'H6', 'S3', 'B5', 'EB10')
 * @returns {Array<Object>} Array of {id, text, parent, aggLevel}
 */
function comtrade_getClassificationCodes(clCode) {
  var sheetKey = "cl_" + clCode;

  // Try hidden sheet cache
  var cached = comtrade_readRefSheet_(sheetKey);
  if (cached) return cached;

  // Fetch from API
  var url = COMTRADE_REFERENCE_BASE_URL + clCode + ".json";
  var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) {
    throw new Error("Failed to fetch classification codes for " + clCode);
  }

  var raw = JSON.parse(response.getContentText());
  var results = raw.results || raw;

  var items = [];
  for (var i = 0; i < results.length; i++) {
    var r = results[i];
    items.push({
      id: String(r.id),
      text: r.text,
      parent: r.parent || "",
      aggLevel:
        r.aggLevel != null
          ? r.aggLevel
          : r.aggrLevel != null
            ? r.aggrLevel
            : "",
    });
  }

  // Write to hidden sheet
  comtrade_writeRefSheet_(sheetKey, items);

  return items;
}

// ─── Flow Codes (Hardcoded — stable) ───────────────────────────────────────

function comtrade_getFlowCodes() {
  return [
    { id: "M", text: "Import" },
    { id: "X", text: "Export" },
    { id: "RM", text: "Re-import" },
    { id: "RX", text: "Re-export" },
  ];
}

/** Full flow list including extended codes */
function comtrade_getAllFlowCodes() {
  return [
    { id: "M", text: "Import" },
    { id: "X", text: "Export" },
    { id: "RM", text: "Re-import" },
    { id: "RX", text: "Re-export" },
    { id: "DX", text: "Domestic Export" },
    { id: "FM", text: "Foreign Import" },
    { id: "MIP", text: "Import for Inward Processing" },
    { id: "MOP", text: "Import after Outward Processing" },
    { id: "XIP", text: "Export after Inward Processing" },
    { id: "XOP", text: "Export for Outward Processing" },
  ];
}

// ─── Classification Metadata ────────────────────────────────────────────────

/** Returns classification options filtered by data type */
function comtrade_getClassifications(dataType) {
  if (dataType === "S") {
    return [
      { code: "EB", label: "EBOPS (Combined)" },
      { code: "EB02", label: "EBOPS 2002" },
      { code: "EB10", label: "EBOPS 2010" },
    ];
  }
  return [
    { code: "HS", label: "HS (Combined)" },
    { code: "H6", label: "HS 2022" },
    { code: "H5", label: "HS 2017" },
    { code: "H4", label: "HS 2012" },
    { code: "H3", label: "HS 2007" },
    { code: "H2", label: "HS 2002" },
    { code: "H1", label: "HS 1996" },
    { code: "H0", label: "HS 1992" },
    { code: "SS", label: "SITC (Combined)" },
    { code: "S4", label: "SITC Rev.4" },
    { code: "S3", label: "SITC Rev.3" },
    { code: "S2", label: "SITC Rev.2" },
    { code: "S1", label: "SITC Rev.1" },
    { code: "B5", label: "BEC Rev.5" },
    { code: "B4", label: "BEC Rev.4" },
  ];
}

// ─── Cache Clear ────────────────────────────────────────────────────────────

function comtrade_clearMetadataCache() {
  var cache = CacheService.getScriptCache();

  // Remove chunked entries for reporters and partners
  var keysToRemove = [];
  for (var i = 0; i < 50; i++) {
    keysToRemove.push("reporters_chunk_" + i);
    keysToRemove.push("partners_chunk_" + i);
  }
  keysToRemove.push("reporters_chunks");
  keysToRemove.push("partners_chunks");
  cache.removeAll(keysToRemove);

  // Remove hidden ref sheet
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (var j = 0; j < sheets.length; j++) {
    if (sheets[j].getName() === COMTRADE_REF_SHEET_NAME) {
      ss.deleteSheet(sheets[j]);
      break;
    }
  }
}

// ─── Chunked CacheService Helpers ───────────────────────────────────────────

function comtrade_writeChunkedCache_(cache, prefix, data) {
  var json = JSON.stringify(data);
  var chunks = [];
  for (var i = 0; i < json.length; i += COMTRADE_CACHE_CHUNK_SIZE) {
    chunks.push(json.substring(i, i + COMTRADE_CACHE_CHUNK_SIZE));
  }

  var cacheObj = {};
  cacheObj[prefix + "_chunks"] = String(chunks.length);
  for (var j = 0; j < chunks.length; j++) {
    cacheObj[prefix + "_chunk_" + j] = chunks[j];
  }
  cache.putAll(cacheObj, COMTRADE_CACHE_TTL);
}

function comtrade_readChunkedCache_(cache, prefix) {
  var countStr = cache.get(prefix + "_chunks");
  if (!countStr) return null;

  var count = parseInt(countStr, 10);
  var keys = [];
  for (var i = 0; i < count; i++) {
    keys.push(prefix + "_chunk_" + i);
  }

  var chunks = cache.getAll(keys);
  var json = "";
  for (var j = 0; j < count; j++) {
    var chunk = chunks[prefix + "_chunk_" + j];
    if (!chunk) return null; // Cache miss on a chunk — refetch
    json += chunk;
  }

  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

// ─── Hidden Sheet Helpers ───────────────────────────────────────────────────

function comtrade_getOrCreateRefSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(COMTRADE_REF_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(COMTRADE_REF_SHEET_NAME);
    // Hide the sheet
    sheet.hideSheet();
  }
  return sheet;
}

/**
 * Write data to hidden ref sheet. Each dataset stored as:
 * Row 1 of section: key
 * Row 2 of section: JSON-encoded data
 * Sections separated by finding the key.
 */
function comtrade_writeRefSheet_(key, data) {
  var sheet = comtrade_getOrCreateRefSheet_();
  var lastRow = sheet.getLastRow();

  // Check if key already exists and update
  if (lastRow > 0) {
    var allKeys = sheet.getRange(1, 1, lastRow, 1).getValues();
    for (var i = 0; i < allKeys.length; i++) {
      if (allKeys[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(JSON.stringify(data));
        return;
      }
    }
  }

  // Append new entry
  var newRow = lastRow + 1;
  sheet.getRange(newRow, 1).setValue(key);
  sheet.getRange(newRow, 2).setValue(JSON.stringify(data));
}

function comtrade_readRefSheet_(key) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(COMTRADE_REF_SHEET_NAME);
  if (!sheet) return null;

  var lastRow = sheet.getLastRow();
  if (lastRow === 0) return null;

  var allData = sheet.getRange(1, 1, lastRow, 2).getValues();
  for (var i = 0; i < allData.length; i++) {
    if (allData[i][0] === key && allData[i][1]) {
      try {
        return JSON.parse(allData[i][1]);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
}
