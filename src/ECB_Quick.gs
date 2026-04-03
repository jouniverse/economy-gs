// ---------------------------------------------------------------------------
// ECB_Quick.gs — Pre-configured Quick Fetch series
// ---------------------------------------------------------------------------

var ECB_QUICK_SERIES = [
  // ---- Exchange Rates ----
  {
    id: "EXR_USD_EUR",
    dataflowId: "EXR",
    name: "EUR/USD Exchange Rate",
    sheetName: "EXR EUR-USD",
    category: "Exchange Rates",
    dimOrder: ["FREQ", "CURRENCY", "CURRENCY_DENOM", "EXR_TYPE", "EXR_SUFFIX"],
    dimensions: {
      FREQ: ["D"],
      CURRENCY: ["USD"],
      CURRENCY_DENOM: ["EUR"],
      EXR_TYPE: ["SP00"],
      EXR_SUFFIX: ["A"],
    },
    defaultOptions: { lastNObservations: 250 },
  },
  {
    id: "EXR_MAJOR",
    dataflowId: "EXR",
    name: "Major Currencies vs EUR",
    sheetName: "EXR Major",
    category: "Exchange Rates",
    dimOrder: ["FREQ", "CURRENCY", "CURRENCY_DENOM", "EXR_TYPE", "EXR_SUFFIX"],
    dimensions: {
      FREQ: ["D"],
      CURRENCY: ["USD", "GBP", "JPY", "CHF"],
      CURRENCY_DENOM: ["EUR"],
      EXR_TYPE: ["SP00"],
      EXR_SUFFIX: ["A"],
    },
    defaultOptions: { lastNObservations: 60 },
  },
  {
    id: "EXR_MONTHLY",
    dataflowId: "EXR",
    name: "Monthly Avg. Rates vs EUR",
    sheetName: "EXR Monthly",
    category: "Exchange Rates",
    dimOrder: ["FREQ", "CURRENCY", "CURRENCY_DENOM", "EXR_TYPE", "EXR_SUFFIX"],
    dimensions: {
      FREQ: ["M"],
      CURRENCY: ["USD", "GBP", "JPY", "CHF", "CNY"],
      CURRENCY_DENOM: ["EUR"],
      EXR_TYPE: ["SP00"],
      EXR_SUFFIX: ["A"],
    },
    defaultOptions: { startPeriod: "2020" },
  },

  // ---- Interest Rates & Monetary Policy ----
  {
    id: "FM_KEY_RATES",
    dataflowId: "FM",
    name: "Key ECB Interest Rates",
    sheetName: "ECB Key Rates",
    category: "Interest Rates",
    dimOrder: [
      "FREQ",
      "REF_AREA",
      "CURRENCY",
      "PROVIDER_FM",
      "INSTRUMENT_FM",
      "PROVIDER_FM_ID",
      "DATA_TYPE_FM",
    ],
    dimensions: {
      FREQ: ["D"],
      REF_AREA: ["U2"],
      CURRENCY: ["EUR"],
      PROVIDER_FM: ["4F"],
      INSTRUMENT_FM: ["KR"],
      PROVIDER_FM_ID: ["MRR_RT", "MLFR", "DFR"],
      DATA_TYPE_FM: ["LEV"],
    },
    defaultOptions: { startPeriod: "1999" },
  },
  {
    id: "EST_RATE",
    dataflowId: "EST",
    name: "Euro Short-Term Rate (€STR)",
    sheetName: "€STR",
    category: "Interest Rates",
    dimOrder: ["FREQ", "BENCHMARK_ITEM", "DATA_TYPE_EST"],
    dimensions: {
      FREQ: ["B"],
      BENCHMARK_ITEM: ["EU000A2X2A25"],
      DATA_TYPE_EST: ["WT"],
    },
    defaultOptions: { lastNObservations: 250 },
  },
  {
    id: "IRS_EURIBOR",
    dataflowId: "FM",
    name: "Euribor Rates",
    sheetName: "Euribor",
    category: "Interest Rates",
    dimOrder: [
      "FREQ",
      "REF_AREA",
      "CURRENCY",
      "PROVIDER_FM",
      "INSTRUMENT_FM",
      "PROVIDER_FM_ID",
      "DATA_TYPE_FM",
    ],
    dimensions: {
      FREQ: ["M"],
      REF_AREA: ["U2"],
      CURRENCY: ["EUR"],
      PROVIDER_FM: ["RT"],
      INSTRUMENT_FM: ["MM"],
      PROVIDER_FM_ID: [
        "EURIBOR1MD_",
        "EURIBOR3MD_",
        "EURIBOR6MD_",
        "EURIBOR1YD_",
      ],
      DATA_TYPE_FM: ["HSTA"],
    },
    defaultOptions: { startPeriod: "2000" },
  },

  // ---- Inflation (HICP) ----
  {
    id: "ICP_HICP_EA",
    dataflowId: "ICP",
    name: "HICP Euro Area (YoY %)",
    sheetName: "HICP Euro Area",
    category: "Inflation",
    dimOrder: ["FREQ", "REF_AREA", "ICP_ITEM", "STS_INSTITUTION", "ICP_SUFFIX"],
    dimensions: {
      FREQ: ["M"],
      REF_AREA: ["U2"],
      ICP_ITEM: ["000000"],
      STS_INSTITUTION: ["4"],
      ICP_SUFFIX: ["ANR"],
    },
    defaultOptions: { startPeriod: "1997" },
  },
  {
    id: "ICP_HICP_COUNTRIES",
    dataflowId: "ICP",
    name: "HICP Major Economies (YoY %)",
    sheetName: "HICP Countries",
    category: "Inflation",
    dimOrder: ["FREQ", "REF_AREA", "ICP_ITEM", "STS_INSTITUTION", "ICP_SUFFIX"],
    dimensions: {
      FREQ: ["M"],
      REF_AREA: ["DE", "FR", "IT", "ES", "NL"],
      ICP_ITEM: ["000000"],
      STS_INSTITUTION: ["4"],
      ICP_SUFFIX: ["ANR"],
    },
    defaultOptions: { startPeriod: "2020" },
  },
  {
    id: "ICP_HICP_INDEX",
    dataflowId: "ICP",
    name: "HICP Index (2015=100)",
    sheetName: "HICP Index",
    category: "Inflation",
    dimOrder: ["FREQ", "REF_AREA", "ICP_ITEM", "STS_INSTITUTION", "ICP_SUFFIX"],
    dimensions: {
      FREQ: ["M"],
      REF_AREA: ["U2"],
      ICP_ITEM: ["000000"],
      STS_INSTITUTION: ["4"],
      ICP_SUFFIX: ["INX"],
    },
    defaultOptions: { startPeriod: "1997" },
  },

  // ---- Money & Banking ----
  {
    id: "BSI_M3",
    dataflowId: "BSI",
    name: "Monetary Aggregate M3 (Annual Growth)",
    sheetName: "BSI M3",
    category: "Money & Banking",
    dimOrder: [
      "FREQ",
      "REF_AREA",
      "ADJUSTMENT",
      "BS_REP_SECTOR",
      "BS_ITEM",
      "MATURITY_ORIG",
      "DATA_TYPE",
      "COUNT_AREA",
      "BS_COUNT_SECTOR",
      "CURRENCY_TRANS",
      "BS_SUFFIX",
    ],
    dimensions: {
      FREQ: ["M"],
      REF_AREA: ["U2"],
      ADJUSTMENT: ["Y"],
      BS_REP_SECTOR: ["V"],
      BS_ITEM: ["M30"],
      MATURITY_ORIG: ["X"],
      DATA_TYPE: ["I"],
      COUNT_AREA: ["U2"],
      BS_COUNT_SECTOR: ["2300"],
      CURRENCY_TRANS: ["Z01"],
      BS_SUFFIX: ["A"],
    },
    defaultOptions: { startPeriod: "2000" },
  },
  {
    id: "MIR_LENDING",
    dataflowId: "MIR",
    name: "MFI Lending Rates (Households)",
    sheetName: "MIR Lending",
    category: "Money & Banking",
    dimOrder: [
      "FREQ",
      "REF_AREA",
      "BS_REP_SECTOR",
      "BS_ITEM",
      "MATURITY_NOT_IRATE",
      "DATA_TYPE_MIR",
      "AMOUNT_CAT",
      "BS_COUNT_SECTOR",
      "CURRENCY_TRANS",
      "IR_BUS_COV",
    ],
    dimensions: {
      FREQ: ["M"],
      REF_AREA: ["U2"],
      BS_REP_SECTOR: ["B"],
      BS_ITEM: ["A2C"],
      MATURITY_NOT_IRATE: ["AM"],
      DATA_TYPE_MIR: ["R"],
      AMOUNT_CAT: ["A"],
      BS_COUNT_SECTOR: ["2250"],
      CURRENCY_TRANS: ["EUR"],
      IR_BUS_COV: ["N"],
    },
    defaultOptions: { startPeriod: "2003", lastNObservations: 60 },
  },

  // ---- Balance of Payments ----
  {
    id: "BOP_CA",
    dataflowId: "BPS",
    name: "Current Account Balance (BPS)",
    sheetName: "BPS Current Account",
    category: "External Sector",
    dimOrder: [
      "FREQ",
      "ADJUSTMENT",
      "REF_AREA",
      "COUNTERPART_AREA",
      "REF_SECTOR",
      "COUNTERPART_SECTOR",
      "FLOW_STOCK_ENTRY",
      "ACCOUNTING_ENTRY",
      "INT_ACC_ITEM",
      "FUNCTIONAL_CAT",
      "INSTR_ASSET",
      "MATURITY",
      "UNIT_MEASURE",
      "CURRENCY_DENOM",
      "VALUATION",
      "COMP_METHOD",
      "TYPE_ENTITY",
    ],
    dimensions: {
      FREQ: ["Q"],
      ADJUSTMENT: ["N"],
      REF_AREA: ["I10"],
      COUNTERPART_AREA: ["W1"],
      REF_SECTOR: ["S1"],
      COUNTERPART_SECTOR: ["S1"],
      FLOW_STOCK_ENTRY: ["T"],
      ACCOUNTING_ENTRY: ["B"],
      INT_ACC_ITEM: ["CA"],
      FUNCTIONAL_CAT: ["_Z"],
      INSTR_ASSET: ["_Z"],
      MATURITY: ["_Z"],
      UNIT_MEASURE: ["EUR"],
      CURRENCY_DENOM: ["_T"],
      VALUATION: ["_X"],
      COMP_METHOD: ["N"],
      TYPE_ENTITY: ["ALL"],
    },
    defaultOptions: { startPeriod: "2010" },
  },

  // ---- Financial Markets ----
  {
    id: "YC_EURO",
    dataflowId: "YC",
    name: "Euro Area Yield Curve",
    sheetName: "Yield Curve",
    category: "Financial Markets",
    dimOrder: [
      "FREQ",
      "REF_AREA",
      "CURRENCY",
      "PROVIDER_FM",
      "INSTRUMENT_FM",
      "PROVIDER_FM_ID",
      "DATA_TYPE_FM",
    ],
    dimensions: {
      FREQ: ["B"],
      REF_AREA: ["U2"],
      CURRENCY: ["EUR"],
      PROVIDER_FM: ["4F"],
      INSTRUMENT_FM: ["G_N_A"],
      PROVIDER_FM_ID: ["SV_C_YM"],
      DATA_TYPE_FM: ["SR_10Y"],
    },
    defaultOptions: { lastNObservations: 20 },
  },
  {
    id: "CISS_STRESS",
    dataflowId: "CISS",
    name: "Systemic Stress Indicator (CISS)",
    sheetName: "CISS",
    category: "Financial Markets",
    dimOrder: [
      "FREQ",
      "REF_AREA",
      "CURRENCY",
      "PROVIDER_FM",
      "INSTRUMENT_FM",
      "PROVIDER_FM_ID",
      "DATA_TYPE_FM",
    ],
    dimensions: {
      FREQ: ["D"],
      REF_AREA: ["U2"],
      CURRENCY: ["Z0Z"],
      PROVIDER_FM: ["4F"],
      INSTRUMENT_FM: ["EC"],
      PROVIDER_FM_ID: ["SS_CIN"],
      DATA_TYPE_FM: ["IDX"],
    },
    defaultOptions: { lastNObservations: 250 },
  },

  // ---- Surveys ----
  {
    id: "SPF_INFLATION",
    dataflowId: "SPF",
    name: "Professional Forecasters — Inflation",
    sheetName: "SPF Inflation",
    category: "Surveys & Forecasts",
    dimOrder: [
      "FREQ",
      "REF_AREA",
      "FCT_TOPIC",
      "FCT_BREAKDOWN",
      "FCT_HORIZON",
      "SURVEY_FREQ",
      "FCT_SOURCE",
    ],
    dimensions: {
      FREQ: ["Q"],
      REF_AREA: ["U2"],
      FCT_TOPIC: ["HICP", "RGDP"],
      FCT_BREAKDOWN: ["POINT"],
      FCT_HORIZON: ["2024", "2025", "2026"],
      SURVEY_FREQ: ["Q"],
      FCT_SOURCE: ["AVG"],
    },
    defaultOptions: { lastNObservations: 40 },
  },
];

