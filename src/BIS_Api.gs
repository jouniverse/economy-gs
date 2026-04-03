/**
 * BisApi.gs — API client for BIS SDMX REST API v2
 */

var BisApi = (function () {
  var BASE = BIS_CONFIG.API_BASE;

  /**
   * Fetch all available BIS dataflows.
   * @return {Array<{id:string, name:string, version:string}>}
   */
  function getDataflows() {
    var cacheKey = "bis_dataflows";
    var cached = BisCache.get(cacheKey);
    if (cached) return cached;

    var url =
      BASE + "/structure/dataflow/" + BIS_CONFIG.AGENCY + "/*/?detail=allstubs";
    var json = fetchJson_(url, BIS_CONFIG.ACCEPT_STRUCTURE);
    var dataflows = SdmxParser.parseDataflowList(json);

    BisCache.put(cacheKey, dataflows);
    return dataflows;
  }

  /**
   * Fetch structure (dimensions + codelists) for a specific dataflow.
   * @param {string} dataflowId  e.g. "CBPOL"
   * @return {{dimensions: Array, attributes: Array, dataflowName: string}}
   */
  function getDataflowStructure(dataflowId) {
    var cacheKey = "bis_structure_" + dataflowId;
    var cached = BisCache.get(cacheKey);
    if (cached) return cached;

    var url =
      BASE +
      "/structure/dataflow/" +
      BIS_CONFIG.AGENCY +
      "/" +
      encodeURIComponent(dataflowId) +
      "/~?detail=full&references=descendants";
    var json = fetchJson_(url, BIS_CONFIG.ACCEPT_STRUCTURE);
    var structure = SdmxParser.parseStructureResponse(json);

    BisCache.put(cacheKey, structure);
    return structure;
  }

  /**
   * Fetch data for a dataflow with given key and options.
   * Returns raw XML text (BIS API returns SDMX-ML StructureSpecific).
   * @param {string} dataflowId
   * @param {string} key  e.g. "A.US.." — SDMX dimension key with wildcards
   * @param {Object} [options]
   * @param {number} [options.lastNObservations]
   * @param {string} [options.startPeriod]
   * @param {string} [options.endPeriod]
   * @return {string} raw XML response text
   */
  function fetchData(dataflowId, key, options) {
    options = options || {};
    var safeKey = key || "*";

    var url =
      BASE +
      "/data/dataflow/" +
      BIS_CONFIG.AGENCY +
      "/" +
      encodeURIComponent(dataflowId) +
      "/~/" +
      safeKey;

    var params = [];
    var lastN = options.lastNObservations;
    if (lastN) {
      params.push("lastNObservations=" + lastN);
    }

    if (options.startPeriod) {
      params.push("startPeriod=" + encodeURIComponent(options.startPeriod));
    }
    if (options.endPeriod) {
      params.push("endPeriod=" + encodeURIComponent(options.endPeriod));
    }

    params.push("detail=full");

    if (params.length > 0) {
      url += "?" + params.join("&");
    }

    return fetchText_(url);
  }

  /**
   * Check data availability for a dataflow.
   * @param {string} dataflowId
   * @param {string} [key]
   * @return {Object} availability response
   */
  function checkAvailability(dataflowId, key) {
    var safeKey = key || "*";
    var url =
      BASE +
      "/availability/dataflow/" +
      BIS_CONFIG.AGENCY +
      "/" +
      encodeURIComponent(dataflowId) +
      "/~/" +
      safeKey +
      "?references=none&mode=available";
    return fetchJson_(url, BIS_CONFIG.ACCEPT_STRUCTURE);
  }

  // ─── Internal ───

  function fetchJson_(url, acceptHeader) {
    var options = {
      method: "get",
      headers: { Accept: acceptHeader },
      muteHttpExceptions: true,
    };

    var response;
    var maxRetries = 2;
    for (var attempt = 0; attempt <= maxRetries; attempt++) {
      response = UrlFetchApp.fetch(url, options);
      var code = response.getResponseCode();

      if (code === 200) {
        return JSON.parse(response.getContentText());
      }

      if (code === 429 && attempt < maxRetries) {
        Utilities.sleep(2000 * (attempt + 1));
        continue;
      }

      if (code === 404) {
        throw new Error(
          "No data found for this query. The dataset or key combination may not exist.",
        );
      }

      if (code >= 500) {
        throw new Error(
          "BIS API server error (" + code + "). Please try again later.",
        );
      }

      throw new Error(
        "BIS API request failed (HTTP " +
          code +
          "): " +
          response.getContentText().substring(0, 200),
      );
    }

    throw new Error("BIS API request failed after retries.");
  }

  function fetchText_(url) {
    var options = {
      method: "get",
      muteHttpExceptions: true,
    };

    var response;
    var maxRetries = 2;
    for (var attempt = 0; attempt <= maxRetries; attempt++) {
      response = UrlFetchApp.fetch(url, options);
      var code = response.getResponseCode();

      if (code === 200) {
        return response.getContentText();
      }

      if (code === 429 && attempt < maxRetries) {
        Utilities.sleep(2000 * (attempt + 1));
        continue;
      }

      if (code === 404) {
        throw new Error(
          "No data found for this query. The dataset or key combination may not exist.",
        );
      }

      if (code >= 500) {
        throw new Error(
          "BIS API server error (" + code + "). Please try again later.",
        );
      }

      throw new Error(
        "BIS API request failed (HTTP " +
          code +
          "): " +
          response.getContentText().substring(0, 200),
      );
    }

    throw new Error("BIS API request failed after retries.");
  }

  /**
   * Fetch all dataflows with full detail (includes descriptions).
   * @return {Array<{id,name,description,version}>}
   */
  function getDataflowsFull() {
    var cacheKey = "bis_dataflows_full";
    var cached = BisCache.get(cacheKey);
    if (cached) return cached;

    var url =
      BASE + "/structure/dataflow/" + BIS_CONFIG.AGENCY + "/*/?detail=full";
    var json = fetchJson_(url, BIS_CONFIG.ACCEPT_STRUCTURE);
    var dataflows = SdmxParser.parseDataflowList(json);

    BisCache.put(cacheKey, dataflows);
    return dataflows;
  }

  return {
    getDataflows: getDataflows,
    getDataflowsFull: getDataflowsFull,
    getDataflowStructure: getDataflowStructure,
    fetchData: fetchData,
    checkAvailability: checkAvailability,
  };
})();
