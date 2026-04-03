// ---------------------------------------------------------------------------
// OECD_Sheet.gs — Write data into Google Sheets
// ---------------------------------------------------------------------------

/**
 * Write parsed SDMX data rows into the active spreadsheet.
 *
 * Creates a new sheet (or clears existing) named after the dataflow.
 * Writes a header row with formatting, then all data rows in a single batch.
 *
 * @param {string[]} headers   Column header names (e.g. ["REF_AREA","TIME_PERIOD","OBS_VALUE"]).
 * @param {any[][]}  rows      2D array of data rows matching the headers.
 * @param {string}   sheetName Name for the new/reused sheet.
 * @returns {string} Status message.
 * @private
 */
function oecd_writeDataToSheet_(headers, rows, sheetName) {
  if (!headers || headers.length === 0) {
    throw new Error("No data returned from the OECD API.");
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet(sheetName);
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet
    .getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#4285f4")
    .setFontColor("#ffffff");

  if (!rows || rows.length === 0) {
    ss.setActiveSheet(sheet);
    return "0 observations — headers written to " + sheetName;
  }

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

  var timeIdx = headers.indexOf("TIME_PERIOD");
  if (timeIdx >= 0) {
    sheet.getRange(2, timeIdx + 1, rows.length, 1).setNumberFormat("@");
  }

  var valIdx = headers.indexOf("OBS_VALUE");
  if (valIdx >= 0) {
    sheet
      .getRange(2, valIdx + 1, rows.length, 1)
      .setNumberFormat("#,##0.0####");
  }

  sheet.autoResizeColumns(1, headers.length);
  sheet.setFrozenRows(1);
  ss.setActiveSheet(sheet);

  return rows.length + " observations written to " + sheetName;
}

/**
 * Write a simple multi-column list to a sheet (e.g., dataflows, codes).
 *
 * @param {string[][]} data       2D array including header row.
 * @param {string}     sheetName  Sheet name.
 * @returns {string} Status message.
 * @private
 */
function oecd_writeListToSheet_(data, sheetName) {
  if (!data || data.length === 0) {
    throw new Error("No data to write.");
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet(sheetName);
  }

  var numCols = data[0].length;

  sheet.getRange(1, 1, data.length, numCols).setValues(data);

  sheet
    .getRange(1, 1, 1, numCols)
    .setFontWeight("bold")
    .setBackground("#4285f4")
    .setFontColor("#ffffff");

  sheet.autoResizeColumns(1, numCols);
  sheet.setFrozenRows(1);
  ss.setActiveSheet(sheet);

  return data.length - 1 + " rows written to " + sheetName;
}
