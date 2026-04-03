/**
 * WTO Data — orchestration functions for the unified Economy Data add-on.
 * Menu and sidebar are handled by the main Code.gs.
 */

// ─── API key (script property WTO_API_KEY) ─────────────────────────────────

/**
 * Saves the WTO API key (Ocp-Apim-Subscription-Key) to script properties.
 * Also clears legacy WTO_SUBSCRIPTION_KEY when present to avoid ambiguity.
 */
function wto_saveWtoApiKey(key) {
  if (!key || String(key).trim() === "") {
    throw new Error("Please paste a valid API key from the WTO API Portal.");
  }
  var props = PropertiesService.getScriptProperties();
  props.setProperty("WTO_API_KEY", String(key).trim());
  props.deleteProperty("WTO_SUBSCRIPTION_KEY");
  return "API key saved.";
}

/** @deprecated Use wto_saveWtoApiKey — kept for compatibility */
function wto_saveWtoSubscriptionKey(key) {
  return wto_saveWtoApiKey(key);
}

function wto_getWtoKeyStatus() {
  var props = PropertiesService.getScriptProperties();
  var key =
    props.getProperty(WTO_API_KEY_PROPERTY) ||
    props.getProperty("WTO_SUBSCRIPTION_KEY");
  return { saved: !!key };
}

/**
 * Lightweight call to verify the key (does not use data throttle heavily).
 */
function wto_testWtoConnection() {
  getWtoApiKey_();
  wtoFetchJson_("/topics", { lang: 1 }, false);
  return { ok: true, message: "Connection OK — topics retrieved." };
}

function wto_refreshWtoMetadataCache() {
  clearWtoMetadataCache();
  SpreadsheetApp.getUi().alert(
    "Metadata cache cleared. It will refill when you open the sidebar.",
  );
}

// ─── Bootstrap & search ─────────────────────────────────────────────────────

function wto_getExplorerBootstrap() {
  var st = wto_getWtoKeyStatus();
  if (!st.saved) {
    return { needsKey: true, keyStatus: st };
  }
  getWtoApiKey_();
  return {
    needsKey: false,
    keyStatus: st,
    topics: wto_getTopics(),
    frequencies: wto_getFrequencies(),
    indicatorCategories: wto_getIndicatorCategories(),
  };
}

function wto_clientSearchIndicators(filters) {
  getWtoApiKey_();
  return wto_searchIndicators(filters || {});
}

function wto_clientGetReporters() {
  getWtoApiKey_();
  return wto_getReporters();
}

function wto_clientGetPartners() {
  getWtoApiKey_();
  return wto_getPartners();
}

function wto_clientGetYears() {
  getWtoApiKey_();
  return wto_getYears();
}

function wto_clientGetMetadata(params) {
  getWtoApiKey_();
  if (!params || !params.i) {
    throw new Error("Indicator code required for metadata.");
  }
  var q = {
    i: params.i,
    lang: params.lang || 1,
  };
  if (params.r) {
    q.r = params.r;
  }
  if (params.p) {
    q.p = params.p;
  }
  if (params.pc) {
    q.pc = params.pc;
  }
  if (params.spc === true) {
    q.spc = true;
  }
  return wtoFetchJson_("/metadata", q, false);
}

function wto_clientGetDataCount(params) {
  getWtoApiKey_();
  var v = wto_validateFetchParams(params);
  if (!v.valid) {
    throw new Error(v.error);
  }
  var n = wto_normalizeFetchParams_(params);
  return { count: wtoFetchDataCount_(n), params: n };
}

function wto_runWtoExplorerFetch(params) {
  getWtoApiKey_();
  var v = wto_validateFetchParams(params);
  if (!v.valid) {
    throw new Error(v.error);
  }
  var n = wto_normalizeFetchParams_(params);
  var raw = wtoFetchDataGet_(n);
  var rows = wto_normalizeDataArray_(raw);
  return processWtoDataResponse(rows, n);
}

/**
 * Quick Fetch — grouped presets; time period comes from the sidebar (wto_computeQuickPeriodString_).
 */
