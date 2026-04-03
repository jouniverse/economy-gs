// ---------------------------------------------------------------------------
// OECD_Structure.gs — Metadata: dataflows, data structures, available codes
// ---------------------------------------------------------------------------

/**
 * Fetch all available OECD dataflows (datasets).
 *
 * Returns a flat array suitable for searching. Results are cached for 6 hours.
 * The OECD API sometimes returns XML instead of JSON for the dataflow/all
 * endpoint, so this function handles both formats.
 *
 * @returns {Object[]} Array of {id, name, agency, version}.
 */
function oecd_getDataflows() {
  var cache = CacheService.getScriptCache();
  var cacheKey = "oecd_dataflows_all";

  var cached = oecd_getChunkedCache_(cache, cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // Corrupt — fall through
    }
  }

  var url = OECD_BASE_URL + "/dataflow/all";
  var response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: { Accept: "application/vnd.sdmx.structure+json" },
  });

  if (response.getResponseCode() !== 200) {
    throw new Error(
      "Failed to fetch dataflow list (HTTP " + response.getResponseCode() + ")",
    );
  }

  var text = response.getContentText();
  var result;

  if (text.charAt(0) === "{") {
    var data = JSON.parse(text);
    var dataflows = (data.data && data.data.dataflows) || [];
    result = [];
    for (var i = 0; i < dataflows.length; i++) {
      var df = dataflows[i];
      result.push({
        id: df.id,
        name: df.name || (df.names && df.names.en) || df.id,
        agency: df.agencyID || "",
        version: df.version || "",
      });
    }
  } else {
    result = oecd_parseDataflowXml_(text);
  }

  result.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });

  try {
    oecd_putChunkedCache_(cache, cacheKey, JSON.stringify(result), 21600);
  } catch (e) {
    // Cache write failed — not critical
  }

  return result;
}

/**
 * Parse dataflow list from SDMX-ML (XML) response.
 * @private
 */
function oecd_parseDataflowXml_(xml) {
  var result = [];
  var dfRegex =
    /<structure:Dataflow\s+id="([^"]+)"\s+agencyID="([^"]+)"\s+version="([^"]+)"[^>]*>([\s\S]*?)<\/structure:Dataflow>/g;
  var nameRegex = /<common:Name[^>]*xml:lang="en"[^>]*>([^<]+)<\/common:Name>/;

  var match;
  while ((match = dfRegex.exec(xml)) !== null) {
    var id = match[1];
    var agency = match[2];
    var version = match[3];
    var body = match[4];

    var nameMatch = nameRegex.exec(body);
    var name = nameMatch ? nameMatch[1] : id;

    result.push({ id: id, name: name, agency: agency, version: version });
  }
  return result;
}

/**
 * Store a large string in CacheService by splitting into 100 KB chunks.
 * @private
 */
function oecd_putChunkedCache_(cache, key, str, ttlSecs) {
  var CHUNK = 99000;
  var chunks = Math.ceil(str.length / CHUNK);
  if (chunks <= 1) {
    cache.put(key, str, ttlSecs);
    return;
  }
  var map = {};
  map[key] = String(chunks);
  for (var i = 0; i < chunks; i++) {
    map[key + "_" + i] = str.substring(i * CHUNK, (i + 1) * CHUNK);
  }
  cache.putAll(map, ttlSecs);
}

/**
 * Retrieve a chunked cache entry written by oecd_putChunkedCache_.
 * @private
 */
function oecd_getChunkedCache_(cache, key) {
  var header = cache.get(key);
  if (!header) return null;
  var n = parseInt(header, 10);
  if (isNaN(n)) return header;
  var parts = [];
  for (var i = 0; i < n; i++) {
    var part = cache.get(key + "_" + i);
    if (part === null) return null;
    parts.push(part);
  }
  return parts.join("");
}

/**
 * Search dataflows by keyword (client-side filter on cached list).
 *
 * @param {string} query  Search term.
 * @returns {Object[]} Matching dataflows.
 */
function oecd_searchDataflows(query) {
  var all = oecd_getDataflows();
  if (!query || !query.trim()) return all;

  var q = query.trim().toLowerCase();
  var words = q.split(/\s+/);

  return all.filter(function (df) {
    var text = (df.id + " " + df.name).toLowerCase();
    return words.every(function (w) {
      return text.indexOf(w) >= 0;
    });
  });
}

