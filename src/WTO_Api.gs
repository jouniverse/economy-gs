/**
 * WTO Timeseries API — HTTP client with subscription key and data-endpoint throttling.
 * https://api.wto.org/timeseries/v1
 */

var WTO_TS_BASE = "https://api.wto.org/timeseries/v1";
/** Min ms between /data and /data_count calls (WTO: 1 req/s for these endpoints). */
var WTO_DATA_THROTTLE_MS = 1000;
/** Use POST when GET URL would exceed this length. */
var WTO_MAX_GET_URL_LENGTH = 1800;

var lastWtoDataCallMs_ = 0;

/**
 * Builds a readable error from WTO ProblemDetails / validation payloads.
 */
function formatWtoApiErrorMessage_(pathForError, code, text) {
  var detail = text || "";
  try {
    var errObj = JSON.parse(text);
    if (errObj.detail) {
      detail = String(errObj.detail);
    } else if (errObj.title) {
      detail = String(errObj.title);
    }
    if (errObj.errors && typeof errObj.errors === "object") {
      var parts = [];
      Object.keys(errObj.errors).forEach(function (k) {
        var v = errObj.errors[k];
        if (Array.isArray(v)) {
          parts.push(k + ": " + v.join(" "));
        } else if (v != null) {
          parts.push(k + ": " + String(v));
        }
      });
      if (parts.length) {
        detail = detail + " — " + parts.join("; ");
      }
    }
  } catch (e) {
    /* use raw text */
  }
  return "WTO API error (" + code + ") on " + pathForError + ": " + detail;
}

/** Script property name for the WTO portal key (Ocp-Apim-Subscription-Key). */
var WTO_API_KEY_PROPERTY = "WTO_API_KEY";

/**
 * Reads API key from script properties. Prefers WTO_API_KEY; falls back to
 * WTO_SUBSCRIPTION_KEY for older deployments.
 */
function getWtoApiKey_() {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty(WTO_API_KEY_PROPERTY);
  if (!key || String(key).trim() === "") {
    key = props.getProperty("WTO_SUBSCRIPTION_KEY");
  }
  if (!key || String(key).trim() === "") {
    throw new Error(
      "WTO API key not found. Open the Reference tab, expand API key, and save your key from the WTO API Portal.",
    );
  }
  return String(key).trim();
}

function wto_throttleDataEndpoint_() {
  var now = Date.now();
  var wait = lastWtoDataCallMs_ + WTO_DATA_THROTTLE_MS - now;
  if (wait > 0) {
    Utilities.sleep(wait);
  }
  lastWtoDataCallMs_ = Date.now();
}

/**
 * @param {string} path - Path without base, e.g. "/topics"
 * @param {Object} query - Flat key-value; null/undefined skipped
 * @param {boolean} isDataEndpoint - if true, apply 1/s throttle
 * @returns {Object|Array|string|number} Parsed JSON
 */
function wtoFetchJson_(path, query, isDataEndpoint) {
  var key = getWtoApiKey_();
  if (isDataEndpoint) {
    wto_throttleDataEndpoint_();
  }

  var qs = [];
  if (query) {
    Object.keys(query).forEach(function (k) {
      var v = query[k];
      if (v === null || v === undefined || v === "") {
        return;
      }
      if (typeof v === "boolean") {
        qs.push(encodeURIComponent(k) + "=" + (v ? "true" : "false"));
      } else {
        qs.push(encodeURIComponent(k) + "=" + encodeURIComponent(String(v)));
      }
    });
  }
  var url = WTO_TS_BASE + path + (qs.length ? "?" + qs.join("&") : "");

  var resp = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Accept": "application/json",
    },
  });

  return handleWtoResponse_(resp, path);
}

/**
 * POST /data with JSON body (same fields as query).
 * @param {Object} body
 * @returns {Array}
 */
function wtoFetchDataPost_(body) {
  var key = getWtoApiKey_();
  var url = WTO_TS_BASE + "/data";
  var resp = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: JSON.stringify(body),
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Accept": "application/json",
    },
  });
  return handleWtoResponse_(resp, "/data");
}

