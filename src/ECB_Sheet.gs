// ---------------------------------------------------------------------------
// ECB_Sheet.gs — Write data into Google Sheets
// ---------------------------------------------------------------------------

/**
 * Write parsed SDMX data rows into the active spreadsheet.
 *
 * @param {string[]} headers   Column header names.
 * @param {any[][]}  rows      2D array of data rows.
 * @param {string}   sheetName Name for the sheet.
 * @returns {string} Status message.
 * @private
 */
function ecb_writeDataToSheet_(headers, rows, sheetName) {
  if (!headers || headers.length === 0) {
    throw new Error("No data returned from the ECB API.");
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);

  if (sheet) {
    sheet.clear();
  } else {
    sheet = ss.insertSheet(sheetName);
  }

  // Write header row
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

  // Write data rows in one batch
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

  // Format TIME_PERIOD column as plain text
  var timeIdx = headers.indexOf("TIME_PERIOD");
  if (timeIdx >= 0) {
    sheet.getRange(2, timeIdx + 1, rows.length, 1).setNumberFormat("@");
  }

  // Format OBS_VALUE column
  var valIdx = headers.indexOf("OBS_VALUE");
  if (valIdx >= 0) {
    sheet
      .getRange(2, valIdx + 1, rows.length, 1)
      .setNumberFormat("#,##0.0####");
  }

  // Polish
  sheet.autoResizeColumns(1, headers.length);
  sheet.setFrozenRows(1);
  ss.setActiveSheet(sheet);

  return rows.length + " observations written to " + sheetName;
}

/**
 * Write a simple list to a sheet (e.g., dataflows, codebook).
 *
 * @param {string[][]} data       2D array including header row.
 * @param {string}     sheetName  Sheet name.
 * @returns {string} Status message.
 * @private
 */
function ecb_writeListToSheet_(data, sheetName) {
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

  // Format header
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
