// ---------------------------------------------------------------------------
// OECD_Api.gs — Core HTTP handler for OECD SDMX REST API
// ---------------------------------------------------------------------------

var OECD_BASE_URL = "https://sdmx.oecd.org/public/rest";

/**
 * Low-level fetch helper for the OECD SDMX API.
 *
 * @param {string} path        API path after the base URL.
 * @param {Object} [queryParams]  Key-value pairs appended as query string parameters.
 * @param {Object} [headers]   Additional HTTP headers.
 * @returns {Object} Parsed JSON response.
 * @throws {Error} On HTTP errors, rate limits, or network failures.
 * @private
 */
function oecdFetch_(path, queryParams, headers) {
  queryParams = queryParams || {};
  headers = headers || {};

  var queryParts = [];
  for (var key in queryParams) {
    if (
      queryParams[key] !== undefined &&
      queryParams[key] !== null &&
      queryParams[key] !== ""
    ) {
      queryParts.push(
        encodeURIComponent(key) + "=" + encodeURIComponent(queryParams[key]),
      );
    }
  }

  var url = OECD_BASE_URL + "/" + path;
  if (queryParts.length > 0) {
    url += (url.indexOf("?") >= 0 ? "&" : "?") + queryParts.join("&");
  }

  var options = {
    muteHttpExceptions: true,
    headers: headers,
  };

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();

  if (code !== 200) {
    var body = response.getContentText();
    if (code === 429) {
      throw new Error(
        "OECD API rate limit exceeded (max 60 requests/hour). Please wait a moment and try again.",
      );
    }
    if (code === 413) {
      throw new Error(
        "Request too large. Try narrowing your query (fewer countries, shorter time range, or specific indicators).",
      );
    }
    if (code === 404) {
      throw new Error(
        "No data found for this query. Check the dataset ID and dimension selections.",
      );
    }
    if (code === 422) {
      throw new Error("Invalid query: " + body.substring(0, 200));
    }
    var errMsg = "OECD API error (" + code + ")";
    try {
      var errJson = JSON.parse(body);
      if (errJson.message) {
        errMsg += ": " + errJson.message;
      } else {
        errMsg += ": " + body.substring(0, 200);
      }
    } catch (e) {
      errMsg += ": " + body.substring(0, 200);
    }
    throw new Error(errMsg);
  }

  return JSON.parse(response.getContentText());
}

/**
 * Fetch data from the OECD data endpoint (SDMX-JSON format).
 *
 * Uses format=jsondata query parameter to get JSON response.
 *
 * @param {string} path        API path for data query.
 * @param {Object} [queryParams]  Additional query parameters.
 * @returns {Object} Parsed JSON response.
 * @private
 */
function oecdFetchData_(path, queryParams) {
  queryParams = queryParams || {};
  queryParams.format = "jsondata";
  return oecdFetch_(path, queryParams);
}

/**
 * Fetch structure/metadata from the OECD structure endpoint (JSON format).
 *
 * Uses Accept header to request JSON response for structure queries.
 *
 * @param {string} path        API path for structure query.
 * @param {Object} [queryParams]  Additional query parameters.
 * @returns {Object} Parsed JSON response.
 * @private
 */
function oecdFetchStructure_(path, queryParams) {
  return oecdFetch_(path, queryParams, {
    Accept: "application/vnd.sdmx.structure+json",
  });
}

// ---------------------------------------------------------------------------
// Caching layer
// ---------------------------------------------------------------------------

/**
 * Fetch with CacheService caching.
 * Used for structure/metadata endpoints that rarely change.
 *
 * @param {string} fetchType   "data" or "structure" — determines which fetch method to use.
 * @param {string} path        API path.
 * @param {Object} [params]    Query parameters.
 * @param {number} [ttlSecs]   Time-to-live in seconds (default 21600 = 6 hours).
 * @returns {Object} Parsed JSON (from cache or fresh fetch).
 * @private
 */
function oecdFetchCached_(fetchType, path, params, ttlSecs) {
  ttlSecs = ttlSecs || 21600; // 6 hours
  var cache = CacheService.getScriptCache();

  var cacheKey = "oecd_" + path;
  if (params) {
    var sortedKeys = Object.keys(params).sort();
    for (var i = 0; i < sortedKeys.length; i++) {
      var k = sortedKeys[i];
      if (params[k] !== undefined && params[k] !== null && params[k] !== "") {
        cacheKey += "_" + k + "=" + params[k];
      }
    }
  }
  if (cacheKey.length > 250) {
    cacheKey = cacheKey.substring(0, 250);
  }

  var cached = cache.get(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // Corrupt cache entry — fall through to fresh fetch
    }
  }

  var data;
  if (fetchType === "structure") {
    data = oecdFetchStructure_(path, params);
  } else {
    data = oecdFetchData_(path, params);
  }

  try {
    var jsonStr = JSON.stringify(data);
    if (jsonStr.length <= 100000) {
      cache.put(cacheKey, jsonStr, ttlSecs);
    }
  } catch (e) {
    // Cache write failed (too large, etc.) — not critical
  }

  return data;
}
