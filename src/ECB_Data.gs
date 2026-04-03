// ---------------------------------------------------------------------------
// ECB_Data.gs — Data fetching orchestration
// ---------------------------------------------------------------------------

/**
 * Fetch data from the ECB API for a given dataflow and dimension selection.
 *
 * @param {string} dataflowId  Dataflow ID (e.g. "EXR").
 * @param {Object} dimensions  Map of dimension ID → array of selected codes.
 * @param {Object} [options]   Additional query options.
 * @param {string} [options.startPeriod]       Start time period.
 * @param {string} [options.endPeriod]         End time period.
 * @param {number} [options.lastNObservations] Return only last N observations.
 * @returns {Object} { headers: string[], rows: any[][] }
 */
function ecb_fetchData(dataflowId, dimensions, options) {
  options = options || {};
  dimensions = dimensions || {};

  // Get data structure for dimension ordering
  var dsd = ecb_getDataStructure(dataflowId);

  // Build the series key
  var key = ecb_buildSeriesKey_(dimensions, dsd.dimensions);

  return ecb_fetchDataWithKey_(dataflowId, key, options);
}

/**
 * Fetch data using a pre-built series key (no DSD fetch required).
 * Used by Quick Fetch presets that store their own dimension ordering.
 *
 * @param {string} dataflowId  Dataflow ID.
 * @param {Object} dimensions  Map of dimension ID → array of selected codes.
 * @param {string[]} dimOrder  Ordered array of dimension IDs.
 * @param {Object} [options]   Query options.
 * @returns {Object} { headers: string[], rows: any[][] }
 */
function ecb_fetchDataDirect(dataflowId, dimensions, dimOrder, options) {
  options = options || {};
  dimensions = dimensions || {};

  // Build synthetic DSD dimension objects from dimOrder
  var syntheticDims = [];
  for (var i = 0; i < dimOrder.length; i++) {
    syntheticDims.push({ id: dimOrder[i], position: i + 1, type: "Dimension" });
  }

  var key = ecb_buildSeriesKey_(dimensions, syntheticDims);
  return ecb_fetchDataWithKey_(dataflowId, key, options);
}

/**
 * Internal: fetch data given a pre-built series key.
 * @private
 */
function ecb_fetchDataWithKey_(dataflowId, key, options) {
  // Construct the data query path: data/{flowRef}/{key}
  var path = "data/" + dataflowId + "/" + key;

  // Build query parameters
  var params = {
    format: "jsondata",
  };

  if (options.startPeriod) params.startPeriod = options.startPeriod;
  if (options.endPeriod) params.endPeriod = options.endPeriod;
  if (options.lastNObservations) {
    params.lastNObservations = options.lastNObservations;
  }
  if (options.detail) params.detail = options.detail;

  // Fetch data (not cached — user expects fresh data)
  var jsonResponse = ecbFetchJson_(path, params);

  return ecb_parseSdmxJson_(jsonResponse);
}

/**
 * Fetch data and write it to a Google Sheet.
 * Called from the sidebar via google.script.run.
 *
 * @param {string} dataflowId  Dataflow ID.
 * @param {Object} dimensions  Map of dimension ID → array of selected codes.
 * @param {Object} [options]   Query options.
 * @param {string} [sheetName] Custom sheet name (default: dataflowId).
 * @returns {string} Status message.
 */
function ecb_fetchAndWriteData(dataflowId, dimensions, options, sheetName) {
  sheetName = sheetName || dataflowId;

  var result = ecb_fetchData(dataflowId, dimensions, options);

  if (!result.rows || result.rows.length === 0) {
    throw new Error(
      "No data found for " +
        dataflowId +
        ". Try different dimension selections or time period.",
    );
  }

  return ecb_writeDataToSheet_(result.headers, result.rows, sheetName);
}
