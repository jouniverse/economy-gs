/**
 * WORLD_BANK_Code.gs — Bridge functions for the World Bank Data module.
 *
 * Provides bridge functions that the HTML UI calls via google.script.run.
 * Menu/sidebar/include functions are handled by the unified entry point.
 */

// ---------------------------------------------------------------------------
// Bridge functions — called from the sidebar via google.script.run
// ---------------------------------------------------------------------------

/**
 * Return cached metadata for populating the sidebar on open.
 * Fetches countries, regions, income levels, lending types, topics in one go.
 */
function wb_getSidebarBootstrapData() {
  return {
    countries: wb_getCountries(),
    regions: wb_getRegions(),
    incomeLevels: wb_getIncomeLevels(),
    lendingTypes: wb_getLendingTypes(),
    topics: wb_getTopics(),
    settings: wb_loadUserSettings(),
  };
}

/**
 * Search indicators by keyword (called while user types).
 */
function wb_bridgeSearchIndicators(query, topicId) {
  return wb_searchIndicators(query, topicId);
}

/**
 * Get full detail for a single indicator.
 */
function wb_bridgeGetIndicatorInfo(code) {
  return wb_getIndicatorInfo(code);
}

/**
 * Get indicators belonging to a given topic.
 */
function wb_bridgeGetTopicIndicators(topicId) {
  return wb_getTopicIndicators(topicId);
}

/**
 * Main data-fetch entry point called by the Fetch Data tab.
 *
 * @param {Object} params
 *   - indicators: string[]  (indicator codes)
 *   - countries:  string[]  (ISO3 codes, or ['all'])
 *   - timeMode:   'range' | 'mrv'
 *   - startYear:  number (if timeMode=range)
 *   - endYear:    number (if timeMode=range)
 *   - mrvCount:   number (if timeMode=mrv)
 *   - mrvNonEmpty: boolean
 *   - format:     'long' | 'wide_years' | 'wide_countries' | 'wide_indicators'
 *   - destination: 'new' | 'active'
 *   - includeMetadata: boolean
 *   - skipAggregates: boolean
 */
function wb_bridgeFetchData(params) {
  // Validate
  if (!params.indicators || params.indicators.length === 0) {
    return { success: false, error: "Please select at least one indicator." };
  }

  try {
    var raw;
    if (params.indicators.length === 1) {
      raw = wb_fetchIndicatorData(
        params.indicators[0],
        params.countries,
        params.timeMode === "range" ? params.startYear : null,
        params.timeMode === "range" ? params.endYear : null,
        {
          mrv: params.timeMode === "mrv" ? params.mrvCount : null,
          mrnev:
            params.timeMode === "mrv" && params.mrvNonEmpty
              ? params.mrvCount
              : null,
          skipAggregates: params.skipAggregates,
        },
      );
    } else {
      raw = wb_fetchMultiIndicatorData(
        params.indicators,
        params.countries,
        params.timeMode === "range" ? params.startYear : null,
        params.timeMode === "range" ? params.endYear : null,
        {
          mrv: params.timeMode === "mrv" ? params.mrvCount : null,
          mrnev:
            params.timeMode === "mrv" && params.mrvNonEmpty
              ? params.mrvCount
              : null,
          skipAggregates: params.skipAggregates,
        },
      );
    }

    if (!raw || raw.length === 0) {
      return {
        success: false,
        error: "No data returned. Check your selections and try again.",
      };
    }

    var data2D = wb_reshapeData(raw, params.format);

    wb_writeDataToSheet(data2D, {
      destination: params.destination,
      sheetName: "WB_" + params.indicators.join("_").substring(0, 40),
      includeMetadata: params.includeMetadata,
      metaInfo: {
        indicators: params.indicators,
        countries: params.countries,
        timeMode: params.timeMode,
        startYear: params.startYear,
        endYear: params.endYear,
        mrvCount: params.mrvCount,
        format: params.format,
      },
    });

    wb_saveUserSettings(params);

    return { success: true, rowCount: data2D.length - 1 };
  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }
}

/**
 * Write a reference sheet (Quick Ref tab).
 * @param {string} type — 'countries' | 'topics' | 'sources' | 'regions' | 'indicators'
 * @param {string} [query] — for indicator search
 */
function wb_bridgeWriteReference(type, query) {
  try {
    wb_writeReferenceSheet(type, query);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }
}

// ---------------------------------------------------------------------------
// User settings persistence
// ---------------------------------------------------------------------------

function wb_loadUserSettings() {
  var props = PropertiesService.getUserProperties();
  var raw = props.getProperty("wb_settings");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function wb_saveUserSettings(params) {
  var props = PropertiesService.getUserProperties();
  var settings = {
    indicators: params.indicators,
    countries: params.countries,
    timeMode: params.timeMode,
    startYear: params.startYear,
    endYear: params.endYear,
    mrvCount: params.mrvCount,
    mrvNonEmpty: params.mrvNonEmpty,
    format: params.format,
    destination: params.destination,
    includeMetadata: params.includeMetadata,
    skipAggregates: params.skipAggregates,
  };
  props.setProperty("wb_settings", JSON.stringify(settings));
}