/**
 * Human-readable labels for dimension IDs used in Quick Fetch summaries.
 * @private
 */
var ECB_DIM_LABELS_ = {
  FREQ: "Frequency",
  REF_AREA: "Reference Area",
  CURRENCY: "Currency",
  CURRENCY_DENOM: "Denominator Currency",
  EXR_TYPE: "Exchange Rate Type",
  EXR_SUFFIX: "Suffix",
  PROVIDER_FM: "Provider",
  INSTRUMENT_FM: "Instrument",
  PROVIDER_FM_ID: "Series ID",
  DATA_TYPE_FM: "Data Type",
  ICP_ITEM: "Item",
  STS_INSTITUTION: "Institution",
  ICP_SUFFIX: "HICP Suffix",
  ADJUSTMENT: "Adjustment",
  BS_REP_SECTOR: "Reporting Sector",
  BS_ITEM: "Balance Sheet Item",
  MATURITY_ORIG: "Original Maturity",
  DATA_TYPE: "Data Type",
  COUNT_AREA: "Counterpart Area",
  BS_COUNT_SECTOR: "Counterpart Sector",
  CURRENCY_TRANS: "Currency of Transaction",
  BS_SUFFIX: "BS Suffix",
  BS_REP_SECTOR: "Reporting Sector",
  MATURITY_NOT_IRATE: "Maturity (Not IR)",
  DATA_TYPE_MIR: "MIR Data Type",
  AMOUNT_CAT: "Amount Category",
  IR_BUS_COV: "Business Coverage",
  DATA_TYPE_BOP: "BOP Data Type",
  BOP_ITEM: "BOP Item",
  CURR_BRKDWN: "Currency Breakdown",
  SERIES_DENOM: "Denomination",
  COUNTERPART_AREA: "Counterpart Area",
  REF_SECTOR: "Reference Sector",
  COUNTERPART_SECTOR: "Counterpart Sector",
  FLOW_STOCK_ENTRY: "Flow/Stock",
  ACCOUNTING_ENTRY: "Accounting Entry",
  INT_ACC_ITEM: "Account Item",
  FUNCTIONAL_CAT: "Functional Category",
  INSTR_ASSET: "Instrument/Asset",
  MATURITY: "Maturity",
  UNIT_MEASURE: "Unit of Measure",
  VALUATION: "Valuation",
  COMP_METHOD: "Compilation Method",
  TYPE_ENTITY: "Entity Type",
  BENCHMARK_ITEM: "Benchmark",
  DATA_TYPE_EST: "EST Data Type",
  FCT_TOPIC: "Forecast Topic",
  FCT_BREAKDOWN: "Breakdown",
  FCT_HORIZON: "Horizon",
  SURVEY_FREQ: "Survey Frequency",
  FCT_SOURCE: "Source",
};

