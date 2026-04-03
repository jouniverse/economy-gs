/**
 * UN Comtrade Data Fetcher for Google Sheets
 * UN_COMTRADE_DataProcessor.gs — Response transformation, calculations, sheet injection
 */

// ─── Main Orchestrator ──────────────────────────────────────────────────────

/**
 * Process API response data and inject into a new sheet.
 * @param {Array<Object>} data - Raw API response data array.
 * @param {Object} params - Original query parameters.
 * @returns {Object} {sheetName, rowCount}
 */
function comtrade_processResponse(data, params) {
  var columns = comtrade_getColumnsForMode_(params.mode);
  var rows = comtrade_extractRows_(data, columns, params);

  // Apply calculations
  rows = comtrade_applyCalculations_(rows, columns, params);

  // Sort by primary value descending
  var valIdx = comtrade_findColumnIndex_(columns, "primaryValue");
  if (valIdx !== -1) {
    rows.sort(function (a, b) {
      return (b[valIdx] || 0) - (a[valIdx] || 0);
    });
  }

  // Generate headers from column definitions
  var headers = columns.map(function (c) {
    return c.header;
  });

  // Generate sheet name and inject
  var sheetName = comtrade_generateSheetName_(params);
  return comtrade_injectToSheet_(headers, rows, sheetName);
}

// ─── Column Definitions Per Mode ────────────────────────────────────────────

function comtrade_getColumnsForMode_(mode) {
  var base = [
    { key: "period", header: "Period", type: "text" },
    { key: "reporterDesc", header: "Reporter", type: "text" },
    { key: "reporterISO", header: "Reporter ISO", type: "text" },
  ];

  switch (mode) {
    case "summary":
      return base.concat([
        { key: "flowDesc", header: "Flow", type: "text" },
        { key: "primaryValue", header: "Trade Value (USD)", type: "number" },
        { key: "netWgt", header: "Net Weight (kg)", type: "number" },
        { key: "unitValue", header: "Unit Value (USD/kg)", type: "calculated" },
      ]);

    case "balance":
      return [
        { key: "period", header: "Period", type: "text" },
        { key: "reporterDesc", header: "Reporter", type: "text" },
        { key: "partnerDesc", header: "Partner", type: "text" },
        { key: "exportValue", header: "Exports (USD)", type: "number" },
        { key: "importValue", header: "Imports (USD)", type: "number" },
        {
          key: "tradeBalance",
          header: "Trade Balance (USD)",
          type: "calculated",
        },
      ];

    case "partners":
      return base.concat([
        { key: "partnerDesc", header: "Partner", type: "text" },
        { key: "partnerISO", header: "Partner ISO", type: "text" },
        { key: "flowDesc", header: "Flow", type: "text" },
        { key: "primaryValue", header: "Trade Value (USD)", type: "number" },
        { key: "tradeShare", header: "Trade Share (%)", type: "calculated" },
      ]);

    case "products":
      return base.concat([
        { key: "cmdCode", header: "Commodity Code", type: "text" },
        { key: "cmdDesc", header: "Commodity", type: "text" },
        { key: "flowDesc", header: "Flow", type: "text" },
        { key: "primaryValue", header: "Trade Value (USD)", type: "number" },
        { key: "netWgt", header: "Net Weight (kg)", type: "number" },
        { key: "unitValue", header: "Unit Value (USD/kg)", type: "calculated" },
        { key: "tradeShare", header: "Trade Share (%)", type: "calculated" },
      ]);

    case "bilateral":
      return base.concat([
        { key: "partnerDesc", header: "Partner", type: "text" },
        { key: "flowDesc", header: "Flow", type: "text" },
        { key: "cmdCode", header: "Commodity Code", type: "text" },
        { key: "cmdDesc", header: "Commodity", type: "text" },
        { key: "primaryValue", header: "Trade Value (USD)", type: "number" },
        { key: "netWgt", header: "Net Weight (kg)", type: "number" },
        { key: "unitValue", header: "Unit Value (USD/kg)", type: "calculated" },
        { key: "_source", header: "Data Source", type: "text" },
      ]);

    default:
      return base.concat([
        { key: "partnerDesc", header: "Partner", type: "text" },
        { key: "flowDesc", header: "Flow", type: "text" },
        { key: "primaryValue", header: "Trade Value (USD)", type: "number" },
      ]);
  }
}

// ─── Row Extraction ─────────────────────────────────────────────────────────

function comtrade_extractRows_(data, columns, params) {
  // Trade Balance mode: pivot export/import into side-by-side columns
  if (params.mode === "balance") {
    return comtrade_extractBalanceRows_(data);
  }

  var rows = [];
  for (var i = 0; i < data.length; i++) {
    var item = data[i];
    var row = [];
    for (var j = 0; j < columns.length; j++) {
      var col = columns[j];
      if (col.type === "calculated") {
        row.push(null); // Filled in calculation step
      } else {
        row.push(item[col.key] != null ? item[col.key] : "");
      }
    }
    rows.push(row);
  }
  return rows;
}

