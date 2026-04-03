// ---------------------------------------------------------------------------
// OECD_Quick.gs — Pre-configured Quick Fetch series
// ---------------------------------------------------------------------------

/**
 * Quick Fetch preset definitions.
 *
 * Each preset specifies:
 *   dataflowId         — OECD dataset ID (e.g. "DSD_NAAG@DF_NAAG_I")
 *   agency             — Agency ID (e.g. "OECD.SDD.NAD")
 *   name               — Display name
 *   sheetName          — Default sheet name for output
 *   category           — UI grouping category
 *   countryDimension   — Which dimension holds the country/area code
 *   frequencyDimension — Which dimension holds frequency
 *   dimensions         — Default dimension selections (country often left for user)
 *   defaultCountries   — Default countries if user doesn't override
 *   defaultOptions     — Default query options (startPeriod, etc.)
 */
var OECD_QUICK_SERIES = [
  // ---- GDP & Growth ----
  {
    id: "NAAG_GDP_GROWTH",
    dataflowId: "DSD_NAAG@DF_NAAG_I",
    agency: "OECD.SDD.NAD",
    name: "Real GDP Growth (%)",
    sheetName: "GDP Growth",
    category: "GDP & Growth",
    countryDimension: "REF_AREA",
    frequencyDimension: "FREQ",
    dimensions: {
      FREQ: ["A"],
      MEASURE: ["B1GQ_R_GR"],
      UNIT_MEASURE: [],
      CHAPTER: [],
    },
    defaultCountries: ["USA", "DEU", "JPN", "GBR", "FRA"],
  },
  {
    id: "QNA_GDP",
    dataflowId: "DSD_NAMAIN1@DF_QNA",
    agency: "OECD.SDD.NAD",
    name: "Quarterly GDP",
    sheetName: "Quarterly GDP",
    category: "GDP & Growth",
    countryDimension: "REF_AREA",
    frequencyDimension: "FREQ",
    dimensions: {
      FREQ: ["Q"],
    },
    defaultOptions: { startPeriod: "2020" },
    defaultCountries: ["USA", "DEU", "JPN", "GBR"],
  },
  {
    id: "EO_GDP_GROWTH",
    dataflowId: "DSD_EO@DF_EO",
    agency: "OECD.ECO.MAD",
    name: "GDP Growth — Economic Outlook",
    sheetName: "EO GDP Growth",
    category: "GDP & Growth",
    countryDimension: "REF_AREA",
    frequencyDimension: "FREQ",
    dimensions: {
      MEASURE: ["GDPV_ANNPCT"],
      FREQ: ["A"],
    },
    defaultCountries: ["USA", "CHN", "DEU", "JPN", "GBR"],
  },

  // ---- Prices & Inflation ----
  {
    id: "CPI_ALL",
    dataflowId: "DSD_PRICES@DF_PRICES_ALL",
    agency: "OECD.SDD.TPS",
    name: "CPI, All Items (% change)",
    sheetName: "CPI",
    category: "Prices & Inflation",
    countryDimension: "REF_AREA",
    frequencyDimension: "FREQ",
    dimensions: {
      FREQ: ["M"],
      METHODOLOGY: ["N"],
      MEASURE: ["CPI"],
      UNIT_MEASURE: ["PA"],
      EXPENDITURE: ["_T"],
      ADJUSTMENT: ["N"],
      TRANSFORMATION: ["GY"],
    },
    defaultOptions: { startPeriod: "2020" },
    defaultCountries: ["USA", "DEU", "JPN", "GBR"],
  },
  {
    id: "G20_CPI",
    dataflowId: "DSD_G20_PRICES@DF_G20_PRICES",
    agency: "OECD.SDD.TPS",
    name: "G20 Consumer Price Indices",
    sheetName: "G20 CPI",
    category: "Prices & Inflation",
    countryDimension: "REF_AREA",
    frequencyDimension: "FREQ",
    dimensions: {
      FREQ: ["M"],
    },
    defaultOptions: { startPeriod: "2020" },
    defaultCountries: ["USA", "DEU", "JPN", "GBR", "CHN"],
  },

  // ---- Labour Market ----
  {
    id: "UNE_MONTHLY",
    dataflowId: "DSD_LFS@DF_IALFS_UNE_M",
    agency: "OECD.SDD.TPS",
    name: "Unemployment Rate (Monthly)",
    sheetName: "Unemployment",
    category: "Labour Market",
    countryDimension: "REF_AREA",
    frequencyDimension: "FREQ",
    dimensions: {
      MEASURE: ["UNE_LF_M"],
      UNIT_MEASURE: ["PT_LF_SUB"],
      TRANSFORMATION: ["_Z"],
      ADJUSTMENT: ["Y"],
      SEX: ["_T"],
      AGE: ["Y_GE15"],
      ACTIVITY: ["_Z"],
      FREQ: ["M"],
    },
    defaultOptions: { startPeriod: "2020" },
    defaultCountries: ["USA", "DEU", "GBR", "FRA", "JPN"],
  },
  {
    id: "EMP_RATE",
    dataflowId: "DSD_LFS@DF_IALFS_EMP_WAP_Q",
    agency: "OECD.SDD.TPS",
    name: "Employment Rate (Quarterly)",
    sheetName: "Employment Rate",
    category: "Labour Market",
    countryDimension: "REF_AREA",
    frequencyDimension: "FREQ",
    dimensions: {
      FREQ: ["Q"],
      SEX: ["_T"],
      AGE: ["Y15T64"],
    },
    defaultOptions: { startPeriod: "2020" },
    defaultCountries: ["USA", "DEU", "GBR", "FRA", "JPN"],
  },

  // ---- Trade & Balance of Payments ----
  {
    id: "BOP_CA",
    dataflowId: "DSD_BOP@DF_BOP",
    agency: "OECD.SDD.TPS",
    name: "Current Account Balance",
    sheetName: "Current Account",
    category: "Trade & BOP",
    countryDimension: "REF_AREA",
    frequencyDimension: "FREQ",
    dimensions: {
      FREQ: ["A"],
    },
    defaultCountries: ["USA", "DEU", "JPN", "GBR"],
  },

  // ---- Short-term Indicators ----
  {
    id: "CLI",
    dataflowId: "DSD_STES@DF_CLI",
    agency: "OECD.SDD.STES",
    name: "Composite Leading Indicators",
    sheetName: "CLI",
    category: "Short-term Indicators",
    countryDimension: "REF_AREA",
    frequencyDimension: "FREQ",
    dimensions: {
      FREQ: ["M"],
    },
    defaultOptions: { startPeriod: "2020" },
    defaultCountries: ["USA", "DEU", "JPN", "GBR", "CHN"],
  },
  {
    id: "KEI",
    dataflowId: "DSD_KEI@DF_KEI",
    agency: "OECD.SDD.STES",
    name: "Key Short-term Economic Indicators",
    sheetName: "KEI",
    category: "Short-term Indicators",
    countryDimension: "REF_AREA",
    frequencyDimension: "FREQ",
    dimensions: {
      FREQ: ["M"],
    },
    defaultOptions: { startPeriod: "2023" },
    defaultCountries: ["USA", "DEU", "JPN"],
  },

  // ---- Finance ----
  {
    id: "FINMARK",
    dataflowId: "DSD_STES@DF_FINMARK",
    agency: "OECD.SDD.STES",
    name: "Financial Market Indicators",
    sheetName: "Financial Market",
    category: "Finance",
    countryDimension: "REF_AREA",
    frequencyDimension: "FREQ",
    dimensions: {
      FREQ: ["M"],
    },
    defaultOptions: { startPeriod: "2020" },
    defaultCountries: ["USA", "DEU", "JPN", "GBR"],
  },

  // ---- Productivity ----
  {
    id: "PDB_PRODUCTIVITY",
    dataflowId: "DSD_PDB@DF_PDB",
    agency: "OECD.SDD.TPS",
    name: "Productivity Statistics",
    sheetName: "Productivity",
    category: "Productivity",
    countryDimension: "REF_AREA",
    frequencyDimension: "FREQ",
    dimensions: {
      FREQ: ["A"],
    },
    defaultCountries: ["USA", "DEU", "JPN", "GBR", "FRA"],
  },

  // ---- Economic Outlook ----
  {
    id: "EO_INFLATION",
    dataflowId: "DSD_EO@DF_EO",
    agency: "OECD.ECO.MAD",
    name: "Inflation — Economic Outlook",
    sheetName: "EO Inflation",
    category: "Economic Outlook",
    countryDimension: "REF_AREA",
    frequencyDimension: "FREQ",
    dimensions: {
      MEASURE: ["CPI_YTYPCT"],
      FREQ: ["A"],
    },
    defaultCountries: ["USA", "DEU", "JPN", "GBR", "FRA"],
  },
  {
    id: "EO_UNEMPLOYMENT",
    dataflowId: "DSD_EO@DF_EO",
    agency: "OECD.ECO.MAD",
    name: "Unemployment — Economic Outlook",
    sheetName: "EO Unemployment",
    category: "Economic Outlook",
    countryDimension: "REF_AREA",
    frequencyDimension: "FREQ",
    dimensions: {
      MEASURE: ["UNR"],
      FREQ: ["A"],
    },
    defaultOptions: { startPeriod: "2000" },
    defaultCountries: ["USA", "DEU", "JPN", "GBR", "FRA"],
  },
  {
    id: "EO_CA_GDP",
    dataflowId: "DSD_EO@DF_EO",
    agency: "OECD.ECO.MAD",
    name: "Current Account (% GDP) — EO",
    sheetName: "EO Current Acct",
    category: "Economic Outlook",
    countryDimension: "REF_AREA",
    frequencyDimension: "FREQ",
    dimensions: {
      MEASURE: ["CBGDPR"],
      FREQ: ["A"],
    },
    defaultCountries: ["USA", "DEU", "JPN", "GBR", "CHN"],
  },
  {
    id: "EO_DEBT_GDP",
    dataflowId: "DSD_EO@DF_EO",
    agency: "OECD.ECO.MAD",
    name: "Govt Gross Debt (% GDP) — EO",
    sheetName: "EO Govt Debt",
    category: "Economic Outlook",
    countryDimension: "REF_AREA",
    frequencyDimension: "FREQ",
    dimensions: {
      MEASURE: ["GGFLQ"],
      FREQ: ["A"],
    },
    defaultCountries: ["USA", "DEU", "JPN", "GBR", "FRA"],
  },

  // ---- Society ----
  {
    id: "IDD_GINI",
    dataflowId: "DSD_WISE_IDD@DF_IDD",
    agency: "OECD.WISE.INE",
    name: "Income Distribution (Gini)",
    sheetName: "Gini",
    category: "Society",
    countryDimension: "REF_AREA",
    frequencyDimension: "FREQ",
    dimensions: {
      FREQ: ["A"],
    },
    defaultCountries: ["USA", "DEU", "GBR", "FRA", "SWE"],
  },
  {
    id: "HOUSE_PRICES",
    dataflowId: "DSD_AN_HOUSE_PRICES@DF_HOUSE_PRICES",
    agency: "OECD.ECO.MPD",
    name: "House Price Indicators",
    sheetName: "House Prices",
    category: "Society",
    countryDimension: "REF_AREA",
    frequencyDimension: "FREQ",
    dimensions: {
      FREQ: ["Q"],
    },
    defaultOptions: { startPeriod: "2015" },
    defaultCountries: ["USA", "DEU", "GBR", "FRA", "JPN"],
  },
];