/**
 * Build a short summary string for a preset's dimension selections.
 * @private
 */
function ecb_buildDimSummary_(preset) {
  var parts = [];
  for (var key in preset.dimensions) {
    if (!preset.dimensions.hasOwnProperty(key)) continue;
    var vals = preset.dimensions[key];
    var label = ECB_DIM_LABELS_[key] || key;
    if (vals.length <= 3) {
      parts.push(label + ": " + vals.join(", "));
    } else {
      parts.push(
        label +
          ": " +
          vals.slice(0, 2).join(", ") +
          " + " +
          (vals.length - 2) +
          " more",
      );
    }
  }
  return parts.join(" · ");
}

/**
 * Get all Quick Fetch presets, organized by category.
 *
 * @returns {Object[]} Array of {category, items: [{id, name, sheetName, dimSummary}]}.
 */
function ecb_getQuickPresets() {
  var categories = {};
  for (var i = 0; i < ECB_QUICK_SERIES.length; i++) {
    var s = ECB_QUICK_SERIES[i];
    if (!categories[s.category]) {
      categories[s.category] = [];
    }
    categories[s.category].push({
      id: s.id,
      name: s.name,
      sheetName: s.sheetName,
      dimSummary: ecb_buildDimSummary_(s),
    });
  }

  var result = [];
  for (var cat in categories) {
    if (categories.hasOwnProperty(cat)) {
      result.push({ category: cat, items: categories[cat] });
    }
  }
  return result;
}