/**
 * Get the data structure definition (DSD) for a dataflow.
 *
 * @param {string} dataflowId  Dataflow ID (e.g. "DSD_NAAG@DF_NAAG_I").
 * @param {string} [agency]    Agency ID (e.g. "OECD.SDD.NAD"). Defaults to "all".
 * @returns {Object} { dimensions: [{id, name, position, type}], agency, dsdId, version }
 */
function oecd_getDataStructure(dataflowId, agency) {
  agency = agency || "all";

  var data = oecdFetchCached_(
    "structure",
    "dataflow/" + agency + "/" + dataflowId,
    { references: "datastructure" },
    21600,
  );

  var dsds = (data.data && data.data.dataStructures) || [];
  if (dsds.length === 0) {
    throw new Error("No data structure found for dataflow: " + dataflowId);
  }

  var dsd = dsds[0];
  var dsc = dsd.dataStructureComponents || {};
  var dimList = dsc.dimensionList || {};

  var dimensions = [];
  var dims = dimList.dimensions || [];
  for (var i = 0; i < dims.length; i++) {
    var dim = dims[i];
    dimensions.push({
      id: dim.id,
      name: dim.name || (dim.names && dim.names.en) || dim.id,
      position: dim.position,
      type: dim.type || "Dimension",
    });
  }

  var timeDims = dimList.timeDimensions || [];
  for (var t = 0; t < timeDims.length; t++) {
    var td = timeDims[t];
    dimensions.push({
      id: td.id,
      name: td.name || (td.names && td.names.en) || td.id,
      position: td.position,
      type: "TimeDimension",
    });
  }

  dimensions.sort(function (a, b) {
    return a.position - b.position;
  });

  var resolvedAgency = dsd.agencyID || agency;
  var dataflows = (data.data && data.data.dataflows) || [];
  if (dataflows.length > 0) {
    resolvedAgency = dataflows[0].agencyID || resolvedAgency;
  }

  var resolvedVersion = dsd.version || "+";
  if (dataflows.length > 0 && dataflows[0].version) {
    resolvedVersion = dataflows[0].version;
  }

  return {
    dimensions: dimensions,
    agency: resolvedAgency,
    dsdId: dsd.id,
    version: resolvedVersion,
  };
}

/**
 * Get available values for ALL dimensions of a dataflow at once.
 *
 * Fetches codelists via references=all for name resolution. OECD bundles
 * codelists in a single structure response, unlike IMF's separate availability endpoint.
 *
 * @param {string} dataflowId  Dataflow ID.
 * @param {string} agency      Agency ID.
 * @returns {Object} Map of dimensionId → [{id, name}] of available codes.
 */
function oecd_getAllAvailableCodes(dataflowId, agency) {
  agency = agency || "all";

  var data;
  try {
    data = oecdFetchStructure_("dataflow/" + agency + "/" + dataflowId, {
      references: "all",
    });
  } catch (e) {
    return {};
  }

  var dsds = (data.data && data.data.dataStructures) || [];
  if (dsds.length === 0) return {};

  var dsd = dsds[0];
  var dsc = dsd.dataStructureComponents || {};
  var dimList = dsc.dimensionList || {};

  var rawCodelists = (data.data && data.data.codelists) || [];
  var codelistMap = {};
  for (var c = 0; c < rawCodelists.length; c++) {
    var cl = rawCodelists[c];
    var clKey = cl.id;
    if (cl.agencyID) clKey = cl.agencyID + ":" + cl.id;
    codelistMap[clKey] = cl;
    if (!codelistMap[cl.id]) codelistMap[cl.id] = cl;
  }

  var result = {};
  var dims = dimList.dimensions || [];

  var availableValues = oecd_extractConstraintValues_(data);

  for (var d = 0; d < dims.length; d++) {
    var dim = dims[d];
    var dimId = dim.id;

    var codelist = oecd_findCodelistForOecdDimension_(dim, codelistMap);

    if (codelist) {
      var codes = codelist.codes || [];
      var codeItems = codes.map(function (code) {
        return {
          id: code.id,
          name: code.name || (code.names && code.names.en) || code.id,
        };
      });

      if (availableValues[dimId]) {
        var allowed = availableValues[dimId];
        codeItems = codeItems.filter(function (item) {
          return allowed[item.id];
        });
      }

      codeItems.sort(function (a, b) {
        return a.name.localeCompare(b.name);
      });

      result[dimId] = codeItems;
    } else {
      result[dimId] = [];
    }
  }

  return result;
}

