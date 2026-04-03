/**
 * WORLD_BANK_Data.gs — Data retrieval and reshaping for indicator time-series data.
 *
 * Fetches raw observations from the World Bank API and transforms them
 * into 2-D arrays suitable for writing to a Google Sheet.
 */

// ---------------------------------------------------------------------------
// Constants — Indicator preset bundles
// ---------------------------------------------------------------------------

var WB_INDICATOR_PRESETS = {
  economic: {
    label: "Economic Basics",
    codes: [
      "NY.GDP.MKTP.CD",
      "NY.GDP.MKTP.KD.ZG",
      "NY.GDP.PCAP.CD",
      "NY.GNP.MKTP.CD",
      "FP.CPI.TOTL.ZG",
    ],
  },
  demographics: {
    label: "Demographics",
    codes: [
      "SP.POP.TOTL",
      "SP.POP.GROW",
      "SP.URB.TOTL.IN.ZS",
      "SP.DYN.LE00.IN",
      "SP.DYN.TFRT.IN",
    ],
  },
  health: {
    label: "Health",
    codes: ["SP.DYN.IMRT.IN", "SH.DYN.MORT", "SH.XPD.CHEX.GD.ZS"],
  },
  education: {
    label: "Education",
    codes: ["SE.ADT.LITR.ZS", "SE.PRM.ENRR", "SE.SEC.ENRR", "SE.TER.ENRR"],
  },
  trade: {
    label: "Trade",
    codes: [
      "NE.EXP.GNFS.ZS",
      "NE.IMP.GNFS.ZS",
      "NE.TRD.GNFS.ZS",
      "BX.KLT.DINV.WD.GD.ZS",
    ],
  },
};

// ---------------------------------------------------------------------------
// Country group presets
// ---------------------------------------------------------------------------

var WB_COUNTRY_GROUPS = {
  g7: { label: "G7", codes: ["USA", "GBR", "FRA", "DEU", "JPN", "ITA", "CAN"] },
  g20: {
    label: "G20",
    codes: [
      "ARG",
      "AUS",
      "BRA",
      "CAN",
      "CHN",
      "FRA",
      "DEU",
      "IND",
      "IDN",
      "ITA",
      "JPN",
      "KOR",
      "MEX",
      "RUS",
      "SAU",
      "ZAF",
      "TUR",
      "GBR",
      "USA",
    ],
  },
  brics: { label: "BRICS", codes: ["BRA", "RUS", "IND", "CHN", "ZAF"] },
  eu: {
    label: "EU",
    codes: [
      "AUT",
      "BEL",
      "BGR",
      "HRV",
      "CYP",
      "CZE",
      "DNK",
      "EST",
      "FIN",
      "FRA",
      "DEU",
      "GRC",
      "HUN",
      "IRL",
      "ITA",
      "LVA",
      "LTU",
      "LUX",
      "MLT",
      "NLD",
      "POL",
      "PRT",
      "ROU",
      "SVK",
      "SVN",
      "ESP",
      "SWE",
    ],
  },
  nordics: { label: "Nordics", codes: ["DNK", "FIN", "ISL", "NOR", "SWE"] },
  oecd: {
    label: "OECD",
    codes: [
      "AUS",
      "AUT",
      "BEL",
      "CAN",
      "CHL",
      "COL",
      "CRI",
      "CZE",
      "DNK",
      "EST",
      "FIN",
      "FRA",
      "DEU",
      "GRC",
      "HUN",
      "ISL",
      "IRL",
      "ISR",
      "ITA",
      "JPN",
      "KOR",
      "LVA",
      "LTU",
      "LUX",
      "MEX",
      "NLD",
      "NZL",
      "NOR",
      "POL",
      "PRT",
      "SVK",
      "SVN",
      "ESP",
      "SWE",
      "CHE",
      "TUR",
      "GBR",
      "USA",
    ],
  },
};

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

