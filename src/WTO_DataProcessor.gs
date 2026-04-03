/**
 * Turn WTO /data JSON arrays into sheet rows and inject into the spreadsheet.
 */

var WTO_COLUMN_ORDER = [
  "indicatorCategoryCode",
  "indicatorCategory",
  "indicatorCode",
  "indicator",
  "reportingEconomyCode",
  "reportingEconomy",
  "partnerEconomyCode",
  "partnerEconomy",
  "productOrSectorClassificationCode",
  "productOrSectorClassification",
  "productOrSectorCode",
  "productOrSector",
  "periodCode",
  "period",
  "frequencyCode",
  "frequency",
  "unitCode",
  "unit",
  "year",
  "valueFlagCode",
  "valueFlag",
  "textValue",
  "value",
];

/**
 * Monthly merchandise export/import indicators: add a chart-friendly YearMonth column.
 */
function wto_shouldAddYearMonthColumn_(params) {
  var i = params && params.i ? String(params.i) : "";
  return i === "ITS_MTV_MX" || i === "ITS_MTV_MM";
}

/**
 * WTO JSON may use camelCase or PascalCase; some monthly rows encode time only in periodCode (e.g. YYYYMM).
 */
function wto_firstDefinedRowField_(row, keys) {
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    if (row[k] !== null && row[k] !== undefined && row[k] !== "") {
      return row[k];
    }
  }
  return null;
}

/**
 * Builds values like 2020-M02 for Google Sheets time axes (year + periodCode).
 */
function wto_buildYearMonthForRow_(row) {
  var pcRaw = wto_firstDefinedRowField_(row, ["periodCode", "PeriodCode"]);
  var pc = pcRaw != null ? String(pcRaw).trim() : "";

  // e.g. 2020-02 or 2020-02-01
  var isoYm = pc.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (isoYm) {
    var yi = parseInt(isoYm[1], 10);
    var mi = parseInt(isoYm[2], 10);
    if (mi >= 1 && mi <= 12) {
      return yi + "-M" + (mi < 10 ? "0" + mi : String(mi));
    }
  }

  // Monthly as single token YYYYMM (year often redundant or null)
  if (/^\d{6}$/.test(pc)) {
    var ys6 = pc.substring(0, 4);
    var m6 = parseInt(pc.substring(4, 6), 10);
    if (m6 >= 1 && m6 <= 12) {
      var mm6 = m6 < 10 ? "0" + m6 : String(m6);
      return ys6 + "-M" + mm6;
    }
  }

  var yRaw = wto_firstDefinedRowField_(row, ["year", "Year"]);
  var ys =
    yRaw !== null && yRaw !== undefined && yRaw !== ""
      ? String(parseInt(String(yRaw), 10))
      : "";
  if (ys === "NaN") {
    ys = "";
  }

  if (!pc) {
    return "";
  }

  var m = null;
  var mMatch = pc.toUpperCase().match(/^M(\d{1,2})$/);
  if (mMatch) {
    m = parseInt(mMatch[1], 10);
  } else if (/^\d{2}$/.test(pc)) {
    m = parseInt(pc, 10);
  } else if (/^\d{4}M\d{2}$/i.test(pc)) {
    var p4 = pc.match(/^(\d{4})M(\d{2})$/i);
    if (p4) {
      ys = p4[1];
      m = parseInt(p4[2], 10);
    }
  }

  if (m == null || m < 1 || m > 12) {
    return "";
  }
  if (!ys) {
    return "";
  }
  var mm = m < 10 ? "0" + m : String(m);
  return ys + "-M" + mm;
}

/**
 * @param {Array<Object>} dataRows
 * @param {Object} params - for sheet naming
 * @returns {{ sheetName: string, rowCount: number }}
 */
function processWtoDataResponse(dataRows, params) {
  if (!dataRows || !dataRows.length) {
    throw new Error(
      "No data rows returned for this query. Try another reporting economy, time period, or indicator.",
    );
  }

  var headers = [];
  var keySet = {};
  dataRows.forEach(function (row) {
    Object.keys(row).forEach(function (k) {
      keySet[k] = true;
    });
  });
  WTO_COLUMN_ORDER.forEach(function (k) {
    if (keySet[k]) {
      headers.push(k);
    }
  });
  Object.keys(keySet).forEach(function (k) {
    if (headers.indexOf(k) === -1) {
      headers.push(k);
    }
  });

  var addYearMonth = wto_shouldAddYearMonthColumn_(params);
  if (addYearMonth) {
    var yi = headers.indexOf("year");
    if (yi === -1) {
      headers.push("YearMonth");
    } else {
      headers.splice(yi + 1, 0, "YearMonth");
    }
  }

  var table = [headers];
  dataRows.forEach(function (row) {
    var line = headers.map(function (h) {
      if (h === "YearMonth") {
        return wto_buildYearMonthForRow_(row);
      }
      var v = row[h];
      if (v === null || v === undefined) {
        return "";
      }
      if (typeof v === "object") {
        return JSON.stringify(v);
      }
      return v;
    });
    table.push(line);
  });

  var sheetName = generateWtoSheetName_(params);
  return wto_injectToSheet_(table, sheetName);
}

function generateWtoSheetName_(params) {
  var base = "WTO";
  if (params && params.i) {
    base += "_" + String(params.i).replace(/[^a-zA-Z0-9_-]/g, "_");
  }
  var suffix = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyyMMdd_HHmmss",
  );
  var name = base + "_" + suffix;
  if (name.length > 95) {
    name = name.substring(0, 95);
  }
  return name;
}

/**
 * @param {Array<Array>} table - including header row
 * @param {string} sheetName
 */
function wto_injectToSheet_(table, sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var name = sheetName;
  var n = 1;
  while (ss.getSheetByName(name)) {
    name = sheetName + "_" + n;
    n++;
  }
  var sheet = ss.insertSheet(name);
  var numRows = table.length;
  var numCols = table[0] ? table[0].length : 0;
  if (numCols === 0) {
    throw new Error("No columns to write.");
  }
  sheet.getRange(1, 1, numRows, numCols).setValues(table);
  sheet.setFrozenRows(1);
  return { sheetName: name, rowCount: numRows - 1 };
}

/**
 * Export catalog: array of objects -> sheet
 */
function wto_injectCatalogToSheet_(headers, rows, sheetName) {
  var table = [headers].concat(rows);
  return wto_injectToSheet_(table, sheetName);
}