/**
 * Execute a Quick Fetch by preset ID.
 *
 * @param {string} presetId     Preset ID.
 * @param {Object} [overrides]  User overrides.
 * @returns {string} Status message.
 */
function ecb_runQuickFetch(presetId, overrides) {
  overrides = overrides || {};

  var preset = null;
  for (var i = 0; i < ECB_QUICK_SERIES.length; i++) {
    if (ECB_QUICK_SERIES[i].id === presetId) {
      preset = ECB_QUICK_SERIES[i];
      break;
    }
  }
  if (!preset) throw new Error("Unknown preset: " + presetId);

  // Clone preset dimensions
  var dims = {};
  for (var key in preset.dimensions) {
    if (preset.dimensions.hasOwnProperty(key)) {
      dims[key] = preset.dimensions[key].slice();
    }
  }

  // Build options from defaults + overrides
  var defaultOpts = preset.defaultOptions || {};
  var options = {};
  if (defaultOpts.startPeriod) options.startPeriod = defaultOpts.startPeriod;
  if (defaultOpts.endPeriod) options.endPeriod = defaultOpts.endPeriod;
  if (defaultOpts.lastNObservations)
    options.lastNObservations = defaultOpts.lastNObservations;

  if (overrides.startPeriod) options.startPeriod = overrides.startPeriod;
  if (overrides.endPeriod) options.endPeriod = overrides.endPeriod;
  if (overrides.lastNObservations) {
    options.lastNObservations = parseInt(overrides.lastNObservations, 10);
  }

  var sheetName = preset.sheetName || preset.name || preset.dataflowId;

  // Use dimOrder to bypass expensive DSD fetch when available
  if (preset.dimOrder) {
    var result = ecb_fetchDataDirect(
      preset.dataflowId,
      dims,
      preset.dimOrder,
      options,
    );
    if (!result.rows || result.rows.length === 0) {
      throw new Error(
        "No data found for " +
          preset.dataflowId +
          ". Try different dimension selections or time period.",
      );
    }
    return ecb_writeDataToSheet_(result.headers, result.rows, sheetName);
  }

  return ecb_fetchAndWriteData(preset.dataflowId, dims, options, sheetName);
}

