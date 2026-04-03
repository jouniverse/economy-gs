// ---------------------------------------------------------------------------
// IMF_Quick.gs — Pre-configured Quick Fetch series
// ---------------------------------------------------------------------------

/**
 * Quick Fetch preset definitions.
 *
 * Each preset specifies:
 *   dataflowId       — IMF dataset ID
 *   agency           — Agency ID
 *   name             — Display name
 *   sheetName        — Default sheet name for output
 *   category         — UI grouping category
 *   countryDimension — Which dimension holds the country/area code
 *   frequencyDimension — Which dimension holds frequency
 *   dimensions       — Default dimension selections (country is often left for user)
 *   defaultCountries — Default countries if user doesn't override
 */
var IMF_QUICK_SERIES = [
  // ---- GDP & Growth ----
  {
    id: "WEO_GDP_GROWTH",
    dataflowId: "WEO",
    agency: "IMF.RES",
    name: "Real GDP Growth (%)",
    sheetName: "WEO GDP Growth",
    category: "GDP & Growth",
    countryDimension: "COUNTRY",
    frequencyDimension: "FREQUENCY",
    dimensions: { INDICATOR: ["NGDP_RPCH"], FREQUENCY: ["A"] },
    defaultCountries: ["USA", "CHN", "DEU", "JPN", "GBR"],
  },
  {
    id: "WEO_GDP_PPP",
    dataflowId: "WEO",
    agency: "IMF.RES",
    name: "GDP, PPP (Intl $, Bn)",
    sheetName: "WEO GDP PPP",
    category: "GDP & Growth",
    countryDimension: "COUNTRY",
    frequencyDimension: "FREQUENCY",
    dimensions: { INDICATOR: ["PPPGDP"], FREQUENCY: ["A"] },
    defaultCountries: ["USA", "CHN", "DEU", "JPN", "GBR"],
  },
  {
    id: "ANEA_GDP",
    dataflowId: "ANEA",
    agency: "IMF.STA",
    name: "GDP, Nominal (National Accounts)",
    sheetName: "NEA GDP",
    category: "GDP & Growth",
    countryDimension: "COUNTRY",
    frequencyDimension: "FREQUENCY",
    dimensions: {
      INDICATOR: ["B1GQ"],
      PRICE_TYPE: ["V"],
      TYPE_OF_TRANSFORMATION: ["XDC"],
      FREQUENCY: ["A"],
    },
    defaultCountries: ["USA"],
  },

  // ---- Prices & Inflation ----
  {
    id: "CPI_INDEX",
    dataflowId: "CPI",
    agency: "IMF.STA",
    name: "Consumer Price Index",
    sheetName: "CPI",
    category: "Prices & Inflation",
    countryDimension: "COUNTRY",
    frequencyDimension: "FREQUENCY",
    dimensions: {
      INDEX_TYPE: ["CPI"],
      COICOP_1999: ["_T"],
      TYPE_OF_TRANSFORMATION: ["IX"],
      FREQUENCY: ["M"],
    },
    defaultOptions: { startPeriod: "1957" },
    defaultCountries: ["USA"],
  },
  {
    id: "CPI_YOY",
    dataflowId: "CPI",
    agency: "IMF.STA",
    name: "CPI, Year-over-Year (%)",
    sheetName: "CPI YoY",
    category: "Prices & Inflation",
    countryDimension: "COUNTRY",
    frequencyDimension: "FREQUENCY",
    dimensions: {
      INDEX_TYPE: ["CPI"],
      COICOP_1999: ["_T"],
      TYPE_OF_TRANSFORMATION: ["YOY_PCH_PA_PT"],
      FREQUENCY: ["M"],
    },
    defaultCountries: ["USA"],
  },
  {
    id: "PPI_INDEX",
    dataflowId: "PPI",
    agency: "IMF.STA",
    name: "Producer Price Index",
    sheetName: "PPI",
    category: "Prices & Inflation",
    countryDimension: "COUNTRY",
    frequencyDimension: "FREQUENCY",
    dimensions: {
      INDICATOR: ["*"],
      TYPE_OF_TRANSFORMATION: ["IX"],
      FREQUENCY: ["M"],
    },
    defaultCountries: ["USA"],
  },
  {
    id: "PCPS_OIL",
    dataflowId: "PCPS",
    agency: "IMF.RES",
    name: "Crude Oil Price (Brent, USD)",
    sheetName: "Oil Brent",
    category: "Prices & Inflation",
    countryDimension: "COUNTRY",
    frequencyDimension: "FREQUENCY",
    dimensions: {
      COUNTRY: ["G001"],
      INDICATOR: ["POILBRE"],
      DATA_TRANSFORMATION: ["USD"],
      FREQUENCY: ["M"],
    },
    defaultCountries: ["G001"],
  },

  // ---- Trade & Balance of Payments ----
  {
    id: "BOP_CA",
    dataflowId: "BOP",
    agency: "IMF.STA",
    name: "Current Account Balance",
    sheetName: "BOP Current Account",
    category: "Trade & BOP",
    countryDimension: "COUNTRY",
    frequencyDimension: "FREQUENCY",
    dimensions: {
      BOP_ACCOUNTING_ENTRY: ["NETCD_T"],
      INDICATOR: ["CAB"],
      UNIT: ["USD"],
      FREQUENCY: ["A"],
    },
    defaultCountries: ["USA"],
  },
  {
    id: "IMTS_TRADE",
    dataflowId: "IMTS",
    agency: "IMF.STA",
    name: "Trade Balance (by Partner)",
    sheetName: "IMTS Trade",
    category: "Trade & BOP",
    countryDimension: "COUNTRY",
    frequencyDimension: "FREQUENCY",
    dimensions: {
      COUNTERPART_COUNTRY: ["*"],
      INDICATOR: ["TBG_USD"],
      FREQUENCY: ["A"],
    },
    defaultCountries: ["USA"],
  },

  // ---- Fiscal ----
  {
    id: "GFS_REVENUE",
    dataflowId: "GFS_SOO",
    agency: "IMF.STA",
    name: "Government Revenue",
    sheetName: "GFS Revenue",
    category: "Fiscal",
    countryDimension: "COUNTRY",
    frequencyDimension: "FREQUENCY",
    dimensions: {
      SECTOR: ["S1311"],
      GFS_GRP: ["G1"],
      INDICATOR: ["G1_T"],
      TYPE_OF_TRANSFORMATION: ["XDC"],
      FREQUENCY: ["A"],
    },
    defaultCountries: ["USA"],
  },
  {
    id: "GDD_DEBT",
    dataflowId: "GDD",
    agency: "IMF.FAD",
    name: "Public Debt (% of GDP)",
    sheetName: "Public Debt",
    category: "Fiscal",
    countryDimension: "COUNTRY",
    frequencyDimension: "FREQUENCY",
    dimensions: {
      INDICATOR: ["FL_S13_POGDP_PT"],
      FREQUENCY: ["A"],
    },
    defaultCountries: ["USA", "JPN", "GBR", "DEU"],
  },

  // ---- Money & Exchange Rates ----
  {
    id: "ER_EXCHANGE",
    dataflowId: "ER",
    agency: "IMF.STA",
    name: "Exchange Rate (per USD)",
    sheetName: "Exchange Rates",
    category: "Money & Rates",
    countryDimension: "COUNTRY",
    frequencyDimension: "FREQUENCY",
    dimensions: {
      INDICATOR: ["XDC_USD", "EUR_XDC"],
      TYPE_OF_TRANSFORMATION: ["PA_RT"],
      FREQUENCY: ["M"],
    },
    defaultCountries: ["GBR", "JPN", "USA"],
  },
  {
    id: "MFS_INTEREST",
    dataflowId: "MFS_IR",
    agency: "IMF.STA",
    name: "Key Interest Rates",
    sheetName: "Interest Rates",
    category: "Money & Rates",
    countryDimension: "COUNTRY",
    frequencyDimension: "FREQUENCY",
    dimensions: {
      INDICATOR: [
        "GBYMIN_RT_PT_A_PT",
        "DISR_RT_PT_A_PT",
        "MFS161_RT_PT_A_PT",
        "MFS151_STO1_NB_S14_RT_PT_A_PT",
        "MFS130_RT_PT_A_PT",
      ],
      FREQUENCY: ["A"],
    },
    defaultOptions: { startPeriod: "2000" },
    defaultCountries: ["USA", "GBR", "JPN", "DEU"],
  },

  // ---- Labor ----
  {
    id: "WEO_UNEMPLOYMENT",
    dataflowId: "WEO",
    agency: "IMF.RES",
    name: "Unemployment Rate (%)",
    sheetName: "WEO Unemployment",
    category: "Labor",
    countryDimension: "COUNTRY",
    frequencyDimension: "FREQUENCY",
    dimensions: { INDICATOR: ["LUR"], FREQUENCY: ["A"] },
    defaultOptions: { startPeriod: "1980" },
    defaultCountries: ["USA", "DEU", "GBR", "FRA", "JPN"],
  },
  {
    id: "LS_LABOR",
    dataflowId: "LS",
    agency: "IMF.STA",
    name: "Labor Statistics",
    sheetName: "LS Labor",
    category: "Labor",
    countryDimension: "COUNTRY",
    frequencyDimension: "FREQUENCY",
    dimensions: {
      INDICATOR: ["*"],
      TYPE_OF_TRANSFORMATION: ["IX"],
      FREQUENCY: ["M"],
    },
    defaultCountries: ["USA"],
  },

  // ---- WEO Forecasts ----
  {
    id: "WEO_INFLATION",
    dataflowId: "WEO",
    agency: "IMF.RES",
    name: "Inflation, Avg. Consumer (%)",
    sheetName: "WEO Inflation",
    category: "WEO Forecasts",
    countryDimension: "COUNTRY",
    frequencyDimension: "FREQUENCY",
    dimensions: { INDICATOR: ["PCPIPCH"], FREQUENCY: ["A"] },
    defaultCountries: ["USA", "CHN", "DEU", "JPN", "GBR"],
  },
  {
    id: "WEO_DEBT_GDP",
    dataflowId: "WEO",
    agency: "IMF.RES",
    name: "Govt Gross Debt (% of GDP)",
    sheetName: "WEO Debt",
    category: "WEO Forecasts",
    countryDimension: "COUNTRY",
    frequencyDimension: "FREQUENCY",
    dimensions: { INDICATOR: ["GGXWDG_NGDP"], FREQUENCY: ["A"] },
    defaultCountries: ["USA", "CHN", "DEU", "JPN", "GBR"],
  },
  {
    id: "WEO_CA_GDP",
    dataflowId: "WEO",
    agency: "IMF.RES",
    name: "Current Account (% of GDP)",
    sheetName: "WEO Current Acct",
    category: "WEO Forecasts",
    countryDimension: "COUNTRY",
    frequencyDimension: "FREQUENCY",
    dimensions: { INDICATOR: ["BCA_NGDPD"], FREQUENCY: ["A"] },
    defaultCountries: ["USA", "CHN", "DEU", "JPN", "GBR"],
  },

  // ---- Environment & Climate ----
  {
    id: "RE_RENEWABLE",
    dataflowId: "RE",
    agency: "IMF.STA",
    name: "Renewable Energy",
    sheetName: "Renewables",
    category: "Environment",
    countryDimension: "COUNTRY",
    frequencyDimension: "FREQUENCY",
    dimensions: {
      INDICATOR: ["EG_GWH"],
      ENERGY_SOURCE: ["*"],
      FREQUENCY: ["A"],
    },
    defaultCountries: ["USA"],
  },
  {
    id: "CCI_CLIMATE",
    dataflowId: "CCI",
    agency: "IMF.STA",
    name: "Climate Change Indicators",
    sheetName: "Climate",
    category: "Environment",
    countryDimension: "COUNTRY",
    frequencyDimension: "FREQUENCY",
    dimensions: {
      INDICATOR: [
        "AMGST_dC",
        "MACDC_PPM",
        "MACDCYOY_PT",
        "NDD_NUM",
        "SLT_MM",
        "SLTP_MM",
      ],
      FREQUENCY: ["A"],
    },
    defaultOptions: { startPeriod: "2000" },
    defaultCountries: ["USA"],
  },
];

