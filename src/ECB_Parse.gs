// ---------------------------------------------------------------------------
// ECB_Parse.gs — Parse SDMX-JSON 1.0.0 data responses into flat row arrays
// ---------------------------------------------------------------------------

/**
 * Parse an ECB SDMX-JSON 1.0.0 data response into flat rows.
 *
 * ECB JSON structure (SDMX-JSON 1.0.0):
 *   structure.dimensions.series[]       — series-level dimensions
 *   structure.dimensions.observation[]   — observation-level (TIME_PERIOD)
 *   dataSets[0].series{"0:1:2:3": {observations: {"0": [value]}}}
 *
 * Series keys use colon separators, dimension values are index-based.
 *
 * @param {Object} json  Parsed JSON from the data endpoint.
 * @returns {Object} { headers: string[], rows: any[][] }
 * @private
 */
function ecb_parseSdmxJson_(json) {
  var dataSets = json.dataSets;
  var structure = json.structure;

  if (!dataSets || dataSets.length === 0 || !structure) {
    return { headers: [], rows: [] };
  }

  var dataSet = dataSets[0];

  // Series dimensions (FREQ, CURRENCY, etc.)
  var seriesDims = (structure.dimensions && structure.dimensions.series) || [];
  // Observation dimensions (TIME_PERIOD)
  var obsDims =
    (structure.dimensions && structure.dimensions.observation) || [];

  // Build headers: dim_id for each series dim, then obs dims, then OBS_VALUE
  var headers = [];
  for (var d = 0; d < seriesDims.length; d++) {
    headers.push(seriesDims[d].id);
  }
  for (var t = 0; t < obsDims.length; t++) {
    headers.push(obsDims[t].id);
  }
  headers.push("OBS_VALUE");

  // Parse all series
  var rows = [];
  var seriesObj = dataSet.series || {};

  for (var seriesKey in seriesObj) {
    if (!seriesObj.hasOwnProperty(seriesKey)) continue;

    var series = seriesObj[seriesKey];

    // Decode series key: "0:1:2:3" → indices
    var seriesIndices = seriesKey.split(":");
    var seriesValues = [];
    for (var s = 0; s < seriesDims.length; s++) {
      var idx = parseInt(seriesIndices[s], 10);
      var dimValues = seriesDims[s].values || [];
      if (!isNaN(idx) && idx < dimValues.length) {
        seriesValues.push(dimValues[idx].id || dimValues[idx].name || "");
      } else {
        seriesValues.push("");
      }
    }

    // Parse observations
    var observations = series.observations || {};
    for (var obsKey in observations) {
      if (!observations.hasOwnProperty(obsKey)) continue;

      var obsIdx = parseInt(obsKey, 10);
      var obsArray = observations[obsKey];

      // Get observation dimension values (TIME_PERIOD)
      var obsValues = [];
      for (var ot = 0; ot < obsDims.length; ot++) {
        var obsVals = obsDims[ot].values || [];
        if (!isNaN(obsIdx) && obsIdx < obsVals.length) {
          obsValues.push(obsVals[obsIdx].id || obsVals[obsIdx].name || "");
        } else {
          obsValues.push("");
        }
      }

      // OBS_VALUE is the first element
      var obsValue = "";
      if (obsArray && obsArray.length > 0 && obsArray[0] !== null) {
        var raw = obsArray[0];
        if (typeof raw === "number") {
          obsValue = raw;
        } else {
          var str = String(raw);
          if (
            str === "." ||
            str === "NA" ||
            str === "NP" ||
            str === "ND" ||
            str === "N/A"
          ) {
            obsValue = "";
          } else {
            var num = parseFloat(str);
            obsValue = isNaN(num) ? "" : num;
          }
        }
      }

      var row = seriesValues.concat(obsValues);
      row.push(obsValue);
      rows.push(row);
    }
  }

  // Sort by time period (first observation dimension), then by first series dim
  var timeColIdx = seriesDims.length;
  rows.sort(function (a, b) {
    if (a[timeColIdx] < b[timeColIdx]) return -1;
    if (a[timeColIdx] > b[timeColIdx]) return 1;
    if (a[0] < b[0]) return -1;
    if (a[0] > b[0]) return 1;
    return 0;
  });

  return {
    headers: headers,
    rows: rows,
  };
}

// ---------------------------------------------------------------------------
// Key building
// ---------------------------------------------------------------------------

/**
 * Build an SDMX 2.1 series key from user-selected dimension values.
 *
 * ECB uses dot-separated keys: "D.USD+GBP.EUR.SP00.A"
 * Multi-select uses "+", empty = wildcard (omitted).
 *
 * @param {Object} userDimensions  Map of dimension ID → array of selected codes.
 * @param {Array}  dsdDimensions   Array of {id, position, type} from the DSD.
 * @returns {string} Dot-separated SDMX key.
 * @private
 */
function ecb_buildSeriesKey_(userDimensions, dsdDimensions) {
  userDimensions = userDimensions || {};

  // Sort by position, exclude time dimensions
  var sorted = dsdDimensions
    .filter(function (d) {
      return d.type !== "TimeDimension";
    })
    .sort(function (a, b) {
      return a.position - b.position;
    });

  var parts = [];
  for (var i = 0; i < sorted.length; i++) {
    var dim = sorted[i];
    var values = userDimensions[dim.id];
    if (values && values.length > 0) {
      parts.push(values.join("+"));
    } else {
      parts.push(""); // wildcard (empty)
    }
  }

  // Trim trailing empty wildcards
  while (parts.length > 0 && parts[parts.length - 1] === "") {
    parts.pop();
  }

  return parts.join(".");
}