/** Common code labels for human-readable Quick Fetch descriptions. @private */
var OECD_QUICK_LABELS_ = {
  AUS: "Australia",
  AUT: "Austria",
  BEL: "Belgium",
  CAN: "Canada",
  CHL: "Chile",
  COL: "Colombia",
  CRI: "Costa Rica",
  CZE: "Czechia",
  DNK: "Denmark",
  EST: "Estonia",
  FIN: "Finland",
  FRA: "France",
  DEU: "Germany",
  GRC: "Greece",
  HUN: "Hungary",
  ISL: "Iceland",
  IRL: "Ireland",
  ISR: "Israel",
  ITA: "Italy",
  JPN: "Japan",
  KOR: "Korea",
  LVA: "Latvia",
  LTU: "Lithuania",
  LUX: "Luxembourg",
  MEX: "Mexico",
  NLD: "Netherlands",
  NZL: "New Zealand",
  NOR: "Norway",
  POL: "Poland",
  PRT: "Portugal",
  SVK: "Slovak Republic",
  SVN: "Slovenia",
  ESP: "Spain",
  SWE: "Sweden",
  CHE: "Switzerland",
  TUR: "Türkiye",
  GBR: "United Kingdom",
  USA: "United States",
  BRA: "Brazil",
  CHN: "China",
  IND: "India",
  IDN: "Indonesia",
  RUS: "Russia",
  ZAF: "South Africa",
  A: "Annual",
  Q: "Quarterly",
  M: "Monthly",
  B1GQ_R_GR: "Real GDP growth rate",
  CPI_YTYPCT: "Headline inflation (y/y)",
  GDPV_ANNPCT: "GDP volume growth",
  UNR: "Unemployment rate",
  CBGDPR: "Current account (% GDP)",
  GGFLQ: "Govt gross debt (% GDP)",
  UNE_LF_M: "Monthly unemployment rate",
  CPI: "Consumer prices",
  PA: "% change",
  GY: "Growth (y/y)",
  _T: "Total",
  _Z: "Not applicable",
  Y: "Seasonally adjusted",
  N: "Not adjusted",
  Y_GE15: "15+",
  Y15T64: "15\u201364",
  PT_LF_SUB: "% of labour force",
};