/**
 * Extract balance rows: group by reporter+partner+period,
 * place export and import values side by side.
 */
function comtrade_extractBalanceRows_(data) {
  var groups = {};
  for (var i = 0; i < data.length; i++) {
    var item = data[i];
    var key =
      item.period + "|" + item.reporterCode + "|" + (item.partnerCode || 0);
    if (!groups[key]) {
      groups[key] = {
        period: item.period,
        reporter: item.reporterDesc || "",
        partner: item.partnerDesc || "",
        exportVal: 0,
        importVal: 0,
      };
    }
    var flow = (item.flowCode || "").toUpperCase();
    if (flow === "X" || flow === "DX" || flow === "RX") {
      groups[key].exportVal += item.primaryValue || 0;
    } else if (flow === "M" || flow === "FM" || flow === "RM") {
      groups[key].importVal += item.primaryValue || 0;
    }
  }

  var rows = [];
  for (var k in groups) {
    var g = groups[k];
    rows.push([
      g.period,
      g.reporter,
      g.partner,
      g.exportVal,
      g.importVal,
      g.exportVal - g.importVal, // Trade balance
    ]);
  }
  return rows;
}

// ─── Calculations ───────────────────────────────────────────────────────────

function comtrade_applyCalculations_(rows, columns, params) {
  if (rows.length === 0) return rows;

  // Find column indices
  var valIdx = comtrade_findColumnIndex_(columns, "primaryValue");
  var wgtIdx = comtrade_findColumnIndex_(columns, "netWgt");
  var uvIdx = comtrade_findColumnIndex_(columns, "unitValue");
  var shareIdx = comtrade_findColumnIndex_(columns, "tradeShare");

  // Calculate unit value
  if (uvIdx !== -1 && valIdx !== -1 && wgtIdx !== -1) {
    for (var i = 0; i < rows.length; i++) {
      var val = rows[i][valIdx];
      var wgt = rows[i][wgtIdx];
      rows[i][uvIdx] =
        wgt && wgt > 0 ? Math.round((val / wgt) * 100) / 100 : "";
    }
  }

  // Calculate trade share
  if (shareIdx !== -1 && valIdx !== -1) {
    rows = comtrade_calculateTradeShare_(rows, valIdx, shareIdx, columns, params);
  }

  // Calculate YoY growth if multi-year
  if (params.mode !== "balance") {
    rows = comtrade_maybeAddYoYGrowth_(rows, columns, params);
  }

  return rows;
}

function comtrade_calculateTradeShare_(rows, valIdx, shareIdx, columns, params) {
  // Group totals by period + flow
  var periodIdx = comtrade_findColumnIndex_(columns, "period");
  var flowIdx = comtrade_findColumnIndex_(columns, "flowDesc");
  var isoIdx = comtrade_findColumnIndex_(columns, "partnerISO");

  // In partners mode, exclude "World" rows to avoid double-counting the aggregate
  var excludeWorld = params.mode === "partners" && isoIdx !== -1;

  var totals = {};
  for (var i = 0; i < rows.length; i++) {
    if (excludeWorld && rows[i][isoIdx] === "W00") continue;
    var groupKey =
      (periodIdx !== -1 ? rows[i][periodIdx] : "") +
      "|" +
      (flowIdx !== -1 ? rows[i][flowIdx] : "");
    totals[groupKey] = (totals[groupKey] || 0) + (rows[i][valIdx] || 0);
  }

  for (var j = 0; j < rows.length; j++) {
    var gk =
      (periodIdx !== -1 ? rows[j][periodIdx] : "") +
      "|" +
      (flowIdx !== -1 ? rows[j][flowIdx] : "");
    var total = totals[gk];
    if (excludeWorld && rows[j][isoIdx] === "W00") {
      rows[j][shareIdx] = "";
    } else {
      rows[j][shareIdx] =
        total > 0
          ? Math.round(((rows[j][valIdx] || 0) / total) * 10000) / 100
          : "";
    }
  }

  return rows;
}

/**
 * If multiple years are present, add a YoY Growth column.
 */
