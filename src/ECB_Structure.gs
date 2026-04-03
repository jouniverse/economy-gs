// ---------------------------------------------------------------------------
// ECB_Structure.gs — Metadata: dataflows, data structures, codelists (XML)
// ---------------------------------------------------------------------------

// SDMX 2.1 XML namespaces
var ECB_NS_MES_ = XmlService.getNamespace(
  "mes",
  "http://www.sdmx.org/resources/sdmxml/schemas/v2_1/message",
);
var ECB_NS_STR_ = XmlService.getNamespace(
  "str",
  "http://www.sdmx.org/resources/sdmxml/schemas/v2_1/structure",
);
var ECB_NS_COM_ = XmlService.getNamespace(
  "com",
  "http://www.sdmx.org/resources/sdmxml/schemas/v2_1/common",
);

/**
 * Safe attribute getter for XmlService elements.
 * XmlService uses getAttribute(name).getValue(), not getAttributeValue().
 * @private
 */
function ecb_getAttr_(el, name) {
  var attr = el.getAttribute(name);
  return attr ? attr.getValue() : "";
}

/**
 * Fetch all available ECB dataflows.
 * Results are cached for 6 hours.
 *
 * @returns {Object[]} Array of {id, name, agencyId, dsdRef}.
 */
function ecb_getDataflows() {
  var doc = ecbFetchXmlCached_("dataflow", {}, 21600);
  var root = doc.getRootElement();

  var structures = root.getChild("Structures", ECB_NS_MES_);
  if (!structures) return [];

  var dataflowsEl = structures.getChild("Dataflows", ECB_NS_STR_);
  if (!dataflowsEl) return [];

  var dfElements = dataflowsEl.getChildren("Dataflow", ECB_NS_STR_);
  var result = [];

  for (var i = 0; i < dfElements.length; i++) {
    var df = dfElements[i];

    // Check for DISCONTINUED annotation
    if (ecb_isDiscontinued_(df)) continue;

    var id = ecb_getAttr_(df, "id");
    var agencyId = ecb_getAttr_(df, "agencyID");

    // Get name
    var nameEl = df.getChild("Name", ECB_NS_COM_);
    var name = nameEl ? nameEl.getText() : id;

    // Get DSD reference
    var structEl = df.getChild("Structure", ECB_NS_STR_);
    var dsdRef = "";
    if (structEl) {
      var refEl = structEl.getChild("Ref");
      if (refEl) {
        dsdRef = ecb_getAttr_(refEl, "id");
      }
    }

    result.push({
      id: id,
      name: name,
      agencyId: agencyId,
      dsdRef: dsdRef,
    });
  }

  result.sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });

  return result;
}

/**
 * Check if a dataflow element has a DISCONTINUED annotation.
 * @private
 */
function ecb_isDiscontinued_(dfElement) {
  var annotations = dfElement.getChild("Annotations", ECB_NS_COM_);
  if (!annotations) return false;

  var annots = annotations.getChildren("Annotation", ECB_NS_COM_);
  for (var i = 0; i < annots.length; i++) {
    var title = annots[i].getChild("AnnotationTitle", ECB_NS_COM_);
    if (title && title.getText() === "DISCONTINUED") return true;
  }
  return false;
}

/**
 * Search dataflows by keyword.
 *
 * @param {string} query  Search term.
 * @returns {Object[]} Matching dataflows.
 */
function ecb_searchDataflows(query) {
  var all = ecb_getDataflows();
  if (!query || !query.trim()) return all;

  var q = query.trim().toLowerCase();
  var words = q.split(/\s+/);

  var filtered = all.filter(function (df) {
    var text = (df.id + " " + df.name).toLowerCase();
    return words.every(function (w) {
      return text.indexOf(w) >= 0;
    });
  });

  // Limit results
  if (filtered.length > 50) filtered = filtered.slice(0, 50);
  return filtered;
}

/**
 * Get the data structure definition (DSD) for a dataflow.
 * Fetches DSD with embedded codelists via ?references=children.
 *
 * @param {string} dataflowId  Dataflow ID (e.g. "EXR").
 * @returns {Object} { dimensions: [{id, name, position, type, codelistId}], dsdId }
 */