/** Friendly names for dimension IDs. @private */
var OECD_DIM_LABELS_ = {
  REF_AREA: "Countries",
  FREQ: "Frequency",
  MEASURE: "Indicator",
  UNIT_MEASURE: "Unit",
  ADJUSTMENT: "Adjustment",
  SEX: "Sex",
  AGE: "Age group",
  TRANSFORMATION: "Transform",
  METHODOLOGY: "Methodology",
  EXPENDITURE: "Expenditure",
  ACTIVITY: "Activity",
  CHAPTER: "Chapter",
  ACCOUNTING_ENTRY: "Accounting entry",
  ASSET_CODE: "Asset",
  CONVERSION_TYPE: "Conversion type",
  COUNTERPART_AREA: "Counterpart area",
  COUNTERPART_SECTOR: "Counterpart sector",
  DEFINITION: "Definition",
  FS_ENTRY: "Financial statement",
  INSTR_ASSET: "Instrument/Asset",
  POVERTY_LINE: "Poverty line",
  PRICE_BASE: "Price base",
  SECTOR: "Sector",
  STATISTICAL_OPERATION: "Statistical operation",
  TABLE_IDENTIFIER: "Table",
  TIME_HORIZ: "Time horizon",
  TRANSACTION: "Transaction",
};

/**
 * Get all Quick Fetch presets, organized by category.
 *
 * @returns {Object[]} Array of {category, items: [{id, name, sheetName, defaultCountries}]}
 */