function wto_getQuickPresetDefinitions() {
  return {
    sections: [
      {
        id: "tariffs",
        title: "Tariffs",
        presets: [
          {
            id: "mfn_tariff",
            title: "Average MFN applied tariff — all products",
            subtitle:
              "TP_A_0010 · Annual · Simple average MFN applied tariff (economy-wide protection; higher = higher barriers).",
            indicator: "TP_A_0010",
            p: "default",
            pc: "default",
            max: 8000,
          },
        ],
      },
      {
        id: "trade_flows",
        title: "Trade flows",
        presets: [
          {
            id: "its_mtv_mx",
            title: "Total merchandise exports — monthly",
            subtitle: "ITS_MTV_MX · Million USD · Monthly.",
            indicator: "ITS_MTV_MX",
            p: "default",
            pc: "default",
            max: 50000,
          },
          {
            id: "its_mtv_mm",
            title: "Total merchandise imports — monthly",
            subtitle: "ITS_MTV_MM · Million USD · Monthly.",
            indicator: "ITS_MTV_MM",
            p: "default",
            pc: "default",
            max: 50000,
          },
          {
            id: "its_mtp_axvg",
            title: "Merchandise export volume change — annual",
            subtitle: "ITS_MTP_AXVG · % change over previous year · Annual.",
            indicator: "ITS_MTP_AXVG",
            p: "default",
            pc: "default",
            max: 8000,
          },
          {
            id: "its_mtp_amvg",
            title: "Merchandise import volume change — annual",
            subtitle: "ITS_MTP_AMVG · % change over previous year · Annual.",
            indicator: "ITS_MTP_AMVG",
            p: "default",
            pc: "default",
            max: 8000,
          },
        ],
      },
    ],
  };
}

function wto_findQuickPresetById_(root, presetId) {
  if (!root || !root.sections) {
    return null;
  }
  var sid = String(presetId);
  for (var s = 0; s < root.sections.length; s++) {
    var presets = root.sections[s].presets || [];
    for (var p = 0; p < presets.length; p++) {
      if (presets[p].id === sid) {
        return presets[p];
      }
    }
  }
  return null;
}

/**
 * Maps Quick Fetch period control to WTO `ps` parameter.
 * @param {string} periodMode - selected_year | last_year | last_5_years | last_15_years | all_years
 * @param {string} yearStr - calendar year when mode is selected_year
 */
function wto_computeQuickPeriodString_(periodMode, yearStr) {
  var tz = Session.getScriptTimeZone();
  var y = parseInt(Utilities.formatDate(new Date(), tz, "yyyy"), 10);
  if (isNaN(y)) {
    y = new Date().getFullYear();
  }
  var mode = String(periodMode || "last_5_years").toLowerCase();
  if (mode === "selected_year") {
    if (!yearStr || String(yearStr).trim() === "") {
      throw new Error(
        'Choose a year in the dropdown when using "Selected year".',
      );
    }
    return String(yearStr).trim();
  }
  if (mode === "last_year") {
    return String(y - 1);
  }
  if (mode === "last_5_years") {
    return y - 4 + "-" + y;
  }
  if (mode === "last_15_years") {
    return y - 14 + "-" + y;
  }
  if (mode === "all_years") {
    return "all";
  }
  return "default";
}

/**
 * @param {string} presetId
 * @param {string} reporterCode
 * @param {string} year - used when period mode is selected_year
 * @param {string} periodMode - Quick Fetch time period control
 */
function wto_runWtoQuickFetch(presetId, reporterCode, year, periodMode) {
  getWtoApiKey_();
  var preset = wto_findQuickPresetById_(wto_getQuickPresetDefinitions(), presetId);
  if (!preset) {
    throw new Error("Unknown preset.");
  }
  if (!reporterCode || String(reporterCode).trim() === "") {
    throw new Error("Select a reporting economy first.");
  }
  var r = String(reporterCode).trim();
  var ps = wto_computeQuickPeriodString_(periodMode, year);
  var indicatorCode = preset.indicator;
  if (!indicatorCode) {
    throw new Error("Preset is missing an indicator code.");
  }
  var params = {
    i: indicatorCode,
    r: r,
    p: preset.p != null ? preset.p : "default",
    ps: ps,
    pc: preset.pc || "default",
    spc: false,
    max: preset.max != null ? preset.max : 8000,
    head: "H",
    lang: 1,
  };
  var v = wto_validateFetchParams(params);
  if (!v.valid) {
    throw new Error(v.error);
  }
  var n = wto_normalizeFetchParams_(params);
  var raw = wtoFetchDataGet_(n);
  var rows = wto_normalizeDataArray_(raw);
  return processWtoDataResponse(rows, n);
}

function wto_exportIndicatorCatalogToSheet() {
  return wto_exportReferenceListToSheet("indicators");
}

/**
 * @param {string} listKind - "indicators" | "products" | "reporters" | "partners"
 */