/**
 * Build GET /data query object from flat params (Apps Script friendly).
 */
function wtoFetchDataGet_(params) {
  var query = {
    i: params.i,
    r: params.r != null ? params.r : "all",
    p: params.p != null ? params.p : "default",
    ps: params.ps != null ? params.ps : "default",
    pc: params.pc != null ? params.pc : "default",
    spc: params.spc === true,
    fmt: params.fmt || "json",
    mode: params.mode || "full",
    dec: params.dec != null ? params.dec : "default",
    off: params.off != null ? params.off : 0,
    max: params.max != null ? params.max : 500,
    head: params.head || "H",
    lang: params.lang != null ? params.lang : 1,
    meta: params.meta === true,
  };
  var url =
    WTO_TS_BASE +
    "/data?" +
    Object.keys(query)
      .map(function (k) {
        var v = query[k];
        if (typeof v === "boolean") {
          return encodeURIComponent(k) + "=" + (v ? "true" : "false");
        }
        return encodeURIComponent(k) + "=" + encodeURIComponent(String(v));
      })
      .join("&");

  if (url.length > WTO_MAX_GET_URL_LENGTH) {
    wto_throttleDataEndpoint_();
    return wtoFetchDataPost_(query);
  }

  wto_throttleDataEndpoint_();
  var key = getWtoApiKey_();
  var resp = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Accept": "application/json",
    },
  });
  return handleWtoResponse_(resp, "/data");
}

/**
 * GET /data_count — returns integer (raw JSON number).
 */
function wtoFetchDataCount_(params) {
  var query = {
    i: params.i,
    r: params.r != null ? params.r : "all",
    p: params.p != null ? params.p : "default",
    ps: params.ps != null ? params.ps : "default",
    pc: params.pc != null ? params.pc : "default",
    spc: params.spc === true,
  };
  wto_throttleDataEndpoint_();
  var key = getWtoApiKey_();
  var qs = Object.keys(query)
    .map(function (k) {
      var v = query[k];
      if (typeof v === "boolean") {
        return encodeURIComponent(k) + "=" + (v ? "true" : "false");
      }
      return encodeURIComponent(k) + "=" + encodeURIComponent(String(v));
    })
    .join("&");
  var url = WTO_TS_BASE + "/data_count?" + qs;
  var resp = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Accept": "application/json",
    },
  });
  var out = handleWtoResponse_(resp, "/data_count");
  if (typeof out === "number") {
    return out;
  }
  if (out && typeof out === "object" && typeof out.n === "number") {
    return out.n;
  }
  return parseInt(String(out), 10) || 0;
}

function handleWtoResponse_(resp, pathForError) {
  var code = resp.getResponseCode();
  var text = resp.getContentText();
  if (code === 429) {
    throw new Error(
      "WTO API rate limit (429). Wait a minute and try again. Timeseries data is limited to about 1 request per second.",
    );
  }
  if (code < 200 || code >= 300) {
    throw new Error(formatWtoApiErrorMessage_(pathForError, code, text));
  }
  if (typeof text === "string") {
    text = text.replace(/^\uFEFF/, "");
  }
  if (code === 204) {
    return wto_emptySuccessBody_(pathForError);
  }
  if (text == null || String(text).trim() === "") {
    return wto_emptySuccessBody_(pathForError);
  }
  text = String(text).trim();
  try {
    var parsed = JSON.parse(text);
    if (parsed === null) {
      return wto_emptySuccessBody_(pathForError);
    }
    return parsed;
  } catch (e) {
    throw new Error("Invalid JSON from WTO API: " + text.substring(0, 200));
  }
}

/** Empty or null JSON body on success — shape depends on endpoint. */
function wto_emptySuccessBody_(pathForError) {
  if (pathForError === "/data") {
    return { Dataset: [] };
  }
  if (pathForError === "/data_count") {
    return 0;
  }
  return null;
}
