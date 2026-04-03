/**
 * UN Comtrade Data Fetcher for Google Sheets
 * UN_COMTRADE_Api.gs — API URL construction, fetch wrapper, retry & mirror logic
 */

var COMTRADE_API_BASE = "https://comtradeapi.un.org/";

// ─── URL Construction ───────────────────────────────────────────────────────

/**
 * Build the full API URL from validated parameters.
 * @param {Object} p - Validated parameters.
 * @param {string} apiKey - Subscription key.
 * @returns {string} Full URL.
 */
function comtrade_buildApiUrl_(p, apiKey) {
  var endpoint, path;

  switch (p.mode) {
    case "balance":
      endpoint = "data";
      path = "get";
      break;
    case "bilateral":
      if (p.useBilateralEndpoint) {
        endpoint = "tools";
        path = "getBilateralData";
      } else {
        endpoint = "data";
        path = "get";
      }
      break;
    default:
      endpoint = "data";
      path = "get";
      break;
  }

  var url =
    COMTRADE_API_BASE +
    endpoint +
    "/v1/" +
    path +
    "/" +
    p.typeCode +
    "/" +
    p.freqCode +
    "/" +
    p.clCode;

  // Query parameters
  var params = [];
  params.push("subscription-key=" + encodeURIComponent(apiKey));

  if (p.reporterCode) {
    params.push("reporterCode=" + encodeURIComponent(p.reporterCode));
  }
  if (p.partnerCode) {
    params.push("partnerCode=" + encodeURIComponent(p.partnerCode));
  }
  if (p.period) {
    params.push("period=" + encodeURIComponent(p.period));
  }
  if (p.flowCode) {
    params.push("flowCode=" + encodeURIComponent(p.flowCode));
  }
  if (p.cmdCode) {
    params.push("cmdCode=" + encodeURIComponent(p.cmdCode));
  }
  if (p.includeDesc !== false) {
    params.push("includeDesc=true");
  }

  // Collapse secondary dimensions to avoid duplicate rows (goods only)
  if (path !== "getBilateralData" && p.typeCode === "C") {
    params.push("partner2Code=0");
    params.push("motCode=0");
    params.push("customsCode=C00");
  }

  return url + "?" + params.join("&");
}

// ─── Fetch Functions ────────────────────────────────────────────────────────

/**
 * Fetch data from UN Comtrade API.
 * @param {Object} params - Validated query parameters.
 * @param {string} apiKey - Subscription key.
 * @returns {Object} {data: Array, count: number}
 */
function fetchComtradeData(params, apiKey) {
  var fetchParams = comtrade_buildFetchParams_(params);
  var url = comtrade_buildApiUrl_(fetchParams, apiKey);
  var result = comtrade_executeApiFetch_(url);

  // Mark rows as directly reported for bilateral mode
  if (params.mode === "bilateral" && result.data) {
    for (var i = 0; i < result.data.length; i++) {
      result.data[i]._source = "reported";
    }
  }

  return result;
}

/**
 * Fetch with mirror data fallback for bilateral mode.
 * If direct fetch returns empty and mirror is enabled:
 * swap reporter↔partner, flip flow, mark rows as mirror source.
 */
function comtrade_fetchWithMirror(params, apiKey) {
  // First: normal fetch using bilateral endpoint
  var fetchParams = comtrade_buildFetchParams_(params);
  fetchParams.useBilateralEndpoint = true;
  var url = comtrade_buildApiUrl_(fetchParams, apiKey);

  var result;
  try {
    result = comtrade_executeApiFetch_(url);
  } catch (e) {
    // Bilateral endpoint may not support all data types; fall through to mirror
    result = { data: [], count: 0 };
  }

  if (result.data && result.data.length > 0) {
    // Mark all rows as directly reported
    for (var i = 0; i < result.data.length; i++) {
      result.data[i]._source = "reported";
    }
    return result;
  }

  // Fallback: swap reporter and partner, flip flow direction
  var mirrorParams = comtrade_buildFetchParams_(params);
  mirrorParams.reporterCode = params.partnerCode;
  mirrorParams.partnerCode = params.reporterCode;
  mirrorParams.flowCode = comtrade_flipFlow_(params.flowCode);
  mirrorParams.useBilateralEndpoint = false;

  var mirrorUrl = comtrade_buildApiUrl_(mirrorParams, apiKey);
  var mirrorResult = comtrade_executeApiFetch_(mirrorUrl);

  if (mirrorResult.data && mirrorResult.data.length > 0) {
    for (var j = 0; j < mirrorResult.data.length; j++) {
      mirrorResult.data[j]._source = "mirror";
    }
  }

  return mirrorResult;
}

