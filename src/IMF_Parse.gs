// ---------------------------------------------------------------------------
// IMF_Parse.gs — Parse SDMX JSON responses into flat row arrays
// ---------------------------------------------------------------------------

/**
 * Parse an SDMX JSON data response into an array of row objects.
 *
 * The SDMX JSON format encodes series as index-based keys:
 *   dataSets[0].series["0:1:2"] → observations["0"] = [value, ...]
 *   structures[0].dimensions.series[i].values[idx] → {id, name}
 *   structures[0].dimensions.observation[0].values[idx] → {value}
 *
 * @param {Object} jsonResponse  Parsed JSON from the data endpoint.
 * @returns {Object} { headers: string[], rows: any[][], dimensions: string[] }
 * @private
 */
function imf_parseSdmxJson_(jsonResponse) {
  var dataSets = jsonResponse.data.dataSets;
  var structures = jsonResponse.data.structures;

  if (
    !dataSets ||
    dataSets.length === 0 ||
    !structures ||
    structures.length === 0
  ) {
    return { headers: [], rows: [], dimensions: [] };
  }

  var dataSet = dataSets[0];
  var structure = structures[0];

  var seriesDims = structure.dimensions.series || [];
  var obsDims = structure.dimensions.observation || [];

  var headers = [];
  var dimensionIds = [];
  for (var d = 0; d < seriesDims.length; d++) {
    headers.push(seriesDims[d].id);
    dimensionIds.push(seriesDims[d].id);
  }
  for (var t = 0; t < obsDims.length; t++) {
    headers.push(obsDims[t].id);
    dimensionIds.push(obsDims[t].id);
  }
  headers.push("OBS_VALUE");

  var rows = [];
  var seriesObj = dataSet.series || {};

  for (var seriesKey in seriesObj) {
    if (!seriesObj.hasOwnProperty(seriesKey)) continue;

    var series = seriesObj[seriesKey];

    var seriesIndices = seriesKey.split(":");
    var seriesValues = [];
    for (var s = 0; s < seriesDims.length; s++) {
      var idx = parseInt(seriesIndices[s], 10);
      var dimValues = seriesDims[s].values || [];
      if (!isNaN(idx) && idx < dimValues.length) {
        seriesValues.push(dimValues[idx].id || dimValues[idx].value || "");
      } else {
        seriesValues.push("");
      }
    }

    var observations = series.observations || {};
    for (var obsKey in observations) {
      if (!observations.hasOwnProperty(obsKey)) continue;

      var obsIdx = parseInt(obsKey, 10);
      var obsArray = observations[obsKey];

      var obsValues = [];
      for (var ot = 0; ot < obsDims.length; ot++) {
        var obsVals = obsDims[ot].values || [];
        if (!isNaN(obsIdx) && obsIdx < obsVals.length) {
          obsValues.push(obsVals[obsIdx].value || obsVals[obsIdx].id || "");
        } else {
          obsValues.push("");
        }
      }

      var obsValue = "";
      if (obsArray && obsArray.length > 0 && obsArray[0] !== null) {
        var raw = obsArray[0];
        if (
          raw === "." ||
          raw === "NA" ||
          raw === "NP" ||
          raw === "ND" ||
          raw === "N/A"
        ) {
          obsValue = "";
        } else {
          var num = parseFloat(raw);
          obsValue = isNaN(num) ? "" : num;
        }
      }

      var row = seriesValues.concat(obsValues);
      row.push(obsValue);
      rows.push(row);
    }
  }

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
    dimensions: dimensionIds,
  };
}

// ---------------------------------------------------------------------------
// Key building
// ---------------------------------------------------------------------------

/**
 * Build an SDMX series key from user-selected dimension values.
 *
 * Dimensions are ordered according to the DSD positions.
 * Multiple values per position are joined with "+".
 * Omitted dimensions are wildcarded with "*".
 *
 * @param {Object} userDimensions  Map of dimension ID → array of selected codes.
 * @param {Array}  dsdDimensions   Array of {id, position, type} from the DSD (non-time dims).
 * @returns {string} Dot-separated SDMX key.
 * @private
 */
function imf_buildSeriesKey_(userDimensions, dsdDimensions) {
  userDimensions = userDimensions || {};

  var sorted = dsdDimensions.slice().sort(function (a, b) {
    return a.position - b.position;
  });

  var parts = [];
  for (var i = 0; i < sorted.length; i++) {
    var dim = sorted[i];
    if (dim.type === "TimeDimension") continue;

    var values = userDimensions[dim.id];
    if (values && values.length > 0) {
      parts.push(values.join("+"));
    } else {
      parts.push("*");
    }
  }

  return parts.join(".");
}