/**
 * Fetch time-series data for a single indicator.
 *
 * @param {string} indicator   — e.g. 'SP.POP.TOTL'
 * @param {string[]} countries — ISO3 codes, or ['all']
 * @param {number|null} startYear
 * @param {number|null} endYear
 * @param {Object} [options]   — { mrv, mrnev, skipAggregates }
 * @return {Object[]} Raw API records: [{country:{id,value}, indicator:{id,value}, date, value}]
 */
function wb_fetchIndicatorData(indicator, countries, startYear, endYear, options) {
  options = options || {};

  var countryCodes =
    countries && countries.length > 0 ? countries.join(";") : "all";
  var resource =
    "country/{countries}/indicator/" + encodeURIComponent(indicator);

  var params = {};
  if (startYear && endYear) {
    params.date = startYear + ":" + endYear;
  } else if (startYear) {
    params.date = String(startYear);
  }

  if (options.mrnev) {
    params.mrnev = options.mrnev;
  } else if (options.mrv) {
    params.mrv = options.mrv;
  }

  var result = wbFetchChunked(resource, countryCodes, params);

  if (result.error) {
    throw new Error("API error for " + indicator + ": " + result.error);
  }

  var data = result.data || [];

  // Filter out aggregates if requested
  if (options.skipAggregates && data.length > 0) {
    var aggregateIds = wb_getAggregateIdSet_();
    data = data.filter(function (row) {
      return !aggregateIds[row.country.id];
    });
  }

  return data;
}

/**
 * Fetch data for multiple indicators in parallel.
 *
 * @param {string[]} indicators
 * @param {string[]} countries
 * @param {number|null} startYear
 * @param {number|null} endYear
 * @param {Object} [options]
 * @return {Object[]} Combined raw records from all indicators.
 */
function wb_fetchMultiIndicatorData(
  indicators,
  countries,
  startYear,
  endYear,
  options,
) {
  options = options || {};

  var countryCodes =
    countries && countries.length > 0 ? countries.join(";") : "all";

  var params = {};
  if (startYear && endYear) {
    params.date = startYear + ":" + endYear;
  } else if (startYear) {
    params.date = String(startYear);
  }

  if (options.mrnev) {
    params.mrnev = options.mrnev;
  } else if (options.mrv) {
    params.mrv = options.mrv;
  }

  // Build URLs for all indicators
  var urls = indicators.map(function (ind) {
    var resource =
      "country/" + countryCodes + "/indicator/" + encodeURIComponent(ind);
    return wb_buildUrl(resource, params);
  });

  // Parallel fetch the first page of each indicator
  var requests = urls.map(function (u) {
    return { url: u, muteHttpExceptions: true };
  });
  var responses = UrlFetchApp.fetchAll(requests);

  var allData = [];
  for (var i = 0; i < responses.length; i++) {
    if (responses[i].getResponseCode() !== 200) continue;
    try {
      var json = JSON.parse(responses[i].getContentText());
      if (!Array.isArray(json) || json.length < 2 || !json[1]) continue;

      var header = json[0];
      var pageData = json[1];
      allData = allData.concat(pageData);

      // Handle pagination for this indicator
      if (header && header.pages && header.pages > 1) {
        var totalPages = parseInt(header.pages, 10);
        for (var p = 2; p <= totalPages; p++) {
          var pageParams = JSON.parse(JSON.stringify(params));
          pageParams.page = p;
          var resource =
            "country/" +
            countryCodes +
            "/indicator/" +
            encodeURIComponent(indicators[i]);
          var pageResult = wbFetch(wb_buildUrl(resource, pageParams));
          if (pageResult.data) {
            allData = allData.concat(pageResult.data);
          }
          Utilities.sleep(WB_RATE_LIMIT_PAUSE);
        }
      }
    } catch (_) {}
  }

  // Filter aggregates
  if (options.skipAggregates && allData.length > 0) {
    var aggregateIds = wb_getAggregateIdSet_();
    allData = allData.filter(function (row) {
      return !aggregateIds[row.country.id];
    });
  }

  return allData;
}

// ---------------------------------------------------------------------------
// Data reshaping
// ---------------------------------------------------------------------------

