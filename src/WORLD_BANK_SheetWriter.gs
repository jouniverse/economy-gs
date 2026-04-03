/**
 * WORLD_BANK_SheetWriter.gs — Writes data arrays and reference tables to sheets.
 *
 * Uses batch setValues() for performance. Can write to a new sheet
 * or to the active sheet at the cursor position.
 */

// ---------------------------------------------------------------------------
// Main data writer
// ---------------------------------------------------------------------------

/**
 * Write a 2-D array to the spreadsheet.
 *
 * @param {Array[]} data2D — array of rows (first row is headers)
 * @param {Object} options
 *   - destination: 'new' (default) | 'active'
 *   - sheetName:   string (for new sheets)
 *   - includeMetadata: boolean — prepend a metadata row
 *   - metaInfo:    { indicators, countries, timeMode, startYear, endYear, mrvCount, format }
 */
function wb_writeDataToSheet(data2D, options) {
  options = options || {};
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet;

  if (options.destination === "active") {
    sheet = ss.getActiveSheet();
    var cell = sheet.getActiveCell();
    var startRow = cell.getRow();
    var startCol = cell.getColumn();

    if (options.includeMetadata && options.metaInfo) {
      var metaRow = wb_buildMetaRow_(options.metaInfo, data2D[0].length);
      sheet
        .getRange(startRow, startCol, 1, metaRow.length)
        .setValues([metaRow]);
      sheet
        .getRange(startRow, startCol, 1, metaRow.length)
        .setFontColor("#888888")
        .setFontSize(9)
        .setFontStyle("italic");
      startRow++;
    }

    if (data2D.length > 0 && data2D[0].length > 0) {
      sheet
        .getRange(startRow, startCol, data2D.length, data2D[0].length)
        .setValues(data2D);
      // Bold the header row
      sheet
        .getRange(startRow, startCol, 1, data2D[0].length)
        .setFontWeight("bold");
    }
  } else {
    // New sheet
    var name = wb_sanitizeSheetName_(options.sheetName || "WB_Data");
    name = wb_ensureUniqueSheetName_(ss, name);
    sheet = ss.insertSheet(name);

    var writeRow = 1;

    if (options.includeMetadata && options.metaInfo) {
      var metaRow = wb_buildMetaRow_(options.metaInfo, data2D[0].length);
      sheet.getRange(1, 1, 1, metaRow.length).setValues([metaRow]);
      sheet
        .getRange(1, 1, 1, metaRow.length)
        .setFontColor("#888888")
        .setFontSize(9)
        .setFontStyle("italic");
      writeRow = 2;
    }

    if (data2D.length > 0 && data2D[0].length > 0) {
      sheet
        .getRange(writeRow, 1, data2D.length, data2D[0].length)
        .setValues(data2D);
      // Bold the header row
      sheet.getRange(writeRow, 1, 1, data2D[0].length).setFontWeight("bold");
      // Freeze header row
      sheet.setFrozenRows(writeRow);
    }

    // Auto-resize columns (limit to 26 to avoid long delays)
    var colCount = Math.min(data2D[0].length, 26);
    for (var c = 1; c <= colCount; c++) {
      sheet.autoResizeColumn(c);
    }

    // Activate the new sheet
    ss.setActiveSheet(sheet);
  }
}

// ---------------------------------------------------------------------------
// Reference sheet writer (Quick Ref tab)
// ---------------------------------------------------------------------------

/**
 * Write a reference table to a new sheet.
 *
 * @param {string} type  — 'countries' | 'topics' | 'sources' | 'regions' | 'indicators'
 * @param {string} [query]  — search query for indicators
 */
function wb_writeReferenceSheet(type, query) {
  var data2D;
  var sheetName;

  switch (type) {
    case "countries":
      data2D = wb_buildCountryRefTable_();
      sheetName = "WB_Ref_Countries";
      break;
    case "topics":
      data2D = wb_buildTopicRefTable_();
      sheetName = "WB_Ref_Topics";
      break;
    case "sources":
      data2D = wb_buildSourceRefTable_();
      sheetName = "WB_Ref_Sources";
      break;
    case "regions":
      data2D = wb_buildRegionRefTable_();
      sheetName = "WB_Ref_Regions";
      break;
    case "indicators":
      data2D = wb_buildIndicatorRefTable_(query);
      sheetName =
        "WB_Ref_Indicators" + (query ? "_" + query.substring(0, 20) : "");
      break;
    case "all_indicators":
      data2D = wb_buildAllIndicatorRefTable_();
      sheetName = "WB_Ref_All_Indicators";
      break;
    default:
      throw new Error("Unknown reference type: " + type);
  }

  wb_writeDataToSheet(data2D, {
    destination: "new",
    sheetName: sheetName,
    includeMetadata: false,
  });
}

