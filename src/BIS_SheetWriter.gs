/**
 * SheetWriter.gs — Write parsed data to Google Sheets
 */

var SheetWriter = (function () {
  /**
   * Write a 2D table array to a sheet.
   * @param {Array<Array>} tableArray  — first row is headers
   * @param {Object} options
   * @param {string} options.dataflowId
   * @param {string} [options.key]
   * @param {boolean} [options.newSheet=true]
   * @param {boolean} [options.includeMetadata=true]
   * @return {{sheetName:string, rows:number, cols:number}}
   */
  function writeToSheet(tableArray, options) {
    options = options || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet;

    if (options.newSheet !== false) {
      var sheetName = buildSheetName_(options.dataflowId);
      sheet = ss.insertSheet(sheetName);
    } else {
      sheet = ss.getActiveSheet();
      sheet.clear();
    }

    var startRow = 1;

    // Metadata header
    if (options.includeMetadata !== false) {
      var metaRows = buildMetadata_(options);
      if (metaRows.length > 0) {
        sheet
          .getRange(1, 1, metaRows.length, metaRows[0].length)
          .setValues(metaRows);
        sheet
          .getRange(1, 1, metaRows.length, metaRows[0].length)
          .setFontColor("#666666")
          .setFontSize(9)
          .setFontStyle("italic");
        startRow = metaRows.length + 1;
      }
    }

    if (!tableArray || tableArray.length === 0) {
      sheet.getRange(startRow, 1).setValue("No data returned.");
      return { sheetName: sheet.getName(), rows: 0, cols: 0 };
    }

    var numRows = tableArray.length;
    var numCols = tableArray[0].length;

    // Write all data
    sheet.getRange(startRow, 1, numRows, numCols).setValues(tableArray);

    // Format header row (first row of tableArray)
    sheet
      .getRange(startRow, 1, 1, numCols)
      .setFontWeight("bold")
      .setBackground("#E8F0FE")
      .setBorder(false, false, true, false, false, false);

    // Freeze header
    sheet.setFrozenRows(startRow);

    // Auto-resize columns (up to 10 to avoid slowness)
    var resizeCols = Math.min(numCols, 10);
    for (var c = 1; c <= resizeCols; c++) {
      sheet.autoResizeColumn(c);
    }

    // Format numeric value column — find "Value" header
    var headers = tableArray[0];
    var valueCol = -1;
    for (var h = 0; h < headers.length; h++) {
      if (headers[h] === "Value") {
        valueCol = h + 1;
        break;
      }
    }
    if (valueCol > 0 && numRows > 1) {
      sheet
        .getRange(startRow + 1, valueCol, numRows - 1, 1)
        .setNumberFormat("#,##0.####");
    }

    // Activate the new sheet
    ss.setActiveSheet(sheet);

    return {
      sheetName: sheet.getName(),
      rows: numRows - 1, // exclude header
      cols: numCols,
    };
  }

  // ─── Internal ───

  function buildSheetName_(dataflowId) {
    var base = (dataflowId || "BIS") + "_" + formatTimestamp_();
    // Sheet names must be ≤ 100 chars and unique
    return base.substring(0, 100);
  }

  function formatTimestamp_() {
    var d = new Date();
    return Utilities.formatDate(
      d,
      Session.getScriptTimeZone(),
      "yyyyMMdd_HHmmss",
    );
  }

  function buildMetadata_(options) {
    var cols = 2;
    var rows = [];
    rows.push(["Dataset", options.dataflowId || ""]);
    if (options.key) {
      rows.push(["Key filter", options.key]);
    }
    rows.push(["Fetched", new Date().toISOString()]);
    rows.push(["", ""]); // blank separator
    return rows;
  }

  /**
   * Write a codebook table to a new sheet with formatted header.
   * @param {Array<Array>} rows  — first row is headers (DIMENSION, CODE, NAME)
   * @param {string} sheetName
   * @return {{sheetName:string, rows:number}}
   */
  function writeCodebook(rows, sheetName) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var safeName = (sheetName || "Codes").substring(0, 100);
    var sheet = ss.insertSheet(safeName);

    var numRows = rows.length;
    var numCols = rows[0].length;
    sheet.getRange(1, 1, numRows, numCols).setValues(rows);

    // Header formatting: bold, blue background, white text
    sheet
      .getRange(1, 1, 1, numCols)
      .setFontWeight("bold")
      .setBackground("#4285f4")
      .setFontColor("#ffffff");

    sheet.setFrozenRows(1);
    for (var c = 1; c <= numCols; c++) {
      sheet.autoResizeColumn(c);
    }

    ss.setActiveSheet(sheet);
    return { sheetName: sheet.getName(), rows: numRows - 1 };
  }

  return {
    writeToSheet: writeToSheet,
    writeCodebook: writeCodebook,
  };
})();
