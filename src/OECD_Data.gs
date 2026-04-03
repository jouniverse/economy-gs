// ---------------------------------------------------------------------------
// OECD_Data.gs — Data fetching and writing
// ---------------------------------------------------------------------------

/**
 * Fetch data from the OECD API for a given dataflow and dimension selection.
 *
 * This is the main data retrieval function. It:
 * 1. Fetches the data structure to get dimension ordering
 * 2. Builds the SDMX series key from user selections
 * 3. Queries the data endpoint
 * 4. Parses the SDMX JSON response into flat rows
 *
 * @param {string} dataflowId    Dataflow ID (e.g. "DSD_NAAG@DF_NAAG_I").
 * @param {string} agency        Agency ID (e.g. "OECD.SDD.NAD").
 * @param {Object} dimensions    Map of dimension ID → array of selected codes.
 * @param {Object} [options]     Additional query options.
 * @param {string} [options.startPeriod]         Start time period (e.g. "2020").
 * @param {string} [options.endPeriod]           End time period (e.g. "2024").
 * @param {number} [options.lastNObservations]   Return only last N observations.
 * @param {number} [options.firstNObservations]  Return only first N observations.
 * @returns {Object} { headers: string[], rows: any[][], dimensions: string[] }
 */
function oecd_fetchData(dataflowId, agency, dimensions, options) {
  options = options || {};
  dimensions = dimensions || {};

  var dsd = oecd_getDataStructure(dataflowId, agency);

  var nonTimeDims = dsd.dimensions.filter(function (d) {
    return d.type !== "TimeDimension";
  });
  var key = oecd_buildSeriesKey_(dimensions, nonTimeDims);

  var path =
    "data/" + dsd.agency + "," + dataflowId + "," + dsd.version + "/" + key;

  var params = {
    dimensionAtObservation: "AllDimensions",
  };

  if (options.startPeriod) {
    params.startPeriod = options.startPeriod;
  }
  if (options.endPeriod) {
    params.endPeriod = options.endPeriod;
  }

  if (options.lastNObservations) {
    params.lastNObservations = options.lastNObservations;
  }
  if (options.firstNObservations) {
    params.firstNObservations = options.firstNObservations;
  }

  var jsonResponse = oecdFetchData_(path, params);

  return oecd_parseSdmxJson_(jsonResponse);
}

/**
 * Fetch data and write it to a Google Sheet.
 *
 * Called from the sidebar via google.script.run.
 *
 * @param {string} dataflowId    Dataflow ID (e.g. "DSD_NAAG@DF_NAAG_I").
 * @param {string} agency        Agency ID (e.g. "OECD.SDD.NAD").
 * @param {Object} dimensions    Map of dimension ID → array of selected codes.
 * @param {Object} [options]     Query options (startPeriod, endPeriod, lastNObservations).
 * @param {string} [sheetName]   Custom sheet name (default: dataflowId).
 * @returns {string} Status message.
 */
function oecd_fetchAndWriteData(dataflowId, agency, dimensions, options, sheetName) {
  sheetName = sheetName || dataflowId;

  var result = oecd_fetchData(dataflowId, agency, dimensions, options);

  if (!result.rows || result.rows.length === 0) {
    throw new Error(
      "No data found for " +
        dataflowId +
        ". Try different dimension selections or time period.",
    );
  }

  return oecd_writeDataToSheet_(result.headers, result.rows, sheetName);
}

/**
 * Quick fetch for pre-configured series.
 *
 * Called from the Quick Fetch tab: fetches a preset indicator with
 * user-provided overrides (countries, time range).
 *
 * @param {Object} preset     Preset configuration from OECD_QUICK_SERIES.
 * @param {Object} [overrides] User overrides.
 * @param {string[]} [overrides.countries]  Override country selection.
 * @param {string}   [overrides.startPeriod]  Override start period.
 * @param {string}   [overrides.endPeriod]    Override end period.
 * @param {string}   [overrides.frequency]    Override frequency.
 * @returns {string} Status message.
 */
function oecd_quickFetch(preset, overrides) {
  overrides = overrides || {};

  var dims = {};
  for (var key in preset.dimensions) {
    if (preset.dimensions.hasOwnProperty(key)) {
      dims[key] = preset.dimensions[key].slice();
    }
  }

  var countryDim = preset.countryDimension || "REF_AREA";
  if (overrides.countries && overrides.countries.length > 0) {
    dims[countryDim] = overrides.countries;
  } else if (
    preset.defaultCountries &&
    preset.defaultCountries.length > 0 &&
    !dims[countryDim]
  ) {
    dims[countryDim] = preset.defaultCountries.slice();
  }

  if (overrides.frequency) {
    var freqDim = preset.frequencyDimension || "FREQ";
    dims[freqDim] = [overrides.frequency];
  }

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

  return oecd_fetchAndWriteData(
    preset.dataflowId,
    preset.agency,
    dims,
    options,
    sheetName,
  );
}