// ---------------------------------------------------------------------------
// Reference table builders
// ---------------------------------------------------------------------------

function wb_buildCountryRefTable_() {
  var countries = wb_getCountries();
  var rows = [
    [
      "Code",
      "ISO2",
      "Name",
      "Region",
      "Income Level",
      "Lending Type",
      "Capital City",
      "Aggregate",
    ],
  ];
  countries.forEach(function (c) {
    rows.push([
      c.id,
      c.iso2Code,
      c.name,
      c.region,
      c.incomeLevel,
      c.lendingType,
      c.capitalCity,
      c.isAggregate ? "Yes" : "No",
    ]);
  });
  return rows;
}

function wb_buildTopicRefTable_() {
  var topics = wb_getTopics();
  var rows = [["ID", "Name", "Description"]];
  topics.forEach(function (t) {
    rows.push([t.id, t.name, t.sourceNote]);
  });
  return rows;
}

function wb_buildSourceRefTable_() {
  var sources = wb_getSources();
  var rows = [["ID", "Name", "Description", "Last Updated"]];
  sources.forEach(function (s) {
    rows.push([s.id, s.name, s.description, s.lastUpdated]);
  });
  return rows;
}

function wb_buildRegionRefTable_() {
  var regions = wb_getRegions();
  var rows = [["Code", "Name"]];
  regions.forEach(function (r) {
    rows.push([r.id, r.name]);
  });
  return rows;
}

function wb_buildIndicatorRefTable_(query) {
  var indicators = wb_searchIndicators(query || "GDP");
  var rows = [["Code", "Name", "Source Note", "Source Organization"]];
  indicators.forEach(function (ind) {
    rows.push([ind.id, ind.name, ind.sourceNote, ind.sourceOrganization]);
  });
  if (rows.length === 1) {
    rows.push(['No indicators found for "' + (query || "") + '"', "", "", ""]);
  }
  return rows;
}

function wb_buildAllIndicatorRefTable_() {
  var indicators = wb_getAllIndicatorsCached_();
  var rows = [["Code", "Name", "Source Note", "Source Organization"]];
  indicators.forEach(function (ind) {
    rows.push([
      ind.id,
      ind.name,
      ind.sourceNote || "",
      ind.sourceOrganization || "",
    ]);
  });
  if (rows.length === 1) {
    rows.push(["No indicators found", "", "", ""]);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a metadata row summarising the fetch parameters.
 */
function wb_buildMetaRow_(metaInfo, colCount) {
  var parts = [];
  parts.push("Indicators: " + (metaInfo.indicators || []).join(", "));
  if (metaInfo.timeMode === "range") {
    parts.push("Period: " + metaInfo.startYear + "–" + metaInfo.endYear);
  } else {
    parts.push("MRV: " + (metaInfo.mrvCount || 1));
  }
  parts.push("Format: " + (metaInfo.format || "long"));
  parts.push("Fetched: " + new Date().toISOString());

  var text = parts.join("  |  ");
  var row = [text];
  // Pad remaining columns with empty strings
  for (var i = 1; i < colCount; i++) {
    row.push("");
  }
  return row;
}

/**
 * Remove characters that are invalid in sheet names.
 */
function wb_sanitizeSheetName_(name) {
  return name.replace(/[\\\/\?\*\[\]]/g, "_").substring(0, 80);
}

/**
 * Ensure the sheet name is unique by appending a counter if needed.
 */
function wb_ensureUniqueSheetName_(ss, name) {
  var existing = ss.getSheets().map(function (s) {
    return s.getName();
  });
  if (existing.indexOf(name) === -1) return name;

  for (var i = 2; i <= 999; i++) {
    var candidate = name + " (" + i + ")";
    if (existing.indexOf(candidate) === -1) return candidate;
  }
  return name + "_" + Date.now();
}