function comtrade_maybeAddYoYGrowth_(rows, columns, params) {
  var periodIdx = comtrade_findColumnIndex_(columns, "period");
  var valIdx = comtrade_findColumnIndex_(columns, "primaryValue");
  if (periodIdx === -1 || valIdx === -1) return rows;

  // Check if multiple periods exist
  var periods = {};
  for (var i = 0; i < rows.length; i++) {
    periods[rows[i][periodIdx]] = true;
  }
  if (Object.keys(periods).length < 2) return rows;

  // Identify stable grouping columns (skip period, descriptions that can
  // change between years, and metadata fields)
  var skipKeys = {
    period: 1,
    cmdDesc: 1,
    reporterDesc: 1,
    partnerDesc: 1,
    _source: 1,
  };
  var groupCols = [];
  for (var c = 0; c < columns.length; c++) {
    if (columns[c].type === "text" && !skipKeys[columns[c].key]) {
      groupCols.push(c);
    }
  }

  // Build lookup: groupKey → {period → value}
  // Track duplicates to avoid misleading results
  var groupMap = {};
  var dupeGroups = {};
  for (var j = 0; j < rows.length; j++) {
    var gk = [];
    for (var g = 0; g < groupCols.length; g++) {
      gk.push(rows[j][groupCols[g]]);
    }
    var groupKey = gk.join("|");
    var period = rows[j][periodIdx];
    if (!groupMap[groupKey]) groupMap[groupKey] = {};
    if (groupMap[groupKey][period] != null) {
      dupeGroups[groupKey] = true;
    }
    groupMap[groupKey][period] = rows[j][valIdx] || 0;
  }

  // Add YoY Growth column
  columns.push({
    key: "yoyGrowth",
    header: "YoY Growth (%)",
    type: "calculated",
  });
  for (var k = 0; k < rows.length; k++) {
    var gk2 = [];
    for (var g2 = 0; g2 < groupCols.length; g2++) {
      gk2.push(rows[k][groupCols[g2]]);
    }
    var gKey = gk2.join("|");

    // Skip YoY for groups with duplicate period entries
    if (dupeGroups[gKey]) {
      rows[k].push("");
      continue;
    }

    var currentPeriod = rows[k][periodIdx];
    var prevPeriod = String(parseInt(currentPeriod, 10) - 1);
    var prevVal = groupMap[gKey] ? groupMap[gKey][prevPeriod] : null;
    var curVal = rows[k][valIdx] || 0;

    if (prevVal != null && prevVal !== 0) {
      rows[k].push(Math.round(((curVal - prevVal) / prevVal) * 10000) / 100);
    } else {
      rows[k].push("");
    }
  }

  return rows;
}

// ─── Sheet Injection ────────────────────────────────────────────────────────

/**
 * Create a new sheet and write data.
 * @param {Array<string>} headers
 * @param {Array<Array>} rows
 * @param {string} baseName - Desired sheet name
 * @returns {Object} {sheetName, rowCount}
 */
function comtrade_injectToSheet_(headers, rows, baseName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Find unique sheet name
  var sheetName = baseName;
  var counter = 1;
  while (ss.getSheetByName(sheetName)) {
    counter++;
    sheetName = baseName + "_" + counter;
  }

  var sheet = ss.insertSheet(sheetName);
  var allData = [headers].concat(rows);
  var numRows = allData.length;
  var numCols = headers.length;

  // Write data
  sheet.getRange(1, 1, numRows, numCols).setValues(allData);

  // Format header row
  var headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#4285f4");
  headerRange.setFontColor("#ffffff");
  sheet.setFrozenRows(1);

  // Apply number format to numeric columns
  for (var c = 0; c < numCols; c++) {
    if (headers[c].indexOf("(USD)") !== -1) {
      sheet
        .getRange(2, c + 1, Math.max(1, numRows - 1), 1)
        .setNumberFormat("#,##0");
    } else if (headers[c].indexOf("(%)") !== -1) {
      sheet
        .getRange(2, c + 1, Math.max(1, numRows - 1), 1)
        .setNumberFormat("#,##0.00");
    } else if (headers[c].indexOf("(kg)") !== -1) {
      sheet
        .getRange(2, c + 1, Math.max(1, numRows - 1), 1)
        .setNumberFormat("#,##0");
    } else if (headers[c].indexOf("USD/kg") !== -1) {
      sheet
        .getRange(2, c + 1, Math.max(1, numRows - 1), 1)
        .setNumberFormat("#,##0.00");
    }
  }

  // Auto-resize columns (up to 12 to avoid slow-down on wide sheets)
  var resizeCols = Math.min(numCols, 12);
  for (var r = 1; r <= resizeCols; r++) {
    sheet.autoResizeColumn(r);
  }

  // Activate the new sheet
  sheet.activate();

  return {
    sheetName: sheetName,
    rowCount: rows.length,
  };
}

// ─── Sheet Name Generation ──────────────────────────────────────────────────

function comtrade_generateSheetName_(params) {
  var reporter = params.reporterISO || params.reporterCode || "ALL";
  var modeLabel =
    {
      summary: "Summary",
      balance: "Balance",
      partners: "Partners",
      products: "Products",
      bilateral: "Bilateral",
    }[params.mode] || params.mode;

  // Period: show range or single year
  var periods = String(params.period).split(",");
  var periodLabel;
  if (periods.length === 1) {
    periodLabel = periods[0];
  } else {
    periodLabel = periods[0] + "-" + periods[periods.length - 1];
  }

  return "Trade_" + reporter + "_" + modeLabel + "_" + periodLabel;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function comtrade_findColumnIndex_(columns, key) {
  for (var i = 0; i < columns.length; i++) {
    if (columns[i].key === key) return i;
  }
  return -1;
}