/**
 * Build mode-specific fetch parameter overrides.
 * @private
 */
function comtrade_buildFetchParams_(params) {
  var p = {};
  // Copy all properties
  for (var key in params) {
    p[key] = params[key];
  }

  // Services total code depends on classification version:
  //   EB02 / EB10 root = "200", EB10S root = "S",
  //   EB (combined) has both → use "200,S" to cover all data.
  // Goods uses "TOTAL".
  var totalCode;
  if (params.typeCode === "S") {
    totalCode = params.clCode === "EB" ? "200,S" : "200";
  } else {
    totalCode = "TOTAL";
  }

  // Mode-specific overrides
  switch (params.mode) {
    case "summary":
      p.partnerCode = "0"; // World
      p.cmdCode = totalCode;
      break;
    case "balance":
      p.cmdCode = totalCode;
      p.flowCode = "M,X"; // Need both for balance calculation
      break;
    case "partners":
      // All partners — omit partnerCode so API returns all
      p.partnerCode = "";
      p.cmdCode = totalCode;
      break;
    case "products":
      // cmdCode comes from UI (AG2, AG4, or specific)
      break;
    case "bilateral":
      // All params come from UI
      break;
  }

  // Services total code is "200", not "TOTAL" (EBOPS classification root)
  if (p.typeCode === "S" && p.cmdCode === "TOTAL") {
    p.cmdCode = "200";
  }

  return p;
}

/**
 * Execute the actual HTTP fetch with error handling.
 * @private
 */
function comtrade_executeApiFetch_(url) {
  var options = {
    method: "get",
    muteHttpExceptions: true,
    headers: {
      Accept: "application/json",
    },
  };

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var body = response.getContentText();

  if (code === 429) {
    var retryAfter = response.getHeaders()["Retry-After"] || "60";
    throw new Error(
      "Rate limit exceeded. Please wait " +
        retryAfter +
        " seconds before trying again.",
    );
  }

  if (code === 403) {
    throw new Error(
      "Access forbidden. Your API key may be invalid or expired. Please check your API key in the sidebar.",
    );
  }

  if (code === 404) {
    throw new Error(
      "Data endpoint not found. The requested data may not be available for this classification or period.",
    );
  }

  if (code >= 500) {
    throw new Error(
      "UN Comtrade server error (" +
        code +
        "). Please try again later or narrow your query.",
    );
  }

  if (code !== 200) {
    var errMsg = "API returned status " + code;
    try {
      var errBody = JSON.parse(body);
      if (errBody.errorObject && errBody.errorObject.errorMessage) {
        errMsg += ": " + errBody.errorObject.errorMessage;
      }
    } catch (e) {
      if (body) {
        errMsg += ". Response: " + body.substring(0, 200);
      }
    }
    throw new Error(errMsg);
  }

  var content;
  try {
    content = JSON.parse(body);
  } catch (e) {
    throw new Error(
      "API returned non-JSON response. Preview: " + body.substring(0, 200),
    );
  }

  var data = content.data || [];

  // Warn if hitting record limits
  if (data.length >= 100000) {
    Logger.log(
      "WARNING: Response contains 100,000+ records — data may be truncated.",
    );
  }

  return {
    data: data,
    count: data.length,
  };
}

/**
 * Flip import↔export flow codes for mirror data.
 * @private
 */
function comtrade_flipFlow_(flowCode) {
  var flows = flowCode.split(",");
  var flipped = [];
  for (var i = 0; i < flows.length; i++) {
    var f = flows[i].trim();
    switch (f) {
      case "M":
        flipped.push("X");
        break;
      case "X":
        flipped.push("M");
        break;
      case "RM":
        flipped.push("RX");
        break;
      case "RX":
        flipped.push("RM");
        break;
      default:
        flipped.push(f);
        break;
    }
  }
  return flipped.join(",");
}
