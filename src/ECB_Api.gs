// ---------------------------------------------------------------------------
// ECB_API.gs — Core HTTP handler for ECB SDMX 2.1 API
// ---------------------------------------------------------------------------

var ECB_BASE_URL = "https://data-api.ecb.europa.eu/service/";

/**
 * Low-level fetch helper for the ECB SDMX API.
 *
 * @param {string} path          API path after the base URL (e.g. "data/EXR/D.USD.EUR.SP00.A").
 * @param {Object} [queryParams] Key-value pairs appended as query string.
 * @param {string} [accept]      Accept header value. Defaults to JSON for data.
 * @returns {HTTPResponse} Raw response object.
 * @throws {Error} On HTTP errors.
 * @private
 */
function ecbFetch_(path, queryParams, accept) {
  queryParams = queryParams || {};
  accept = accept || "application/vnd.sdmx.data+json;version=1.0.0-wd";

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

  var url = ECB_BASE_URL + path;
  if (queryParts.length > 0) {
    url += (url.indexOf("?") >= 0 ? "&" : "?") + queryParts.join("&");
  }

  var options = {
    muteHttpExceptions: true,
    headers: {
      Accept: accept,
      "Accept-Encoding": "gzip, deflate",
    },
  };

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();

  if (code === 200) {
    return response;
  }

  var body = response.getContentText();
  if (code === 404) {
    throw new Error("No data found (HTTP 404). Try different selections.");
  }
  if (code === 429) {
    throw new Error(
      "ECB API rate limit exceeded. Please wait a moment and try again.",
    );
  }
  if (code === 413 || code === 503) {
    throw new Error(
      "Response too large (HTTP " + code + "). Try narrowing your query.",
    );
  }

  var errMsg = "ECB API error (" + code + ")";
  try {
    // Try XML error parsing
    var doc = XmlService.parse(body);
    var root = doc.getRootElement();
    var text = root.getValue();
    if (text) errMsg += ": " + text.substring(0, 200);
  } catch (e) {
    errMsg += ": " + body.substring(0, 200);
  }
  throw new Error(errMsg);
}

// ---------------------------------------------------------------------------
// Convenience wrappers
// ---------------------------------------------------------------------------

/**
 * Fetch JSON data from the ECB API.
 *
 * @param {string} path          API path.
 * @param {Object} [queryParams] Query parameters.
 * @returns {Object} Parsed JSON response.
 * @private
 */
function ecbFetchJson_(path, queryParams) {
  var response = ecbFetch_(
    path,
    queryParams,
    "application/vnd.sdmx.data+json;version=1.0.0-wd",
  );
  return JSON.parse(response.getContentText());
}

/**
 * Fetch XML metadata from the ECB API.
 *
 * @param {string} path          API path.
 * @param {Object} [queryParams] Query parameters.
 * @returns {GoogleAppsScript.XML_Service.Document} Parsed XML document.
 * @private
 */
function ecbFetchXml_(path, queryParams) {
  var response = ecbFetch_(
    path,
    queryParams,
    "application/vnd.sdmx.structure+xml;version=2.1",
  );
  return XmlService.parse(response.getContentText());
}

// ---------------------------------------------------------------------------
// Caching layer
// ---------------------------------------------------------------------------

/**
 * Fetch with CacheService caching.
 *
 * @param {string} path       API path.
 * @param {Object} [params]   Query parameters.
 * @param {string} [accept]   Accept header.
 * @param {number} [ttlSecs]  Time-to-live in seconds (default 21600 = 6 hours).
 * @returns {string} Raw response text (caller must parse).
 * @private
 */
function ecbFetchCached_(path, params, accept, ttlSecs) {
  ttlSecs = ttlSecs || 21600;
  var cache = CacheService.getScriptCache();

  // Build a cache key from path + sorted params
  var cacheKey = "ecb_" + path;
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
    return cached;
  }

  var response = ecbFetch_(path, params, accept);
  var text = response.getContentText();

  try {
    if (text.length <= 100000) {
      cache.put(cacheKey, text, ttlSecs);
    }
  } catch (e) {
    // Cache write failed — not critical
  }

  return text;
}

/**
 * Fetch XML with caching, returns parsed Document.
 *
 * @param {string} path       API path.
 * @param {Object} [params]   Query parameters.
 * @param {number} [ttlSecs]  TTL in seconds.
 * @returns {GoogleAppsScript.XML_Service.Document}
 * @private
 */
function ecbFetchXmlCached_(path, params, ttlSecs) {
  var text = ecbFetchCached_(
    path,
    params,
    "application/vnd.sdmx.structure+xml;version=2.1",
    ttlSecs,
  );
  return XmlService.parse(text);
}