/**
 * Get all Quick Fetch presets, organized by category.
 *
 * @returns {Object[]} Array of {category, items: [{id, name, sheetName, defaultCountries}]}
 */
function imf_getQuickPresets() {
  var categories = {};
  for (var i = 0; i < IMF_QUICK_SERIES.length; i++) {
    var s = IMF_QUICK_SERIES[i];
    if (!categories[s.category]) {
      categories[s.category] = [];
    }
    categories[s.category].push({
      id: s.id,
      name: s.name,
      sheetName: s.sheetName,
      defaultCountries: s.defaultCountries,
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
 * Called from the sidebar via google.script.run.
 *
 * @param {string} presetId     Preset ID (e.g. "WEO_GDP_GROWTH").
 * @param {Object} [overrides]  User overrides.
 * @returns {string} Status message.
 */
function imf_runQuickFetch(presetId, overrides) {
  overrides = overrides || {};

  var preset = null;
  for (var i = 0; i < IMF_QUICK_SERIES.length; i++) {
    if (IMF_QUICK_SERIES[i].id === presetId) {
      preset = IMF_QUICK_SERIES[i];
      break;
    }
  }
  if (!preset) {
    throw new Error("Unknown preset: " + presetId);
  }

  return imf_quickFetch(preset, overrides);
}

/**
 * Write a codebook sheet for a Quick Fetch preset.
 *
 * Fetches the full codelist for the preset's dataflow and writes a sheet
 * listing every dimension, its codes, and their human-readable names.
 *
 * @param {string} presetId  Preset ID (e.g. "WEO_GDP_GROWTH").
 * @returns {string} Status message.
 */
function imf_writeQuickCodebook(presetId) {
  var preset = null;
  for (var i = 0; i < IMF_QUICK_SERIES.length; i++) {
    if (IMF_QUICK_SERIES[i].id === presetId) {
      preset = IMF_QUICK_SERIES[i];
      break;
    }
  }
  if (!preset) {
    throw new Error("Unknown preset: " + presetId);
  }

  var allCodes = imf_getAllAvailableCodes(preset.dataflowId, preset.agency);

  var presetFilter = {};
  var dims = preset.dimensions || {};
  for (var dimId in dims) {
    if (dims.hasOwnProperty(dimId)) {
      var vals = dims[dimId];
      if (vals.length === 1 && vals[0] === "*") continue;
      var lookup = {};
      for (var v = 0; v < vals.length; v++) lookup[vals[v]] = true;
      presetFilter[dimId] = lookup;
    }
  }
  var cDim = preset.countryDimension || "COUNTRY";
  if (preset.defaultCountries && preset.defaultCountries.length > 0) {
    var cLookup = {};
    for (var k = 0; k < preset.defaultCountries.length; k++) {
      cLookup[preset.defaultCountries[k]] = true;
    }
    presetFilter[cDim] = cLookup;
  }

  var rows = [["DIMENSION", "CODE", "NAME"]];
  var dimKeys = Object.keys(allCodes);
  dimKeys.sort();

  for (var d = 0; d < dimKeys.length; d++) {
    var dId = dimKeys[d];
    var codes = allCodes[dId] || [];
    var filter = presetFilter[dId];

    for (var c = 0; c < codes.length; c++) {
      var code = codes[c];
      if (filter && !filter[code.id]) continue;
      rows.push([dId, code.id, code.name || code.id]);
    }
    if (codes.length === 0) {
      rows.push([dId, "(all)", "No codelist available"]);
    }
  }

  var sheetName = (preset.sheetName || preset.name) + " Codes";
  return imf_writeListToSheet_(rows, sheetName);
}