/**
 * Transform raw API data into a 2-D array for the sheet.
 *
 * @param {Object[]} rawData — from wb_fetchIndicatorData / wb_fetchMultiIndicatorData
 * @param {string} format   — 'long' | 'wide_years' | 'wide_countries' | 'wide_indicators'
 * @return {Array[]} 2-D array including a header row.
 */
function wb_reshapeData(rawData, format) {
  if (!rawData || rawData.length === 0) return [["No data"]];

  format = format || "long";

  switch (format) {
    case "wide_years":
      return wb_reshapeWideYears_(rawData);
    case "wide_countries":
      return wb_reshapeWideCountries_(rawData);
    case "wide_indicators":
      return wb_reshapeWideIndicators_(rawData);
    default:
      return wb_reshapeLong_(rawData);
  }
}

// -- Long format: one row per observation -----------------------------------

function wb_reshapeLong_(rawData) {
  var hasMultipleIndicators = false;
  if (rawData.length > 1) {
    var firstInd = rawData[0].indicator ? rawData[0].indicator.id : "";
    for (var i = 1; i < rawData.length; i++) {
      if (rawData[i].indicator && rawData[i].indicator.id !== firstInd) {
        hasMultipleIndicators = true;
        break;
      }
    }
  }

  var headers = hasMultipleIndicators
    ? [
        "Country Code",
        "Country",
        "Indicator Code",
        "Indicator",
        "Year",
        "Value",
      ]
    : ["Country Code", "Country", "Year", "Value"];

  var rows = [headers];

  rawData.forEach(function (r) {
    var val = r.value !== null && r.value !== undefined ? r.value : "";
    if (hasMultipleIndicators) {
      rows.push([
        r.country.id,
        r.country.value,
        r.indicator.id,
        r.indicator.value,
        r.date,
        val,
      ]);
    } else {
      rows.push([r.country.id, r.country.value, r.date, val]);
    }
  });

  // Sort: country asc, then year asc
  rows.sort(function (a, b) {
    if (a === headers) return -1;
    if (b === headers) return 1;
    var cmp = String(a[0]).localeCompare(String(b[0]));
    if (cmp !== 0) return cmp;
    var yearIdxA = hasMultipleIndicators ? 4 : 2;
    return String(a[yearIdxA]).localeCompare(String(b[yearIdxA]));
  });

  return rows;
}

// -- Wide: countries as rows, years as columns ------------------------------

function wb_reshapeWideYears_(rawData) {
  var yearsSet = {};
  var countriesMap = {}; // id -> name
  var indicatorsMap = {}; // id -> name

  rawData.forEach(function (r) {
    yearsSet[r.date] = true;
    countriesMap[r.country.id] = r.country.value;
    if (r.indicator) indicatorsMap[r.indicator.id] = r.indicator.value;
  });

  var years = Object.keys(yearsSet).sort();
  var countryIds = Object.keys(countriesMap).sort();
  var indicatorIds = Object.keys(indicatorsMap);
  var multiInd = indicatorIds.length > 1;

  // Build lookup: countryId -> indicatorId -> { year -> value }
  var lookup = {};
  rawData.forEach(function (r) {
    var cId = r.country.id;
    var iId = r.indicator ? r.indicator.id : "_";
    if (!lookup[cId]) lookup[cId] = {};
    if (!lookup[cId][iId]) lookup[cId][iId] = {};
    lookup[cId][iId][r.date] =
      r.value !== null && r.value !== undefined ? r.value : "";
  });

  var headers = multiInd
    ? ["Country Code", "Country", "Indicator Code", "Indicator"].concat(years)
    : ["Country Code", "Country"].concat(years);
  var rows = [headers];

  countryIds.forEach(function (cId) {
    var inds = multiInd ? indicatorIds.sort() : ["_"];
    inds.forEach(function (iId) {
      var row = multiInd
        ? [cId, countriesMap[cId], iId, indicatorsMap[iId] || iId]
        : [cId, countriesMap[cId]];
      years.forEach(function (y) {
        var val =
          lookup[cId] && lookup[cId][iId] && lookup[cId][iId][y] !== undefined
            ? lookup[cId][iId][y]
            : "";
        row.push(val);
      });
      rows.push(row);
    });
  });

  return rows;
}