function ecb_getDataStructure(dataflowId) {
  // First, find the DSD ID from the dataflow
  var dataflows = ecb_getDataflows();
  var dsdId = null;
  for (var i = 0; i < dataflows.length; i++) {
    if (dataflows[i].id === dataflowId) {
      dsdId = dataflows[i].dsdRef;
      break;
    }
  }

  if (!dsdId) {
    // Fallback: try ECB_{flowId}1 naming convention
    dsdId = "ECB_" + dataflowId + "1";
  }

  var doc = ecbFetchXmlCached_(
    "datastructure/ECB/" + dsdId,
    { references: "children" },
    21600,
  );

  var root = doc.getRootElement();
  var structures = root.getChild("Structures", ECB_NS_MES_);
  if (!structures) throw new Error("No structure found for " + dataflowId);

  // Parse DSD dimensions
  var dsds = structures.getChild("DataStructures", ECB_NS_STR_);
  if (!dsds) throw new Error("No data structures found for " + dataflowId);

  var dsdEl = dsds.getChildren("DataStructure", ECB_NS_STR_)[0];
  if (!dsdEl) throw new Error("No DSD element found for " + dataflowId);

  var components = dsdEl.getChild("DataStructureComponents", ECB_NS_STR_);
  if (!components) throw new Error("No components found in DSD");

  var dimList = components.getChild("DimensionList", ECB_NS_STR_);
  var dimensions = [];

  if (dimList) {
    // Regular dimensions
    var dims = dimList.getChildren("Dimension", ECB_NS_STR_);
    for (var d = 0; d < dims.length; d++) {
      var dim = dims[d];
      dimensions.push(ecb_parseDimension_(dim, "Dimension"));
    }

    // Time dimension
    var timeDims = dimList.getChildren("TimeDimension", ECB_NS_STR_);
    for (var t = 0; t < timeDims.length; t++) {
      dimensions.push(ecb_parseDimension_(timeDims[t], "TimeDimension"));
    }
  }

  // Sort by position
  dimensions.sort(function (a, b) {
    return a.position - b.position;
  });

  // Parse embedded codelists
  var codelists = ecb_parseCodelists_(structures);

  return {
    dimensions: dimensions,
    codelists: codelists,
    dsdId: dsdId,
  };
}

/**
 * Parse a single dimension element from the DSD XML.
 * @private
 */
function ecb_parseDimension_(dimEl, type) {
  var id = ecb_getAttr_(dimEl, "id");
  var position = parseInt(ecb_getAttr_(dimEl, "position"), 10) || 0;

  // Try to get concept name (conceptIdentity → Ref)
  var name = id;
  var conceptIdentity = dimEl.getChild("ConceptIdentity", ECB_NS_STR_);
  if (conceptIdentity) {
    var ref = conceptIdentity.getChild("Ref");
    if (ref) {
      name = ecb_getAttr_(ref, "id") || id;
    }
  }

  // Get codelist reference
  var codelistId = "";
  var localRep = dimEl.getChild("LocalRepresentation", ECB_NS_STR_);
  if (localRep) {
    var enumeration = localRep.getChild("Enumeration", ECB_NS_STR_);
    if (enumeration) {
      var clRef = enumeration.getChild("Ref");
      if (clRef) {
        codelistId = ecb_getAttr_(clRef, "id");
      }
    }
  }

  return {
    id: id,
    name: name,
    position: position,
    type: type,
    codelistId: codelistId,
  };
}

/**
 * Parse all codelists from a Structures element.
 *
 * @param {Element} structures  The mes:Structures XML element.
 * @returns {Object} Map of codelistId → [{id, name}].
 * @private
 */
function ecb_parseCodelists_(structures) {
  var result = {};
  var codelistsEl = structures.getChild("Codelists", ECB_NS_STR_);
  if (!codelistsEl) return result;

  var cls = codelistsEl.getChildren("Codelist", ECB_NS_STR_);
  for (var i = 0; i < cls.length; i++) {
    var cl = cls[i];
    var clId = ecb_getAttr_(cl, "id");
    var codes = cl.getChildren("Code", ECB_NS_STR_);
    var codeList = [];

    for (var j = 0; j < codes.length; j++) {
      var code = codes[j];
      var codeId = ecb_getAttr_(code, "id");
      var nameEl = code.getChild("Name", ECB_NS_COM_);
      var codeName = nameEl ? nameEl.getText() : codeId;
      codeList.push({ id: codeId, name: codeName });
    }

    result[clId] = codeList;
  }

  return result;
}

/**
 * Get available codes for ALL dimensions of a dataflow.
 * Uses a lightweight data query (serieskeysonly) to discover the actual
 * dimension values that have data. This is fast for any dataset and avoids
 * fetching large DSD XML files.
 *
 * @param {string} dataflowId  Dataflow ID.
 * @returns {Object} Map of dimensionId → [{id, name}].
 */
function ecb_getAllAvailableCodes(dataflowId) {
  var info = ecb_getDataflowDimensions(dataflowId);
  return info.codes;
}

/**
 * Get dimension ordering AND available codes for a dataflow in a single call.
 * Uses detail=serieskeysonly to discover the actual values that have data.
 * Returns everything the Explorer sidebar needs in one round-trip.
 *
 * @param {string} dataflowId  Dataflow ID.
 * @returns {Object} { dimensions: [{id, name, position, type}], codes: {dimId: [{id, name}]} }
 */