function wto_exportReferenceListToSheet(listKind) {
  getWtoApiKey_();
  var kind = String(listKind || "indicators").toLowerCase();
  var tz = Session.getScriptTimeZone();
  var ts = Utilities.formatDate(new Date(), tz, "yyyyMMdd_HHmmss");

  if (kind === "indicators") {
    var indList = wto_unwrapReferenceList_(wto_fetchAllIndicatorsForExport());
    if (!indList || !indList.length) {
      throw new Error("No indicators returned.");
    }
    var indHeaders = [
      "code",
      "name",
      "categoryCode",
      "categoryLabel",
      "frequencyCode",
      "frequencyLabel",
      "unitLabel",
      "startYear",
      "endYear",
      "productSectorClassificationLabel",
    ];
    var indRows = indList.map(function (ind) {
      return [
        ind.code || "",
        ind.name || "",
        ind.categoryCode || "",
        ind.categoryLabel || "",
        ind.frequencyCode || "",
        ind.frequencyLabel || "",
        ind.unitLabel || "",
        ind.startYear != null ? ind.startYear : "",
        ind.endYear != null ? ind.endYear : "",
        ind.productSectorClassificationLabel || "",
      ];
    });
    return wto_injectCatalogToSheet_(indHeaders, indRows, "WTO_Indicators_" + ts);
  }

  if (kind === "products") {
    var prodList = wto_unwrapReferenceList_(wto_fetchAllProductsForExport());
    if (!prodList || !prodList.length) {
      throw new Error("No products/sectors returned.");
    }
    var prodHeaders = [
      "code",
      "name",
      "productClassification",
      "codeUnique",
      "hierarchy",
      "displayOrder",
      "note",
    ];
    var prodRows = prodList.map(function (p) {
      return [
        p.code || "",
        p.name || "",
        p.productClassification || "",
        p.codeUnique || "",
        p.hierarchy || "",
        p.displayOrder != null ? p.displayOrder : "",
        p.note || "",
      ];
    });
    return wto_injectCatalogToSheet_(
      prodHeaders,
      prodRows,
      "WTO_ProductsSectors_" + ts,
    );
  }

  if (kind === "reporters") {
    var repList = wto_getReporters();
    if (!repList || !repList.length) {
      throw new Error("No reporting economies returned.");
    }
    var repHeaders = ["code", "name"];
    var repRows = repList.map(function (r) {
      return [r.code || "", r.name || ""];
    });
    return wto_injectCatalogToSheet_(
      repHeaders,
      repRows,
      "WTO_ReportingEconomies_" + ts,
    );
  }

  if (kind === "partners") {
    var parList = wto_getPartners();
    if (!parList || !parList.length) {
      throw new Error("No partner economies returned.");
    }
    var parHeaders = ["code", "name"];
    var parRows = parList.map(function (p) {
      return [p.code || "", p.name || ""];
    });
    return wto_injectCatalogToSheet_(
      parHeaders,
      parRows,
      "WTO_PartnerEconomies_" + ts,
    );
  }

  throw new Error("Unknown list type: " + kind);
}

/**
 * WTO JSON timeseries responses use a Dataset array (see wtor R client), not a bare array.
 */
function wto_normalizeDataArray_(raw) {
  if (raw == null) {
    return [];
  }
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch (e) {
      throw new Error("Unexpected /data response (string is not JSON).");
    }
  }
  if (Array.isArray(raw)) {
    return raw;
  }
  if (typeof raw !== "object") {
    throw new Error("Unexpected /data response (not JSON object or array).");
  }
  var nestedKeys = ["Dataset", "dataset", "Data", "data", "Records", "records"];
  for (var i = 0; i < nestedKeys.length; i++) {
    var k = nestedKeys[i];
    if (raw[k] === null) {
      return [];
    }
    if (Array.isArray(raw[k])) {
      return raw[k];
    }
    if (typeof raw[k] === "string" && raw[k].trim().charAt(0) === "[") {
      try {
        var inner = JSON.parse(raw[k]);
        if (Array.isArray(inner)) {
          return inner;
        }
      } catch (e) {
        /* ignore */
      }
    }
  }
  if (raw.Result && Array.isArray(raw.Result.Dataset)) {
    return raw.Result.Dataset;
  }
  throw new Error(
    "Unexpected /data response. Expected a Dataset array. Top-level keys: " +
      Object.keys(raw).join(", "),
  );
}

/** Some reference endpoints return a bare array; others may wrap (e.g. Dataset). */
function wto_unwrapReferenceList_(raw) {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (raw && typeof raw === "object") {
    if (Array.isArray(raw.Dataset)) {
      return raw.Dataset;
    }
    if (Array.isArray(raw.data)) {
      return raw.data;
    }
  }
  return raw;
}
