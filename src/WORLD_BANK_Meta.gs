/**
 * WORLD_BANK_Meta.gs — Metadata retrieval & caching for the World Bank API.
 *
 * Fetches and caches countries, regions, income levels, lending types,
 * topics, sources, and indicators.  All list functions return plain
 * arrays of objects that are safe to pass to the sidebar via
 * google.script.run.
 */

// ---------------------------------------------------------------------------
// Countries
// ---------------------------------------------------------------------------

/**
 * Get all countries/economies.
 * Returns cached result when available.
 *
 * @param {string} [query]  — optional text filter (case-insensitive)
 * @return {Object[]} [{id, name, region, regionId, incomeLevel, incomeLevelId,
 *                       lendingType, lendingTypeId, capitalCity, longitude, latitude, iso2Code}]
 */
function wb_getCountries(query) {
  var CACHE_KEY = "wb_countries";
  var countries = wb_cacheGet(CACHE_KEY);

  if (!countries) {
    var result = wbFetchAll("country/all", null);
    if (result.error || !result.data) {
      throw new Error(
        "Failed to load countries: " + (result.error || "empty response"),
      );
    }

    countries = result.data.map(function (c) {
      return {
        id: c.id,
        iso2Code: c.iso2Code,
        name: c.name,
        region: c.region ? c.region.value : "",
        regionId: c.region ? c.region.id : "",
        incomeLevel: c.incomeLevel ? c.incomeLevel.value : "",
        incomeLevelId: c.incomeLevel ? c.incomeLevel.id : "",
        lendingType: c.lendingType ? c.lendingType.value : "",
        lendingTypeId: c.lendingType ? c.lendingType.id : "",
        capitalCity: c.capitalCity || "",
        longitude: c.longitude ? parseFloat(c.longitude) : null,
        latitude: c.latitude ? parseFloat(c.latitude) : null,
        isAggregate:
          !c.region || c.region.id === "" || c.region.value === "Aggregates",
      };
    });

    wb_cacheSet(CACHE_KEY, countries);
  }

  if (query) {
    var q = query.toLowerCase();
    countries = countries.filter(function (c) {
      return (
        c.id.toLowerCase().indexOf(q) !== -1 ||
        c.name.toLowerCase().indexOf(q) !== -1
      );
    });
  }

  return countries;
}

/**
 * Get only non-aggregate economies.
 */
function wb_getCountriesOnly() {
  return wb_getCountries().filter(function (c) {
    return !c.isAggregate;
  });
}

/**
 * Get only aggregate economies (regions, groups).
 */
function wb_getAggregates() {
  return wb_getCountries().filter(function (c) {
    return c.isAggregate;
  });
}

// ---------------------------------------------------------------------------
// Regions
// ---------------------------------------------------------------------------

function wb_getRegions() {
  var CACHE_KEY = "wb_regions";
  var regions = wb_cacheGet(CACHE_KEY);

  if (!regions) {
    var result = wbFetchAll("region", null);
    if (result.error || !result.data) {
      throw new Error(
        "Failed to load regions: " + (result.error || "empty response"),
      );
    }
    regions = result.data
      .filter(function (r) {
        return r.code && r.code.trim() !== "";
      })
      .map(function (r) {
        return { id: r.code || r.id, name: r.name || r.value };
      });
    wb_cacheSet(CACHE_KEY, regions);
  }

  return regions;
}

// ---------------------------------------------------------------------------
// Income levels
// ---------------------------------------------------------------------------

function wb_getIncomeLevels() {
  var CACHE_KEY = "wb_incomelevels";
  var levels = wb_cacheGet(CACHE_KEY);

  if (!levels) {
    var result = wbFetchAll("incomelevel", null);
    if (result.error || !result.data) {
      throw new Error(
        "Failed to load income levels: " + (result.error || "empty response"),
      );
    }
    levels = result.data.map(function (l) {
      return { id: l.id, name: l.value || l.name };
    });
    wb_cacheSet(CACHE_KEY, levels);
  }

  return levels;
}