function ecb_getDataflowDimensions(dataflowId) {
  var jsonResponse = ecbFetchJson_("data/" + dataflowId, {
    detail: "serieskeysonly",
    format: "jsondata",
  });

  var structure = jsonResponse.structure || {};
  var seriesDims = (structure.dimensions || {}).series || [];

  var dimensions = [];
  var codes = {};

  for (var i = 0; i < seriesDims.length; i++) {
    var d = seriesDims[i];
    dimensions.push({
      id: d.id,
      name: d.name || d.id,
      position: i + 1,
      type: "Dimension",
    });

    var vals = d.values || [];
    var codeList = [];
    for (var v = 0; v < vals.length; v++) {
      codeList.push({
        id: vals[v].id,
        name: vals[v].name || vals[v].id,
      });
    }
    codes[d.id] = codeList;
  }

  return { dimensions: dimensions, codes: codes };
}

/**
 * Fetch and parse ECB content constraints for a dataflow.
 * ECB uses naming convention: {dataflowId}_CONSTRAINTS
 *
 * Returns a map of dimensionId → {codeId: true} for allowed values.
 * Returns empty object on failure (constraint not found, etc.).
 *
 * @param {string} dataflowId  Dataflow ID.
 * @returns {Object} Map of dimId → {codeId: true}.
 * @private
 */
function ecb_fetchConstraintValues_(dataflowId) {
  try {
    var constraintId = dataflowId + "_CONSTRAINTS";
    var doc = ecbFetchXmlCached_(
      "contentconstraint/ECB/" + constraintId,
      {},
      21600,
    );
    return ecb_parseConstraintXml_(doc);
  } catch (e) {
    // Constraint not available — return empty (no filtering)
    return {};
  }
}

/**
 * Parse constraint XML to extract allowed dimension values.
 *
 * ECB constraint structure:
 *   <str:CubeRegion include="true">
 *     <com:KeyValue id="FREQ">
 *       <com:Value>A</com:Value>
 *       <com:Value>D</com:Value>
 *     </com:KeyValue>
 *   </str:CubeRegion>
 *
 * @param {GoogleAppsScript.XML_Service.Document} doc  Parsed constraint XML.
 * @returns {Object} Map of dimId → {codeId: true}.
 * @private
 */
function ecb_parseConstraintXml_(doc) {
  var result = {};
  var root = doc.getRootElement();

  // Navigate: Structures → ContentConstraints → ContentConstraint → CubeRegions → CubeRegion → KeyValue
  var structures = root.getChild("Structures", ECB_NS_MES_);
  if (!structures) return result;

  var ccContainer = structures.getChild("ContentConstraints", ECB_NS_STR_);
  if (!ccContainer) return result;

  var constraints = ccContainer.getChildren("ContentConstraint", ECB_NS_STR_);
  if (!constraints || constraints.length === 0) return result;

  var cc = constraints[0];
  var cubeRegions = cc.getChild("CubeRegions", ECB_NS_STR_);
  if (!cubeRegions) return result;

  var regions = cubeRegions.getChildren("CubeRegion", ECB_NS_STR_);
  for (var r = 0; r < regions.length; r++) {
    var region = regions[r];
    var keyValues = region.getChildren("KeyValue", ECB_NS_COM_);

    for (var k = 0; k < keyValues.length; k++) {
      var kv = keyValues[k];
      var dimId = ecb_getAttr_(kv, "id");
      if (!dimId) continue;

      if (!result[dimId]) result[dimId] = {};

      var values = kv.getChildren("Value", ECB_NS_COM_);
      for (var v = 0; v < values.length; v++) {
        var val = values[v].getText();
        if (val) result[dimId][val] = true;
      }
    }
  }

  return result;
}

/**
 * Export all dataflows to a sheet.
 *
 * @returns {string} Status message.
 */
function ecb_exportDataflows() {
  var dataflows = ecb_getDataflows();
  var data = [["ID", "Name", "Agency", "DSD Reference"]];
  for (var i = 0; i < dataflows.length; i++) {
    var df = dataflows[i];
    data.push([df.id, df.name, df.agencyId, df.dsdRef]);
  }
  return ecb_writeListToSheet_(data, "ECB Dataflows");
}

/**
 * Write a codebook sheet for an Explorer dataset.
 *
 * @param {string} dataflowId    Dataflow ID.
 * @param {string} dataflowName  Human-readable name.
 * @returns {string} Status message.
 */
function ecb_writeExplorerCodebook(dataflowId, dataflowName) {
  var allCodes = ecb_getAllAvailableCodes(dataflowId);

  var rows = [["DIMENSION", "CODE", "NAME"]];
  var dimKeys = Object.keys(allCodes);
  dimKeys.sort();

  for (var d = 0; d < dimKeys.length; d++) {
    var dimId = dimKeys[d];
    var codes = allCodes[dimId] || [];
    for (var c = 0; c < codes.length; c++) {
      var code = codes[c];
      rows.push([dimId, code.id, code.name || code.id]);
    }
    if (codes.length === 0) {
      rows.push([dimId, "(all)", "No codelist available"]);
    }
  }

  var sheetName = dataflowId + " Codes";
  return ecb_writeListToSheet_(rows, sheetName);
}
