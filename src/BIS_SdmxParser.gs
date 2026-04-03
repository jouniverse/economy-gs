/**
 * SdmxParser.gs — Parse SDMX-JSON 2.0.0 responses into usable structures
 */

var SdmxParser = (function () {
  /**
   * Parse the dataflow list from a structure response.
   * @param {Object} json  — SDMX-JSON structure response
   * @return {Array<{id:string, name:string, description:string, version:string}>}
   */
  function parseDataflowList(json) {
    var dataflows = [];
    var items = getNestedValue(json, ["data", "dataflows"]) || [];

    for (var i = 0; i < items.length; i++) {
      var df = items[i];
      dataflows.push({
        id: df.id || "",
        name: getLocalizedString(df.name),
        description: getLocalizedString(df.description),
        version: df.version || "1.0",
      });
    }

    dataflows.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
    return dataflows;
  }

  /**
   * Parse structure response to extract dimensions and codelists.
   * @param {Object} json  — SDMX-JSON structure response with references=descendants
   * @return {{dataflowName:string, dimensions:Array, attributes:Array}}
   */
  function parseStructureResponse(json) {
    var dataflows = getNestedValue(json, ["data", "dataflows"]) || [];
    var dataflowName =
      dataflows.length > 0 ? getLocalizedString(dataflows[0].name) : "";

    // Build codelist lookup: urn → values[]
    var codelistMap = buildCodelistMap_(json);

    // Extract data structure definition
    var dsds = getNestedValue(json, ["data", "dataStructures"]) || [];
    if (dsds.length === 0) {
      return { dataflowName: dataflowName, dimensions: [], attributes: [] };
    }

    var dsd = dsds[0];
    var components = getNestedValue(dsd, ["dataStructureComponents"]) || {};

    // Parse dimensions
    var dimList =
      getNestedValue(components, ["dimensionList", "dimensions"]) || [];
    var dimensions = [];
    for (var i = 0; i < dimList.length; i++) {
      dimensions.push(parseDimension_(dimList[i], codelistMap));
    }

    // Sort by position
    dimensions.sort(function (a, b) {
      return a.position - b.position;
    });

    // Parse attributes (observation-level and series-level)
    var attrList =
      getNestedValue(components, ["attributeList", "attributes"]) || [];
    var attributes = [];
    for (var j = 0; j < attrList.length; j++) {
      var attr = attrList[j];
      attributes.push({
        id: attr.id || "",
        name: getLocalizedString(attr.name),
        values: resolveCodelistValues_(attr, codelistMap),
      });
    }

    return {
      dataflowName: dataflowName,
      dimensions: dimensions,
      attributes: attributes,
    };
  }

  /**
   * Parse a data response into structured series.
   * @param {Object} json  — SDMX-JSON data response
   * @return {{dimensions:Array, timeDimension:Object, series:Array<Object>}}
   */
  function parseDataResponse(json) {
    var structure = json.data || json;

    // Structure metadata: dimension definitions with their values
    var seriesDims =
      getNestedValue(structure, ["structures", 0, "dimensions", "series"]) ||
      [];
    var obsDims =
      getNestedValue(structure, [
        "structures",
        0,
        "dimensions",
        "observation",
      ]) || [];
    var seriesAttrs =
      getNestedValue(structure, ["structures", 0, "attributes", "series"]) ||
      [];
    var obsAttrs =
      getNestedValue(structure, [
        "structures",
        0,
        "attributes",
        "observation",
      ]) || [];

    // Data: series keyed by colon-separated dimension indices
    var dataSets = structure.dataSets || [];
    if (dataSets.length === 0) {
      return {
        dimensions: seriesDims,
        timeDimension: obsDims[0] || null,
        series: [],
      };
    }

    var rawSeries = dataSets[0].series || {};
    var series = [];

    var seriesKeys = Object.keys(rawSeries);
    for (var i = 0; i < seriesKeys.length; i++) {
      var key = seriesKeys[i];
      var indices = key.split(":");
      var entry = rawSeries[key];

      // Resolve dimension values for this series
      var dimValues = {};
      for (var d = 0; d < seriesDims.length; d++) {
        var dim = seriesDims[d];
        var idx = parseInt(indices[d], 10) || 0;
        var val = (dim.values && dim.values[idx]) || {};
        dimValues[dim.id || "dim_" + d] = {
          id: val.id || String(idx),
          name: val.name || val.id || String(idx),
        };
      }

      // Resolve series-level attributes
      var serAttrValues = {};
      if (entry.attributes) {
        for (var sa = 0; sa < seriesAttrs.length; sa++) {
          var saIdx = entry.attributes[sa];
          if (saIdx !== null && saIdx !== undefined && seriesAttrs[sa].values) {
            var saVal = seriesAttrs[sa].values[saIdx];
            if (saVal) {
              serAttrValues[seriesAttrs[sa].id] = saVal.name || saVal.id;
            }
          }
        }
      }

      // Extract observations
      var rawObs = entry.observations || {};
      var observations = [];
      var obsKeys = Object.keys(rawObs);
      for (var o = 0; o < obsKeys.length; o++) {
        var obsKey = obsKeys[o];
        var obsArray = rawObs[obsKey];
        var timePeriod = "";
        if (obsDims.length > 0 && obsDims[0].values) {
          var obsIdx = parseInt(obsKey, 10) || 0;
          var tv = obsDims[0].values[obsIdx];
          timePeriod = tv ? tv.id || tv.start || obsKey : obsKey;
        }

        var obsValue = obsArray[0];

        // Observation-level attributes
        var obsAttrValues = {};
        for (var oa = 1; oa < obsArray.length; oa++) {
          if (
            obsArray[oa] !== null &&
            obsArray[oa] !== undefined &&
            obsAttrs[oa - 1]
          ) {
            var oaVal = obsAttrs[oa - 1].values
              ? obsAttrs[oa - 1].values[obsArray[oa]]
              : null;
            if (oaVal) {
              obsAttrValues[obsAttrs[oa - 1].id] = oaVal.name || oaVal.id;
            }
          }
        }

        observations.push({
          timePeriod: timePeriod,
          value: obsValue,
          attributes: obsAttrValues,
        });
      }

      // Sort observations by time period
      observations.sort(function (a, b) {
        return a.timePeriod < b.timePeriod
          ? -1
          : a.timePeriod > b.timePeriod
            ? 1
            : 0;
      });

      series.push({
        key: key,
        dimensions: dimValues,
        attributes: serAttrValues,
        observations: observations,
      });
    }

    return {
      dimensions: seriesDims,
      timeDimension: obsDims[0] || null,
      series: series,
    };
  }

  /**
   * Convert parsed data to a 2D table array suitable for sheet writing.
   * @param {Object} parsed  — output of parseDataResponse
   * @return {Array<Array>}  — first row is headers, rest are data rows
   */
  function toTableArray(parsed) {
    if (!parsed.series || parsed.series.length === 0) {
      return [["No data returned"]];
    }

    // Determine columns: dimension IDs + TIME_PERIOD + OBS_VALUE + common attributes
    var sample = parsed.series[0];
    var dimIds = Object.keys(sample.dimensions);
    var headers = [];

    // Dimension columns — use human-readable names from structure
    var dimHeaders = {};
    for (var di = 0; di < parsed.dimensions.length; di++) {
      var dim = parsed.dimensions[di];
      dimHeaders[dim.id] = dim.name || dim.id;
    }
    for (var h = 0; h < dimIds.length; h++) {
      headers.push(dimHeaders[dimIds[h]] || dimIds[h]);
    }
    headers.push("Time period");
    headers.push("Value");

    // Collect all observation attribute keys present in data
    var obsAttrKeys = {};
    for (var si = 0; si < parsed.series.length; si++) {
      for (var oi = 0; oi < parsed.series[si].observations.length; oi++) {
        var attrs = parsed.series[si].observations[oi].attributes;
        var keys = Object.keys(attrs);
        for (var ki = 0; ki < keys.length; ki++) {
          obsAttrKeys[keys[ki]] = true;
        }
      }
    }
    var attrKeyList = Object.keys(obsAttrKeys);
    for (var ak = 0; ak < attrKeyList.length; ak++) {
      headers.push(attrKeyList[ak]);
    }

    // Build rows
    var rows = [headers];
    for (var s = 0; s < parsed.series.length; s++) {
      var ser = parsed.series[s];
      for (var ob = 0; ob < ser.observations.length; ob++) {
        var obs = ser.observations[ob];
        var row = [];

        // Dimension values (human-readable names)
        for (var dj = 0; dj < dimIds.length; dj++) {
          var dv = ser.dimensions[dimIds[dj]];
          row.push(dv ? dv.name : "");
        }

        row.push(obs.timePeriod);
        row.push(
          obs.value !== null && obs.value !== undefined ? obs.value : "",
        );

        // Observation attributes
        for (var at = 0; at < attrKeyList.length; at++) {
          row.push(obs.attributes[attrKeyList[at]] || "");
        }

        rows.push(row);
      }
    }

    return rows;
  }

  /**
   * Parse BIS SDMX-ML StructureSpecific XML response into a 2D table.
   * @param {string} xmlText — raw XML text from BIS data endpoint
   * @return {Array<Array>} — first row is headers, rest are data rows
   */
  function parseXmlDataToTable(xmlText) {
    var doc = XmlService.parse(xmlText);
    var root = doc.getRootElement();

    // Find DataSet element (in message namespace)
    var dataSet = null;
    var rootChildren = root.getChildren();
    for (var i = 0; i < rootChildren.length; i++) {
      if (rootChildren[i].getName() === "DataSet") {
        dataSet = rootChildren[i];
        break;
      }
    }
    if (!dataSet) return [["No data returned"]];

    // Collect Series elements
    var seriesElements = [];
    var dsChildren = dataSet.getChildren();
    for (var i = 0; i < dsChildren.length; i++) {
      if (dsChildren[i].getName() === "Series") {
        seriesElements.push(dsChildren[i]);
      }
    }
    if (seriesElements.length === 0) return [["No data returned"]];

    // Verbose metadata attributes to exclude from columns
    var skipAttrs = {
      COMPILATION: true,
      SOURCE_REF: true,
      SUPP_INFO_BREAKS: true,
      DECIMALS: true,
      UNIT_MULT: true,
      OBS_CONF: true,
    };

    // Readable column names for common SDMX attributes
    var headerNames = {
      FREQ: "Frequency",
      REF_AREA: "Reference Area",
      TITLE: "Title",
      TIME_PERIOD: "Time Period",
      OBS_STATUS: "Status",
    };

    // Determine columns from first Series attributes
    var dimCols = [];
    var hasTitle = false;
    var firstAttrs = seriesElements[0].getAttributes();
    for (var a = 0; a < firstAttrs.length; a++) {
      var attrName = firstAttrs[a].getName();
      if (skipAttrs[attrName]) continue;
      if (attrName === "TITLE") {
        hasTitle = true;
        continue;
      }
      dimCols.push(attrName);
    }
    if (hasTitle) dimCols.push("TITLE");

    // Build headers
    var rawHeaders = dimCols.concat(["TIME_PERIOD", "Value", "OBS_STATUS"]);
    var headers = [];
    for (var h = 0; h < rawHeaders.length; h++) {
      headers.push(headerNames[rawHeaders[h]] || rawHeaders[h]);
    }

    var rows = [headers];

    for (var s = 0; s < seriesElements.length; s++) {
      var series = seriesElements[s];

      // Get series attribute values
      var seriesVals = {};
      var sAttrs = series.getAttributes();
      for (var a = 0; a < sAttrs.length; a++) {
        seriesVals[sAttrs[a].getName()] = (sAttrs[a].getValue() || "").trim();
      }

      // Get observations
      var obsElements = series.getChildren();
      for (var o = 0; o < obsElements.length; o++) {
        if (obsElements[o].getName() !== "Obs") continue;

        var obs = obsElements[o];
        var row = [];

        // Dimension columns
        for (var d = 0; d < dimCols.length; d++) {
          row.push(seriesVals[dimCols[d]] || "");
        }

        // Time period
        var tpAttr = obs.getAttribute("TIME_PERIOD");
        row.push(tpAttr ? tpAttr.getValue() : "");

        // Value — convert to number if possible
        var valAttr = obs.getAttribute("OBS_VALUE");
        var val = valAttr ? valAttr.getValue() : null;
        if (val !== null && val !== "" && val !== "NaN") {
          var num = parseFloat(val);
          row.push(isNaN(num) ? val : num);
        } else {
          row.push("");
        }

        // Observation status
        var statusAttr = obs.getAttribute("OBS_STATUS");
        row.push(statusAttr ? statusAttr.getValue() : "");

        rows.push(row);
      }
    }

    return rows;
  }

  // ─── Internal helpers ───

  function buildCodelistMap_(json) {
    var map = {};
    var codelists = getNestedValue(json, ["data", "codelists"]) || [];
    for (var i = 0; i < codelists.length; i++) {
      var cl = codelists[i];
      var codes = cl.codes || [];
      var values = [];
      for (var j = 0; j < codes.length; j++) {
        values.push({
          id: codes[j].id || "",
          name: getLocalizedString(codes[j].name),
        });
      }
      // Store by native URN if present
      if (cl.urn) {
        map[cl.urn] = values;
      }
      // Construct the standard codelist URN for matching localRepresentation.enumeration
      var constructedUrn =
        "urn:sdmx:org.sdmx.infomodel.codelist.Codelist=" +
        (cl.agencyID || "BIS") +
        ":" +
        cl.id +
        "(" +
        (cl.version || "1.0") +
        ")";
      map[constructedUrn] = values;
      // Also store by simple id for fallback matching
      map[cl.id] = values;
    }
    return map;
  }

  function parseDimension_(dim, codelistMap) {
    return {
      id: dim.id || "",
      name: getLocalizedString(dim.name),
      position: dim.position || 0,
      values: resolveCodelistValues_(dim, codelistMap),
    };
  }

  function resolveCodelistValues_(component, codelistMap) {
    // Try localRepresentation → enumeration
    var enumRef = getNestedValue(component, [
      "localRepresentation",
      "enumeration",
    ]);
    if (enumRef && typeof enumRef === "string" && codelistMap[enumRef]) {
      return codelistMap[enumRef];
    }
    // Try matching by linked URN patterns
    if (
      enumRef &&
      typeof enumRef === "object" &&
      enumRef.urn &&
      codelistMap[enumRef.urn]
    ) {
      return codelistMap[enumRef.urn];
    }
    // Fallback: search codelist map for a codelist ID that matches the component ID
    if (codelistMap["CL_" + component.id]) {
      return codelistMap["CL_" + component.id];
    }
    return [];
  }

  function getLocalizedString(obj) {
    if (!obj) return "";
    if (typeof obj === "string") return obj;
    // SDMX-JSON uses {en: "...", fr: "..."} — prefer English
    return obj.en || obj[Object.keys(obj)[0]] || "";
  }

  function getNestedValue(obj, path) {
    var current = obj;
    for (var i = 0; i < path.length; i++) {
      if (current === null || current === undefined) return undefined;
      current = current[path[i]];
    }
    return current;
  }

  /**
   * Parse an availability response into a map of dimension → available values.
   * @param {Object} json — SDMX-JSON availability response
   * @return {Object} e.g. {FREQ: ["M","Q"], REF_AREA: ["US","GB"], ...}
   */
  function parseAvailabilityResponse(json) {
    var result = {};
    var constraints = getNestedValue(json, ["data", "dataConstraints"]) || [];
    if (constraints.length === 0) return result;

    var cubeRegions = constraints[0].cubeRegions || [];
    if (cubeRegions.length === 0) return result;

    var keyValues = cubeRegions[0].keyValues || [];
    for (var i = 0; i < keyValues.length; i++) {
      var kv = keyValues[i];
      var dimId = kv.id;
      var vals = [];
      var rawValues = kv.values || [];
      for (var v = 0; v < rawValues.length; v++) {
        vals.push(rawValues[v].value || rawValues[v]);
      }
      result[dimId] = vals;
    }
    return result;
  }

  return {
    parseDataflowList: parseDataflowList,
    parseStructureResponse: parseStructureResponse,
    parseDataResponse: parseDataResponse,
    parseXmlDataToTable: parseXmlDataToTable,
    toTableArray: toTableArray,
    parseAvailabilityResponse: parseAvailabilityResponse,
  };
})();
