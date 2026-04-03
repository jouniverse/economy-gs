// ---------------------------------------------------------------------------
// IMF_Structure.gs — Metadata: dataflows, data structures, available codes
// ---------------------------------------------------------------------------

/**
 * Fetch all available IMF dataflows (datasets).
 *
 * Returns a flat array suitable for searching. Results are cached for 6 hours.
 *
 * @returns {Object[]} Array of {id, name, agency, version}.
 */
function imf_getDataflows() {
  var data = imfFetchCached_(
    "structure/dataflow/all/*/+",
    { detail: "allstubs" },
    21600,
  );

  var dataflows = data.data.dataflows || [];
  var result = [];
  for (var i = 0; i < dataflows.length; i++) {
    var df = dataflows[i];
    result.push({
      id: df.id,
      name: df.name || (df.names && df.names.en) || df.id,
      agency: df.agencyID || "",
      version: df.version || "",
    });
  }

  result.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });

  return result;
}

/**
 * Search dataflows by keyword (client-side filter on cached list).
 *
 * @param {string} query  Search term.
 * @returns {Object[]} Matching dataflows.
 */
function imf_searchDataflows(query) {
  var all = imf_getDataflows();
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
 * Lightweight fetch: only gets DSD (no codelists). Used by imf_fetchData()
 * for dimension ordering. For codelist enrichment, see imf_getAllAvailableCodes().
 *
 * @param {string} dataflowId  Dataflow ID (e.g. "CPI").
 * @param {string} [agency]    Agency ID (e.g. "IMF.STA"). If omitted, searches all.
 * @returns {Object} { dimensions: [{id, name, position, type}], agency, dsdId, version }
 */
function imf_getDataStructure(dataflowId, agency) {
  agency = agency || "*";

  var dfData = imfFetchCached_(
    "structure/dataflow/" + agency + "/" + dataflowId + "/+",
    { detail: "full", references: "datastructure" },
    21600,
  );

  var dsds = (dfData.data && dfData.data.dataStructures) || [];
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
  var dataflows = (dfData.data && dfData.data.dataflows) || [];
  if (dataflows.length > 0) {
    resolvedAgency = dataflows[0].agencyID || resolvedAgency;
  }

  return {
    dimensions: dimensions,
    agency: resolvedAgency,
    dsdId: dsd.id,
    version: dsd.version || "+",
  };
}

/**
 * Get available values for a dimension within a dataflow.
 *
 * Uses the /availability endpoint to find which codes actually have data,
 * optionally filtered by already-selected dimension values.
 *
 * @param {string} dataflowId   Dataflow ID (e.g. "CPI").
 * @param {string} agency       Agency ID (e.g. "IMF.STA").
 * @param {string} componentId  Dimension to get values for (e.g. "COUNTRY").
 * @param {string} [key]        Partial key filter (default "*" = all).
 * @returns {string[]} Array of available code values.
 */
function imf_getAvailableCodes(dataflowId, agency, componentId, key) {
  key = key || "*";

  var path =
    "availability/dataflow/" +
    agency +
    "/" +
    dataflowId +
    "/+/" +
    key +
    "/" +
    componentId;

  var data = imfFetchCached_(path, { mode: "available" }, 3600);

  var constraints = (data.data && data.data.dataConstraints) || [];
  if (constraints.length === 0) return [];

  var cubeRegions = constraints[0].cubeRegions || [];
  if (cubeRegions.length === 0) return [];

  var components = cubeRegions[0].components || [];
  for (var i = 0; i < components.length; i++) {
    if (components[i].id === componentId) {
      var values = components[i].values || [];
      return values.map(function (v) {
        return v.value || v.id || "";
      });
    }
  }

  return [];
}

/**
 * Get available values for ALL dimensions of a dataflow at once.
 *
 * Returns objects with {id, name} where name comes from codelist lookup.
 * Fetches individual codelists (cached) rather than the full DSD with
 * references=all, which can be 2–7 MB and is too large to cache.
 *
 * @param {string} dataflowId  Dataflow ID.
 * @param {string} agency      Agency ID.
 * @returns {Object} Map of dimensionId → [{id, name}] of available codes.
 */
function imf_getAllAvailableCodes(dataflowId, agency) {
  var path = "availability/dataflow/" + agency + "/" + dataflowId + "/+/*/*";

  var data;
  try {
    data = imfFetchCached_(path, { mode: "available" }, 3600);
  } catch (e) {
    return {};
  }

  var constraints = (data.data && data.data.dataConstraints) || [];
  if (constraints.length === 0) return {};

  var cubeRegions = constraints[0].cubeRegions || [];
  if (cubeRegions.length === 0) return {};

  var result = {};
  var components = cubeRegions[0].components || [];
  for (var i = 0; i < components.length; i++) {
    var comp = components[i];
    var nameMap = imf_resolveAndFetchCodelist_(comp.id, dataflowId);

    result[comp.id] = (comp.values || []).map(function (v) {
      var code = v.value || v.id || "";
      var name = (nameMap && nameMap[code]) || code;
      return { id: code, name: name };
    });
  }

  return result;
}

/**
 * Fetch a single codelist and return a compact {codeId: name} map.
 *
 * The extracted map is cached (6 hours). Raw API responses for individual
 * codelists are typically 1–200 KB; the extracted map is much smaller
 * (usually under 50 KB), fitting within CacheService's 100 KB limit.
 *
 * @param {string} codelistId  Codelist ID (e.g. "CL_COUNTRY").
 * @returns {Object|null} Map of {codeId: name} or null if not found.
 * @private
 */
function imf_fetchCodelistMap_(codelistId) {
  var cache = CacheService.getScriptCache();
  var cacheKey = "imf_cl_" + codelistId;

  var cached = cache.get(cacheKey);
  if (cached) {
    if (cached === "null") return null;
    try {
      return JSON.parse(cached);
    } catch (e) {
      // Corrupt cache entry — fall through
    }
  }

  var responseData;
  try {
    responseData = imfFetch_("structure/codelist/*/" + codelistId + "/+", {});
  } catch (e) {
    try {
      cache.put(cacheKey, "null", 21600);
    } catch (ignore) {}
    return null;
  }

  var codelists = (responseData.data && responseData.data.codelists) || [];
  if (codelists.length === 0) {
    try {
      cache.put(cacheKey, "null", 21600);
    } catch (ignore) {}
    return null;
  }

  var codes = codelists[0].codes || [];
  var map = {};
  for (var i = 0; i < codes.length; i++) {
    map[codes[i].id] = codes[i].name || codes[i].id;
  }

  try {
    var jsonStr = JSON.stringify(map);
    if (jsonStr.length <= 100000) {
      cache.put(cacheKey, jsonStr, 21600);
    }
  } catch (e) {
    // Cache write failed — not critical
  }

  return map;
}

/**
 * Resolve and fetch the codelist for a given dimension.
 *
 * Tries multiple naming conventions in priority order:
 * 1. CL_{dataflowId}_{dimId} (dataset-specific)
 * 2. CL_{dimId} (generic)
 * 3. Known remappings (e.g. FREQUENCY → CL_FREQ)
 *
 * @param {string} dimId        Dimension ID (e.g. "INDICATOR").
 * @param {string} [dataflowId] Dataflow ID for dataset-specific lookup.
 * @returns {Object|null} Map of {codeId: name} or null if no codelist found.
 * @private
 */
function imf_resolveAndFetchCodelist_(dimId, dataflowId) {
  var remap = {
    FREQUENCY: "CL_FREQ",
    COUNTRY: "CL_COUNTRY",
    COUNTERPART_COUNTRY: "CL_COUNTRY",
    INDEX_TYPE: "CL_INDEX_TYPE",
    TYPE_OF_TRANSFORMATION: "CL_TRANSFORMATION",
    UNIT: "CL_UNIT",
    SECTOR: "CL_SECTOR",
    BOP_ACCOUNTING_ENTRY: "CL_ACCOUNTING_ENTRY",
    DATA_TRANSFORMATION: "CL_TRANSFORMATION",
    PRICE_TYPE: "CL_PRICES",
  };

  var candidates = [];
  var seen = {};
  if (dataflowId) {
    var dsSpecific = "CL_" + dataflowId + "_" + dimId;
    candidates.push(dsSpecific);
    seen[dsSpecific] = true;
  }
  var generic = "CL_" + dimId;
  if (!seen[generic]) {
    candidates.push(generic);
    seen[generic] = true;
  }
  if (remap[dimId] && !seen[remap[dimId]]) {
    candidates.push(remap[dimId]);
  }

  for (var i = 0; i < candidates.length; i++) {
    var map = imf_fetchCodelistMap_(candidates[i]);
    if (map) return map;
  }

  return null;
}

/**
 * Export all dataflows to a sheet.
 *
 * @returns {string} Status message.
 */
function imf_exportDataflows() {
  var dataflows = imf_getDataflows();
  var data = [["ID", "Name", "Agency", "Version"]];
  for (var i = 0; i < dataflows.length; i++) {
    var df = dataflows[i];
    data.push([df.id, df.name, df.agency, df.version]);
  }
  return imf_writeListToSheet_(data, "IMF Dataflows");
}

/**
 * Write a codebook sheet for an Explorer dataset.
 *
 * Lists every available dimension code and its human-readable name.
 * Called from the sidebar "Export Codes to Sheet" button.
 *
 * @param {string} dataflowId    Dataflow ID.
 * @param {string} agency        Agency ID.
 * @param {string} dataflowName  Human-readable name (used in status message).
 * @returns {string} Status message.
 */
function imf_writeExplorerCodebook(dataflowId, agency, dataflowName) {
  var allCodes = imf_getAllAvailableCodes(dataflowId, agency);

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

  var sheetName = dataflowId + " Codes";
  return imf_writeListToSheet_(rows, sheetName);
}
