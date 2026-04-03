/**
 * WORLD_BANK_Api.gs — Core HTTP layer for the World Bank Indicators API v2.
 *
 * Handles URL construction, single & paginated fetches, URL-length chunking,
 * and structured error responses.
 */

var WB_API_BASE = "https://api.worldbank.org/v2";
var WB_PER_PAGE = 1000;
var WB_MAX_URL_LENGTH = 1400;
var WB_RATE_LIMIT_PAUSE = 200; // ms between paginated batches

// ---------------------------------------------------------------------------
// URL construction
// ---------------------------------------------------------------------------

/**
 * Build a full World Bank API URL.
 *
 * @param {string} resource  — path after the base, e.g. 'country/all' or 'indicator'
 * @param {Object} [params]  — additional query-string parameters
 * @return {string} The complete URL.
 */
function wb_buildUrl(resource, params) {
  var url = WB_API_BASE + "/" + resource;
  var qs = [];
  qs.push("format=json");
  qs.push("per_page=" + WB_PER_PAGE);
  if (params) {
    var keys = Object.keys(params);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      if (params[k] !== null && params[k] !== undefined && params[k] !== "") {
        qs.push(encodeURIComponent(k) + "=" + encodeURIComponent(params[k]));
      }
    }
  }
  return url + "?" + qs.join("&");
}

// ---------------------------------------------------------------------------
// Single fetch
// ---------------------------------------------------------------------------

/**
 * Fetch a single URL and return parsed JSON.
 * Returns { header, data } where header is the pagination metadata
 * and data is the array of records (or null on error).
 *
 * @param {string} url
 * @return {Object} { header: Object|null, data: Array|null, error: string|null }
 */
function wbFetch(url) {
  try {
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var code = response.getResponseCode();

    if (code !== 200) {
      return {
        header: null,
        data: null,
        error:
          "HTTP " + code + ": " + response.getContentText().substring(0, 200),
      };
    }

    var json = JSON.parse(response.getContentText());

    // The WB API wraps responses in [headerObj, dataArray]
    if (Array.isArray(json) && json.length === 2) {
      var header = json[0];
      var data = json[1];

      // Check for API-level error messages
      if (header && header.message) {
        var msgs = header.message;
        var errText = Array.isArray(msgs)
          ? msgs
              .map(function (m) {
                return m.value || m.key || "";
              })
              .join("; ")
          : String(msgs);
        return { header: header, data: null, error: errText };
      }

      return { header: header, data: data || [], error: null };
    }

    // Some endpoints (e.g. /source) return a simple array
    if (Array.isArray(json)) {
      return { header: null, data: json, error: null };
    }

    return {
      header: null,
      data: null,
      error: "Unexpected API response format.",
    };
  } catch (e) {
    return { header: null, data: null, error: e.message || String(e) };
  }
}

// ---------------------------------------------------------------------------
// Paginated fetch
// ---------------------------------------------------------------------------

/**
 * Fetch all pages for a given resource and return the combined data array.
 *
 * @param {string} resource  — API path, e.g. 'country/USA/indicator/SP.POP.TOTL'
 * @param {Object} [params]  — extra query-string params (date, mrv, …)
 * @return {Object} { data: Array, error: string|null, total: number }
 */
function wbFetchAll(resource, params) {
  var url = wb_buildUrl(resource, params);

  // First page
  var result = wbFetch(url);
  if (result.error) {
    return { data: [], error: result.error, total: 0 };
  }

  var allData = result.data || [];
  var header = result.header;

  if (!header || !header.pages || header.pages <= 1) {
    return { data: allData, error: null, total: allData.length };
  }

  var totalPages = parseInt(header.pages, 10);

  // Build URLs for remaining pages
  var remainingUrls = [];
  for (var p = 2; p <= totalPages; p++) {
    var pageParams = params ? JSON.parse(JSON.stringify(params)) : {};
    pageParams.page = p;
    remainingUrls.push(wb_buildUrl(resource, pageParams));
  }

  // Fetch remaining pages in batches of 5 (to avoid overwhelming the API)
  var BATCH_SIZE = 5;
  for (var b = 0; b < remainingUrls.length; b += BATCH_SIZE) {
    var batch = remainingUrls.slice(b, b + BATCH_SIZE);
    var requests = batch.map(function (u) {
      return { url: u, muteHttpExceptions: true };
    });

    var responses = UrlFetchApp.fetchAll(requests);

    for (var r = 0; r < responses.length; r++) {
      if (responses[r].getResponseCode() === 200) {
        try {
          var json = JSON.parse(responses[r].getContentText());
          if (
            Array.isArray(json) &&
            json.length === 2 &&
            Array.isArray(json[1])
          ) {
            allData = allData.concat(json[1]);
          }
        } catch (_) {
          // Skip unparseable pages
        }
      }
    }

    // Rate-limit pause between batches
    if (b + BATCH_SIZE < remainingUrls.length) {
      Utilities.sleep(WB_RATE_LIMIT_PAUSE);
    }
  }

  return { data: allData, error: null, total: allData.length };
}

// ---------------------------------------------------------------------------
// Chunked fetch (for very long country lists that exceed URL length)
// ---------------------------------------------------------------------------

/**
 * Fetch indicator data, automatically chunking the country parameter
 * if the URL would exceed the safe length.
 *
 * @param {string} resource     — e.g. 'country/{codes}/indicator/{id}'
 * @param {string} countryCodes — semicolon-separated codes
 * @param {Object} [params]
 * @return {Object} { data: Array, error: string|null, total: number }
 */
function wbFetchChunked(resource, countryCodes, params) {
  // Try building URL — if short enough, do a single fetch
  var testResource = resource.replace("{countries}", countryCodes);
  var testUrl = wb_buildUrl(testResource, params);

  if (testUrl.length <= WB_MAX_URL_LENGTH) {
    return wbFetchAll(testResource, params);
  }

  // Split country codes into chunks
  var codes = countryCodes.split(";");
  var allData = [];
  var lastError = null;

  // Binary-split approach: halve the list until URLs fit
  var chunks = wb_splitToFitUrl_(codes, resource, params);

  for (var i = 0; i < chunks.length; i++) {
    var chunkResource = resource.replace("{countries}", chunks[i].join(";"));
    var result = wbFetchAll(chunkResource, params);
    if (result.error) {
      lastError = result.error;
    }
    if (result.data) {
      allData = allData.concat(result.data);
    }
    if (i < chunks.length - 1) {
      Utilities.sleep(WB_RATE_LIMIT_PAUSE);
    }
  }

  return { data: allData, error: lastError, total: allData.length };
}

/**
 * Split an array of country codes into chunks that each produce
 * a URL within the safe length limit.
 */
function wb_splitToFitUrl_(codes, resource, params) {
  var testResource = resource.replace("{countries}", codes.join(";"));
  var testUrl = wb_buildUrl(testResource, params);

  if (testUrl.length <= WB_MAX_URL_LENGTH || codes.length <= 1) {
    return [codes];
  }

  var mid = Math.ceil(codes.length / 2);
  var left = codes.slice(0, mid);
  var right = codes.slice(mid);

  return wb_splitToFitUrl_(left, resource, params).concat(
    wb_splitToFitUrl_(right, resource, params),
  );
}
