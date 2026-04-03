/**
 * BIS_Code.gs — Bridge functions for BIS sidebar (called via google.script.run)
 */

function bis_getDataflows() {
  return BisApi.getDataflows();
}

function bis_getDataflowStructure(dataflowId) {
  return BisApi.getDataflowStructure(dataflowId);
}

function bis_getDataflowAvailability(dataflowId) {
  var json = BisApi.checkAvailability(dataflowId);
  return SdmxParser.parseAvailabilityResponse(json);
}

function bis_fetchBisData(dataflowId, key, options) {
  var xmlText = BisApi.fetchData(dataflowId, key, options);
  var table = SdmxParser.parseXmlDataToTable(xmlText);

  var writeOptions = {
    dataflowId: dataflowId,
    key: key,
    newSheet: options && options.newSheet !== false,
    includeMetadata: options && options.includeMetadata !== false,
  };
  var result = SheetWriter.writeToSheet(table, writeOptions);

  bis_saveRecentQuery_(dataflowId, key, options);

  return result;
}

function bis_getRecentQueries() {
  var stored = PropertiesService.getUserProperties().getProperty("bis_recent");
  return stored ? JSON.parse(stored) : [];
}

function bis_clearBisCache() {
  BisCache.clearAll();
  SpreadsheetApp.getUi().alert("BIS data cache cleared.");
}

function bis_getCategoryConfig() {
  return BIS_CONFIG.CATEGORIES;
}

function bis_exportCodebook(dataflowId) {
  var structure = BisApi.getDataflowStructure(dataflowId);
  var dims = structure.dimensions || [];

  var availMap = {};
  try {
    var json = BisApi.checkAvailability(dataflowId);
    availMap = SdmxParser.parseAvailabilityResponse(json) || {};
  } catch (e) {
    // If availability fails, fall back to all codes from DSD
  }

  var rows = [["DIMENSION", "CODE", "NAME"]];
  for (var d = 0; d < dims.length; d++) {
    var dim = dims[d];
    if (dim.id === "TIME_PERIOD") continue;
    var values = dim.values || [];
    var available = availMap[dim.id];
    for (var v = 0; v < values.length; v++) {
      if (available && available.indexOf(values[v].id) === -1) continue;
      rows.push([
        dim.name ? dim.name + " (" + dim.id + ")" : dim.id,
        values[v].id,
        values[v].name || values[v].id,
      ]);
    }
  }

  return SheetWriter.writeCodebook(rows, dataflowId + "_Codes");
}

function bis_exportDataflows() {
  var dataflows = BisApi.getDataflowsFull();
  var rows = [["ID", "Name", "Description"]];
  for (var i = 0; i < dataflows.length; i++) {
    var df = dataflows[i];
    rows.push([df.id, df.name, df.description || ""]);
  }
  return SheetWriter.writeCodebook(rows, "BIS_Dataflows");
}

function bis_saveRecentQuery_(dataflowId, key, options) {
  var props = PropertiesService.getUserProperties();
  var recent = [];
  var stored = props.getProperty("bis_recent");
  if (stored) {
    try {
      recent = JSON.parse(stored);
    } catch (e) {
      recent = [];
    }
  }
  var entry = {
    dataflowId: dataflowId,
    key: key,
    options: options || {},
    timestamp: new Date().toISOString(),
  };
  recent.unshift(entry);
  if (recent.length > 5) recent = recent.slice(0, 5);
  props.setProperty("bis_recent", JSON.stringify(recent));
}