/**
 * Write a codebook sheet for a Quick Fetch preset.
 * Shows only the dimensions and values used by this preset,
 * with human-readable labels from the DSD codelists.
 *
 * @param {string} presetId  Preset ID.
 * @returns {string} Status message.
 */
function ecb_writeQuickCodebook(presetId) {
  var preset = null;
  for (var i = 0; i < ECB_QUICK_SERIES.length; i++) {
    if (ECB_QUICK_SERIES[i].id === presetId) {
      preset = ECB_QUICK_SERIES[i];
      break;
    }
  }
  if (!preset) throw new Error("Unknown preset: " + presetId);

  var rows = [["DIMENSION", "DIMENSION NAME", "CODE", "NAME"]];

  if (preset.dimOrder) {
    // Use serieskeysonly to get human-readable code names (fast, no DSD needed)
    var info = ecb_getDataflowDimensions(preset.dataflowId);
    var allCodes = info.codes || {};

    for (var d = 0; d < preset.dimOrder.length; d++) {
      var dimId = preset.dimOrder[d];
      var dimLabel = ECB_DIM_LABELS_[dimId] || dimId;
      var presetVals = preset.dimensions[dimId];
      var codes = allCodes[dimId] || [];

      // Build lookup: code ID → human-readable name
      var codeLookup = {};
      for (var c = 0; c < codes.length; c++) {
        codeLookup[codes[c].id] = codes[c].name || codes[c].id;
      }

      if (presetVals && presetVals.length > 0) {
        for (var v = 0; v < presetVals.length; v++) {
          var val = presetVals[v];
          var name = codeLookup[val] || val;
          rows.push([dimId, dimLabel, val, name]);
        }
      } else {
        rows.push([dimId, dimLabel, "(all)", "Not restricted"]);
      }
    }
  } else {
    // Fallback: fetch DSD and codelists for full code names
    var allCodes = ecb_getAllAvailableCodes(preset.dataflowId);
    var dsd = ecb_getDataStructure(preset.dataflowId);
    var dsdDimOrder = dsd.dimensions
      .filter(function (d) {
        return d.type !== "TimeDimension";
      })
      .sort(function (a, b) {
        return a.position - b.position;
      });

    for (var d = 0; d < dsdDimOrder.length; d++) {
      var dimId = dsdDimOrder[d].id;
      var dimLabel = ECB_DIM_LABELS_[dimId] || dimId;
      var presetVals = preset.dimensions[dimId];
      var codes = allCodes[dimId] || [];

      var codeLookup = {};
      for (var c = 0; c < codes.length; c++) {
        codeLookup[codes[c].id] = codes[c].name || codes[c].id;
      }

      if (presetVals && presetVals.length > 0) {
        for (var v = 0; v < presetVals.length; v++) {
          var val = presetVals[v];
          var name = codeLookup[val] || val;
          rows.push([dimId, dimLabel, val, name]);
        }
      } else {
        rows.push([dimId, dimLabel, "(all)", "Not restricted"]);
      }
    }
  }

  var sheetName = (preset.sheetName || preset.name) + " Codes";
  return ecb_writeListToSheet_(rows, sheetName);
}
