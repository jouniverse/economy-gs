// ---------------------------------------------------------------------------
// OECD_Parse.gs — Parse SDMX JSON responses into flat row arrays
// ---------------------------------------------------------------------------

/**
 * Parse an SDMX JSON data response into an array of row objects.
 *
 * Uses dimensionAtObservation=AllDimensions format where every observation
 * key encodes ALL dimensions (including TIME_PERIOD) as colon-separated
 * indices: data.dataSets[0].observations["0:1:2:3:4:5"] = [value, ...]
 *
 * This avoids the duplicate-series-key bug that the OECD API produces
 * in TIME_PERIOD observation mode for certain multi-country queries.
 *
 * @param {Object} jsonResponse  Parsed JSON from the data endpoint.
 * @returns {Object} { headers: string[], rows: any[][], dimensions: string[] }
 * @private
 */
function oecd_parseSdmxJson_(jsonResponse) {
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

  var allDims = structure.dimensions.observation || [];

  var headers = [];
  var dimensionIds = [];
  for (var d = 0; d < allDims.length; d++) {
    headers.push(allDims[d].id);
    dimensionIds.push(allDims[d].id);
  }
  headers.push("OBS_VALUE");

  var timeColIdx = -1;
  for (var ti = 0; ti < allDims.length; ti++) {
    if (allDims[ti].id === "TIME_PERIOD") {
      timeColIdx = ti;
      break;
    }
  }

  var rows = [];
  var observations = dataSet.observations || {};

  for (var obsKey in observations) {
    if (!observations.hasOwnProperty(obsKey)) continue;

    var obsArray = observations[obsKey];
    var indices = obsKey.split(":");

    var row = [];
    for (var di = 0; di < allDims.length; di++) {
      var idx = parseInt(indices[di], 10);
      var dimValues = allDims[di].values || [];
      if (!isNaN(idx) && idx < dimValues.length) {
        row.push(dimValues[idx].id || dimValues[idx].value || "");
      } else {
        row.push("");
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

    row.push(obsValue);
    rows.push(row);
  }

  if (timeColIdx >= 0) {
    rows.sort(function (a, b) {
      if (a[timeColIdx] < b[timeColIdx]) return -1;
      if (a[timeColIdx] > b[timeColIdx]) return 1;
      if (a[0] < b[0]) return -1;
      if (a[0] > b[0]) return 1;
      return 0;
    });
  }

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
 * Omitted dimensions use empty string (wildcard = all values).
 *
 * Example:
 *   dsdDimensions = [{id:"FREQ",position:0}, {id:"REF_AREA",position:1}, {id:"MEASURE",position:2}]
 *   userDimensions = {REF_AREA: ["USA","DEU"], FREQ: ["A"]}
 * Result: "A.USA+DEU."
 *
 * @param {Object} userDimensions  Map of dimension ID → array of selected codes.
 * @param {Array}  dsdDimensions   Array of {id, position, type} from the DSD (non-time dims).
 * @returns {string} Dot-separated SDMX key.
 * @private
 */
function oecd_buildSeriesKey_(userDimensions, dsdDimensions) {
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
      parts.push("");
    }
  }

  return parts.join(".");
}
