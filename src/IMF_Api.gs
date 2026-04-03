// ---------------------------------------------------------------------------
// IMF_Api.gs — Core HTTP handler for IMF SDMX 3.0 API
// ---------------------------------------------------------------------------

var IMF_BASE_URL = "https://api.imf.org/external/sdmx/3.0";

/**
 * Low-level fetch helper for the IMF SDMX API.
 *
 * @param {string} path  API path after the base URL (e.g. "data/dataflow/IMF.STA/CPI/+/USA.*.*.*.*").
 * @param {Object} [queryParams]  Key-value pairs appended as query string parameters.
 * @returns {Object} Parsed JSON response.
 * @throws {Error} On HTTP errors, rate limits, or network failures.
 * @private
 */
function imfFetch_(path, queryParams) {
  queryParams = queryParams || {};

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

  var url = IMF_BASE_URL + "/" + path;
  if (queryParts.length > 0) {
    url += "?" + queryParts.join("&");
  }

  var options = {
    muteHttpExceptions: true,
    headers: {
      Accept: "application/json",
    },
  };

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();

  if (code !== 200) {
    var body = response.getContentText();
    if (code === 429) {
      throw new Error(
        "IMF API rate limit exceeded. Please wait a moment and try again.",
      );
    }
    var errMsg = "IMF API error (" + code + ")";
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

// ---------------------------------------------------------------------------
// Caching layer
// ---------------------------------------------------------------------------

/**
 * Fetch with CacheService caching.
 * Used for structure/metadata endpoints that rarely change.
 *
 * @param {string} path       API path.
 * @param {Object} [params]   Query parameters.
 * @param {number} [ttlSecs]  Time-to-live in seconds (default 21600 = 6 hours).
 * @returns {Object} Parsed JSON (from cache or fresh fetch).
 * @private
 */
function imfFetchCached_(path, params, ttlSecs) {
  ttlSecs = ttlSecs || 21600; // 6 hours
  var cache = CacheService.getScriptCache();

  var cacheKey = "imf_" + path;
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

  var data = imfFetch_(path, params);

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