/**
 * Extract available dimension values from content constraints in an API response.
 *
 * The OECD API includes contentConstraints when fetching with references=all.
 * These constraints specify which dimension values actually have data,
 * which is much more useful than showing every codelist value.
 *
 * @param {Object} data  Full API response from references=all.
 * @returns {Object} Map of dimensionId → {valueId: true} for available values.
 * @private
 */
function oecd_extractConstraintValues_(data) {
  var result = {};
  var constraints = (data.data && data.data.contentConstraints) || [];
  if (constraints.length === 0) return result;

  var constraint = constraints[0];
  for (var i = 0; i < constraints.length; i++) {
    if (
      constraints[i].type === "Actual" ||
      (constraints[i].id && constraints[i].id.indexOf("CR_A_") === 0)
    ) {
      constraint = constraints[i];
      break;
    }
  }

  var regions = constraint.cubeRegions || [];
  if (regions.length === 0) return result;

  var keyValues = regions[0].keyValues || [];
  for (var k = 0; k < keyValues.length; k++) {
    var kv = keyValues[k];
    var dimId = kv.id;
    if (dimId === "TIME_PERIOD") continue;
    var vals = kv.values || [];
    if (vals.length > 0) {
      var valueSet = {};
      for (var v = 0; v < vals.length; v++) {
        valueSet[vals[v]] = true;
      }
      result[dimId] = valueSet;
    }
  }

  return result;
}

/**
 * Find the codelist for an OECD dimension.
 *
 * OECD dimensions reference codelists via URN in localRepresentation.enumeration.
 * URN format: urn:sdmx:org.sdmx.infomodel.codelist.Codelist=OECD:CL_AREA(1.1)
 *
 * @private
 */
/**
 * Write a codebook sheet for an Explorer dataset.
 *
 * Called from the sidebar when the user clicks "Export Codes to Sheet"
 * in the dimension filtering view.
 *
 * @param {string} dataflowId  Dataflow ID.
 * @param {string} agency      Agency ID.
 * @param {string} dataflowName  Human-readable name of the dataflow.
 * @returns {string} Status message.
 */
function oecd_writeExplorerCodebook(dataflowId, agency, dataflowName) {
  var allCodes = oecd_getAllAvailableCodes(dataflowId, agency);

  var rows = [["DIMENSION", "CODE", "NAME"]];
  var dimKeys = Object.keys(allCodes);
  dimKeys.sort();

  for (var d = 0; d < dimKeys.length; d++) {
    var dimId = dimKeys[d];
    var codes = allCodes[dimId] || [];
    for (var c = 0; c < codes.length; c++) {
      var code = codes[c];
      rows.push([dimId, code.id, code.name || code.id]);
    }
    if (codes.length === 0) {
      rows.push([dimId, "(all)", "No codelist available"]);
    }
  }

  var shortId = dataflowId.replace(/^DSD_[^@]*@/, "");
  var sheetName = shortId + " Codes";
  return oecd_writeListToSheet_(rows, sheetName);
}

function oecd_findCodelistForOecdDimension_(dim, codelistMap) {
  var lr = dim.localRepresentation;
  if (lr && lr.enumeration) {
    var urn = lr.enumeration;
    var match = urn.match(/=([^:]+):([^(]+)\(([^)]+)\)/);
    if (match) {
      var clAgency = match[1];
      var clId = match[2];
      var fullKey = clAgency + ":" + clId;
      if (codelistMap[fullKey]) return codelistMap[fullKey];
      if (codelistMap[clId]) return codelistMap[clId];
    }
  }

  if (codelistMap["CL_" + dim.id]) return codelistMap["CL_" + dim.id];

  for (var key in codelistMap) {
    if (codelistMap.hasOwnProperty(key) && key.indexOf(dim.id) >= 0) {
      return codelistMap[key];
    }
  }

  return null;
}

/**
 * Export all dataflows to a sheet.
 *
 * @returns {string} Status message.
 */
function oecd_exportDataflows() {
  var dataflows = oecd_getDataflows();
  var data = [["ID", "Name", "Agency", "Version"]];
  for (var i = 0; i < dataflows.length; i++) {
    var df = dataflows[i];
    data.push([df.id, df.name, df.agency, df.version]);
  }
  return oecd_writeListToSheet_(data, "OECD Dataflows");
}