// -- Wide: years as rows, countries as columns ------------------------------

function wb_reshapeWideCountries_(rawData) {
  var yearsSet = {};
  var countriesMap = {};
  var indicatorsMap = {};

  rawData.forEach(function (r) {
    yearsSet[r.date] = true;
    countriesMap[r.country.id] = r.country.value;
    if (r.indicator) indicatorsMap[r.indicator.id] = r.indicator.value;
  });

  var years = Object.keys(yearsSet).sort();
  var countryIds = Object.keys(countriesMap).sort();
  var indicatorIds = Object.keys(indicatorsMap);
  var multiInd = indicatorIds.length > 1;

  // Build lookup: year -> indicatorId -> { countryId -> value }
  var lookup = {};
  rawData.forEach(function (r) {
    var iId = r.indicator ? r.indicator.id : "_";
    if (!lookup[r.date]) lookup[r.date] = {};
    if (!lookup[r.date][iId]) lookup[r.date][iId] = {};
    lookup[r.date][iId][r.country.id] =
      r.value !== null && r.value !== undefined ? r.value : "";
  });

  var countryHeaders = countryIds.map(function (id) {
    return countriesMap[id] + " (" + id + ")";
  });
  var headers = multiInd
    ? ["Year", "Indicator Code", "Indicator"].concat(countryHeaders)
    : ["Year"].concat(countryHeaders);
  var rows = [headers];

  years.forEach(function (y) {
    var inds = multiInd ? indicatorIds.sort() : ["_"];
    inds.forEach(function (iId) {
      var row = multiInd ? [y, iId, indicatorsMap[iId] || iId] : [y];
      countryIds.forEach(function (cId) {
        var val =
          lookup[y] && lookup[y][iId] && lookup[y][iId][cId] !== undefined
            ? lookup[y][iId][cId]
            : "";
        row.push(val);
      });
      rows.push(row);
    });
  });

  return rows;
}

// -- Wide: multiple indicators as columns (rows = country × year) -----------

function wb_reshapeWideIndicators_(rawData) {
  var indicatorsMap = {};
  var keysSet = {}; // "countryId|year" -> { countryId, countryName, year }

  rawData.forEach(function (r) {
    indicatorsMap[r.indicator.id] = r.indicator.value;
    var key = r.country.id + "|" + r.date;
    if (!keysSet[key]) {
      keysSet[key] = {
        countryId: r.country.id,
        countryName: r.country.value,
        year: r.date,
      };
    }
  });

  var indicatorIds = Object.keys(indicatorsMap).sort();
  var keys = Object.keys(keysSet).sort();

  // Build lookup: "countryId|year" -> { indicatorId -> value }
  var lookup = {};
  rawData.forEach(function (r) {
    var key = r.country.id + "|" + r.date;
    if (!lookup[key]) lookup[key] = {};
    lookup[key][r.indicator.id] =
      r.value !== null && r.value !== undefined ? r.value : "";
  });

  var headers = ["Country Code", "Country", "Year"].concat(
    indicatorIds.map(function (id) {
      return indicatorsMap[id] + " (" + id + ")";
    }),
  );
  var rows = [headers];

  keys.forEach(function (k) {
    var info = keysSet[k];
    var row = [info.countryId, info.countryName, info.year];
    indicatorIds.forEach(function (iId) {
      row.push(lookup[k] && lookup[k][iId] !== undefined ? lookup[k][iId] : "");
    });
    rows.push(row);
  });

  return rows;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a set of aggregate economy IDs for fast lookup.
 */
function wb_getAggregateIdSet_() {
  var set = {};
  try {
    var all = wb_getCountries();
    all.forEach(function (c) {
      if (c.isAggregate) set[c.id] = true;
    });
  } catch (_) {}
  return set;
}