function oecd_getQuickPresets() {
  var categories = {};
  for (var i = 0; i < OECD_QUICK_SERIES.length; i++) {
    var s = OECD_QUICK_SERIES[i];
    if (!categories[s.category]) {
      categories[s.category] = [];
    }

    var dimSummary = [];
    for (var dimKey in s.dimensions) {
      if (s.dimensions.hasOwnProperty(dimKey)) {
        var vals = s.dimensions[dimKey];
        if (vals && vals.length > 0) {
          var resolvedVals = vals.map(function (v) {
            return OECD_QUICK_LABELS_[v] || v;
          });
          dimSummary.push({
            dim: OECD_DIM_LABELS_[dimKey] || dimKey,
            values: resolvedVals.join(", "),
          });
        }
      }
    }
    if (s.defaultCountries && s.defaultCountries.length > 0) {
      var resolvedCountries = s.defaultCountries.map(function (c) {
        return OECD_QUICK_LABELS_[c] || c;
      });
      dimSummary.unshift({
        dim: "Countries",
        values: resolvedCountries.join(", "),
      });
    }
    if (s.defaultOptions) {
      var opts = s.defaultOptions;
      if (opts.startPeriod) {
        dimSummary.push({ dim: "Start", values: opts.startPeriod });
      }
      if (opts.endPeriod) {
        dimSummary.push({ dim: "End", values: opts.endPeriod });
      }
    }

    categories[s.category].push({
      id: s.id,
      name: s.name,
      sheetName: s.sheetName,
      dataflowId: s.dataflowId,
      defaultCountries: s.defaultCountries,
      dimSummary: dimSummary,
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
 * @param {string} presetId     Preset ID (e.g. "NAAG_GDP_GROWTH").
 * @param {Object} [overrides]  User overrides.
 * @returns {string} Status message.
 */
function oecd_runQuickFetch(presetId, overrides) {
  overrides = overrides || {};

  var preset = null;
  for (var i = 0; i < OECD_QUICK_SERIES.length; i++) {
    if (OECD_QUICK_SERIES[i].id === presetId) {
      preset = OECD_QUICK_SERIES[i];
      break;
    }
  }
  if (!preset) {
    throw new Error("Unknown preset: " + presetId);
  }

  return oecd_quickFetch(preset, overrides);
}

/**
 * Write a codebook sheet for a Quick Fetch preset.
 *
 * Uses detail=serieskeysonly to query the exact same data as the preset's
 * default fetch, returning only the dimension values that actually appear
 * in the matching data — not the full codelist. This ensures the codebook
 * accurately reflects what the user gets when clicking "Fetch".
 *
 * @param {string} presetId  Preset ID (e.g. "NAAG_GDP_GROWTH").
 * @returns {string} Status message.
 */
function oecd_writeQuickCodebook(presetId) {
  var preset = null;
  for (var i = 0; i < OECD_QUICK_SERIES.length; i++) {
    if (OECD_QUICK_SERIES[i].id === presetId) {
      preset = OECD_QUICK_SERIES[i];
      break;
    }
  }
  if (!preset) {
    throw new Error("Unknown preset: " + presetId);
  }

  var dims = {};
  for (var key in preset.dimensions) {
    if (preset.dimensions.hasOwnProperty(key)) {
      dims[key] = preset.dimensions[key].slice();
    }
  }
  var countryDim = preset.countryDimension || "REF_AREA";
  if (
    preset.defaultCountries &&
    preset.defaultCountries.length > 0 &&
    !dims[countryDim]
  ) {
    dims[countryDim] = preset.defaultCountries.slice();
  }

  var dsd = oecd_getDataStructure(preset.dataflowId, preset.agency);
  var nonTimeDims = dsd.dimensions.filter(function (d) {
    return d.type !== "TimeDimension";
  });
  var seriesKey = oecd_buildSeriesKey_(dims, nonTimeDims);

  var path =
    "data/" +
    dsd.agency +
    "," +
    preset.dataflowId +
    "," +
    dsd.version +
    "/" +
    seriesKey;

  var params = {
    dimensionAtObservation: "AllDimensions",
    detail: "serieskeysonly",
  };
  var defaultOpts = preset.defaultOptions || {};
  if (defaultOpts.startPeriod) params.startPeriod = defaultOpts.startPeriod;
  if (defaultOpts.endPeriod) params.endPeriod = defaultOpts.endPeriod;

  var response = oecdFetchData_(path, params);

  var structures = (response.data && response.data.structures) || [];
  var dimValues = {};
  if (structures.length > 0) {
    var obsDims =
      (structures[0].dimensions && structures[0].dimensions.observation) || [];
    for (var o = 0; o < obsDims.length; o++) {
      var od = obsDims[o];
      if (od.id === "TIME_PERIOD") continue;
      var vals = od.values || [];
      dimValues[od.id] = vals.map(function (v) {
        return { id: v.id, name: v.name || v.id };
      });
    }
  }

  var rows = [["DIMENSION", "DIMENSION_NAME", "CODE", "NAME"]];
  for (var d = 0; d < nonTimeDims.length; d++) {
    var dimId = nonTimeDims[d].id;
    var dimLabel = OECD_DIM_LABELS_[dimId] || dimId;
    var codes = dimValues[dimId] || [];
    codes.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
    for (var c = 0; c < codes.length; c++) {
      rows.push([dimId, dimLabel, codes[c].id, codes[c].name]);
    }
  }

  var sheetName = (preset.sheetName || preset.name) + " Codes";
  return oecd_writeListToSheet_(rows, sheetName);
}
