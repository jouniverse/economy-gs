/**
 * Cached reference data for WTO Timeseries UI (CacheService).
 */

var WTO_CACHE_SECONDS = 6 * 60 * 60; // 6 hours

function wtoCacheGet_(key) {
  return CacheService.getScriptCache().get(key);
}

function wtoCachePut_(key, jsonString) {
  try {
    CacheService.getScriptCache().put(key, jsonString, WTO_CACHE_SECONDS);
  } catch (e) {
    /* cache size limit — ignore */
  }
}

function wto_getTopics() {
  var key = "wto_topics_v1";
  var c = wtoCacheGet_(key);
  if (c) {
    return JSON.parse(c);
  }
  var data = wtoFetchJson_("/topics", { lang: 1 }, false);
  wtoCachePut_(key, JSON.stringify(data));
  return data;
}

function wto_getFrequencies() {
  var key = "wto_frequencies_v1";
  var c = wtoCacheGet_(key);
  if (c) {
    return JSON.parse(c);
  }
  var data = wtoFetchJson_("/frequencies", { lang: 1 }, false);
  wtoCachePut_(key, JSON.stringify(data));
  return data;
}

function wto_getIndicatorCategories() {
  var key = "wto_indicator_categories_v1";
  var c = wtoCacheGet_(key);
  if (c) {
    return JSON.parse(c);
  }
  var data = wtoFetchJson_("/indicator_categories", { lang: 1 }, false);
  wtoCachePut_(key, JSON.stringify(data));
  return data;
}

function wto_getYears() {
  var key = "wto_years_v1";
  var c = wtoCacheGet_(key);
  if (c) {
    return JSON.parse(c);
  }
  var data = wtoFetchJson_("/years", {}, false);
  wtoCachePut_(key, JSON.stringify(data));
  return data;
}

/**
 * @returns {Array<{code:string,name:string}>}
 */
function wto_getReporters() {
  var key = "wto_reporters_all_v1";
  var c = wtoCacheGet_(key);
  if (c) {
    return JSON.parse(c);
  }
  var data = wtoFetchJson_("/reporters", { lang: 1 }, false);
  wtoCachePut_(key, JSON.stringify(data));
  return data;
}

/**
 * @returns {Array<{code:string,name:string}>}
 */
function wto_getPartners() {
  var key = "wto_partners_all_v1";
  var c = wtoCacheGet_(key);
  if (c) {
    return JSON.parse(c);
  }
  var data = wtoFetchJson_("/partners", { lang: 1 }, false);
  wtoCachePut_(key, JSON.stringify(data));
  return data;
}

/**
 * Search indicators (pass-through to API with filters).
 * @param {Object} filters - name, t, pc, tp, frq, lang
 */
function wto_searchIndicators(filters) {
  var q = { lang: 1, i: "all" };
  if (filters) {
    if (filters.name && String(filters.name).trim() !== "") {
      q.name = String(filters.name).trim();
    }
    if (filters.t != null && filters.t !== "") {
      q.t = filters.t;
    }
    if (filters.pc != null && filters.pc !== "") {
      q.pc = filters.pc;
    }
    if (filters.tp != null && filters.tp !== "") {
      q.tp = filters.tp;
    }
    if (filters.frq != null && filters.frq !== "") {
      q.frq = filters.frq;
    }
  }
  return wtoFetchJson_("/indicators", q, false);
}

/**
 * Full indicator list for export and Quick Fetch resolution (cached).
 */
function wto_fetchAllIndicatorsForExport() {
  var key = "wto_indicators_all_export_v1";
  var c = wtoCacheGet_(key);
  if (c) {
    return JSON.parse(c);
  }
  var data = wtoFetchJson_("/indicators", { i: "all", lang: 1 }, false);
  wtoCachePut_(key, JSON.stringify(data));
  return data;
}

/**
 * All products/sectors (large list; not cached in CacheService).
 */
function wto_fetchAllProductsForExport() {
  return wtoFetchJson_("/products", { pc: "all", lang: 1 }, false);
}

function clearWtoMetadataCache() {
  var cache = CacheService.getScriptCache();
  [
    "wto_topics_v1",
    "wto_frequencies_v1",
    "wto_indicator_categories_v1",
    "wto_years_v1",
    "wto_reporters_all_v1",
    "wto_partners_all_v1",
    "wto_indicators_all_export_v1",
  ].forEach(function (k) {
    cache.remove(k);
  });
}