// ---------------------------------------------------------------------------
// Lending types
// ---------------------------------------------------------------------------

function wb_getLendingTypes() {
  var CACHE_KEY = "wb_lendingtypes";
  var types = wb_cacheGet(CACHE_KEY);

  if (!types) {
    var result = wbFetchAll("lendingtype", null);
    if (result.error || !result.data) {
      throw new Error(
        "Failed to load lending types: " + (result.error || "empty response"),
      );
    }
    types = result.data.map(function (t) {
      return { id: t.id, name: t.value || t.name };
    });
    wb_cacheSet(CACHE_KEY, types);
  }

  return types;
}

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------

function wb_getTopics() {
  var CACHE_KEY = "wb_topics";
  var topics = wb_cacheGet(CACHE_KEY);

  if (!topics) {
    var result = wbFetchAll("topic", null);
    if (result.error || !result.data) {
      throw new Error(
        "Failed to load topics: " + (result.error || "empty response"),
      );
    }
    topics = result.data.map(function (t) {
      return {
        id: String(t.id),
        name: t.value || t.name,
        sourceNote: t.sourceNote || "",
      };
    });
    wb_cacheSet(CACHE_KEY, topics);
  }

  return topics;
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

function wb_getSources() {
  var CACHE_KEY = "wb_sources";
  var sources = wb_cacheGet(CACHE_KEY);

  if (!sources) {
    var result = wbFetchAll("source", null);
    if (result.error || !result.data) {
      throw new Error(
        "Failed to load sources: " + (result.error || "empty response"),
      );
    }
    sources = result.data.map(function (s) {
      return {
        id: String(s.id),
        name: s.name || s.value,
        description: s.description || "",
        url: s.url || "",
        lastUpdated: s.lastupdated || "",
      };
    });
    wb_cacheSet(CACHE_KEY, sources);
  }

  return sources;
}

// ---------------------------------------------------------------------------
// Indicators — search & detail
// ---------------------------------------------------------------------------

/**
 * Search indicators by keyword.
 *
 * Uses both the WB API ?q= search (single page only — not all pages,
 * since "population" returns 29 000+ results) and a local search
 * against the cached indicator catalogue for code/name matching.
 * Results are ranked by relevance.
 *
 * @param {string} query   — search term (e.g. "GDP", "co2", "population")
 * @param {string} [topicId] — optional topic ID to filter
 * @return {Object[]} [{id, name, sourceNote, sourceOrganization, topics}]
 */
function wb_searchIndicators(query, topicId) {
  if (!query || query.trim().length < 2) return [];

  var q = query.trim();
  var qLower = q.toLowerCase();

  // --- API search (single page only — up to 1000 results) ----------------
  var params = { q: q, _t: Date.now() };
  var resource = "indicator";
  if (topicId) {
    resource = "topic/" + topicId + "/indicator";
  }

  var url = wb_buildUrl(resource, params);
  var result = wbFetch(url);
  var apiResults = result.error || !result.data ? [] : result.data;

  // --- Local search from cached full catalogue ----------------------------
  var localMatches = [];
  if (!topicId) {
    var allIndicators = wb_getAllIndicatorsCached_();
    if (allIndicators && allIndicators.length > 0) {
      var apiIdSet = {};
      apiResults.forEach(function (a) {
        apiIdSet[a.id] = true;
      });

      localMatches = allIndicators.filter(function (ind) {
        if (apiIdSet[ind.id]) return false; // already in API results
        var idLower = ind.id.toLowerCase();
        var nameLower = (ind.name || "").toLowerCase();
        return (
          idLower.indexOf(qLower) !== -1 || nameLower.indexOf(qLower) !== -1
        );
      });
    }
  }

  var combined = apiResults.concat(localMatches);

  // --- Relevance scoring --------------------------------------------------
  combined.sort(function (a, b) {
    return wb_scoreIndicator_(b, qLower) - wb_scoreIndicator_(a, qLower);
  });

  return combined.slice(0, 100).map(function (ind) {
    return {
      id: ind.id,
      name: ind.name,
      sourceNote: (ind.sourceNote || "").substring(0, 300),
      sourceOrganization: ind.sourceOrganization || "",
      topics: (ind.topics || [])
        .map(function (t) {
          return { id: String(t.id), name: t.value };
        })
        .filter(function (t) {
          return t.id && t.id !== "";
        }),
    };
  });
}

/**
 * Get indicators for a topic (for the Browse tab).
 */
function wb_getTopicIndicators(topicId) {
  if (!topicId) return [];

  var cacheKey = "wb_topic_ind_" + topicId;
  var cached = wb_cacheGet(cacheKey);
  if (cached) return cached;

  var result = wbFetchAll("topic/" + topicId + "/indicator", null);
  if (result.error || !result.data) return [];

  var indicators = result.data.map(function (ind) {
    return {
      id: ind.id,
      name: ind.name,
      sourceNote: (ind.sourceNote || "").substring(0, 300),
    };
  });

  wb_cacheSet(cacheKey, indicators);
  return indicators;
}

/**
 * Get full detail for a single indicator.
 *
 * @param {string} code — e.g. 'SP.POP.TOTL'
 * @return {Object|null}
 */
function wb_getIndicatorInfo(code) {
  if (!code) return null;

  var result = wbFetch(wb_buildUrl("indicator/" + encodeURIComponent(code), {}));
  if (result.error || !result.data || result.data.length === 0) return null;

  var ind = result.data[0];
  return {
    id: ind.id,
    name: ind.name,
    unit: ind.unit || "",
    sourceNote: ind.sourceNote || "",
    sourceOrganization: ind.sourceOrganization || "",
    topics: (ind.topics || [])
      .map(function (t) {
        return { id: String(t.id), name: t.value };
      })
      .filter(function (t) {
        return t.id && t.id !== "";
      }),
    source: ind.source ? { id: ind.source.id, name: ind.source.value } : null,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Fetch and cache the full indicator catalogue (ID + name only) for
 * local code-fragment searching.
 * The WB API has ~17 000 indicators; we cache only id + name.
 */
function wb_getAllIndicatorsCached_() {
  var CACHE_KEY = "wb_all_indicators_slim";
  var cached = wb_cacheGet(CACHE_KEY);
  if (cached) return cached;

  var result = wbFetchAll("indicator", null);
  if (result.error || !result.data) return [];

  var slim = result.data.map(function (ind) {
    return {
      id: ind.id,
      name: ind.name,
      sourceNote: (ind.sourceNote || "").substring(0, 300),
      sourceOrganization: ind.sourceOrganization || "",
    };
  });

  wb_cacheSet(CACHE_KEY, slim);
  return slim;
}

/**
 * Score an indicator for relevance to a search query.
 * Higher score = more relevant.
 *
 * Scoring tiers:
 *   10 — name starts with query (e.g. "Population, total" for "population")
 *    8 — name contains query as a whole word
 *    5 — code contains query (e.g. "EN.ATM.CO2E.PC" for "co2")
 *    3 — name contains query as substring
 *    1 — matched by API but no direct name/code match (description match)
 */
function wb_scoreIndicator_(ind, qLower) {
  var name = (ind.name || "").toLowerCase();
  var code = ind.id.toLowerCase();

  if (name.indexOf(qLower) === 0) return 10; // name starts with query
  // Check for whole-word match: preceded by space/comma/start and followed by space/comma/end
  var wordPattern =
    "(^|[\\s,\\(])" +
    qLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
    "($|[\\s,\\)])";
  try {
    if (new RegExp(wordPattern).test(name)) return 8;
  } catch (_) {}
  if (code.indexOf(qLower) !== -1) return 5;
  if (name.indexOf(qLower) !== -1) return 3;
  return 1; // API returned it (likely description match)
}
