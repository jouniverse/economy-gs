/**
 * Cache.gs — CacheService wrapper with chunked storage for large responses
 */

var BisCache = (function () {
  var cache_ = CacheService.getScriptCache();

  /**
   * Get a cached value (handles chunked keys).
   * @param {string} key
   * @return {*} parsed JSON or null
   */
  function get(key) {
    var meta = cache_.get(key);
    if (!meta) return null;

    try {
      var info = JSON.parse(meta);
      if (info._chunked) {
        return getChunked_(key, info._chunks);
      }
      return info;
    } catch (e) {
      return null;
    }
  }

  /**
   * Put a value in cache (auto-chunks if above size limit).
   * @param {string} key
   * @param {*} value  — will be JSON-serialized
   * @param {number} [ttl]  — seconds, defaults to metadata TTL
   */
  function put(key, value, ttl) {
    ttl = ttl || BIS_CONFIG.CACHE_TTL_METADATA;
    var json = JSON.stringify(value);
    var limit = BIS_CONFIG.CACHE_CHUNK_SIZE;

    if (json.length <= limit) {
      cache_.put(key, json, ttl);
    } else {
      putChunked_(key, json, ttl, limit);
    }
  }

  /** Remove a key (and any chunks). */
  function remove(key) {
    var meta = cache_.get(key);
    if (meta) {
      try {
        var info = JSON.parse(meta);
        if (info._chunked) {
          for (var i = 0; i < info._chunks; i++) {
            cache_.remove(key + "_chunk_" + i);
          }
        }
      } catch (e) {
        /* ignore */
      }
    }
    cache_.remove(key);
  }

  function clearAll() {
    // CacheService has no listKeys; we remove known prefixes
    // This is a best-effort clear
    cache_.removeAll([
      "bis_dataflows",
      "bis_structure_LBS",
      "bis_structure_CBS",
      "bis_structure_DSS",
      "bis_structure_IDS",
      "bis_structure_TOTAL_CREDIT",
      "bis_structure_CREDIT_GAPS",
      "bis_structure_DSR",
      "bis_structure_GLI",
      "bis_structure_XTD_DER",
      "bis_structure_OTC_DER",
      "bis_structure_DER",
      "bis_structure_RPP",
      "bis_structure_CPP",
      "bis_structure_CPI",
      "bis_structure_XRU",
      "bis_structure_EER",
      "bis_structure_CBTA",
      "bis_structure_CBPOL",
      "bis_structure_CPMI_CT",
      "bis_structure_CPMI_FMI",
    ]);
  }

  // ─── Internal chunking ───

  function putChunked_(key, json, ttl, limit) {
    var chunks = [];
    for (var i = 0; i < json.length; i += limit) {
      chunks.push(json.substring(i, i + limit));
    }
    // Store meta entry pointing to chunks
    var meta = JSON.stringify({ _chunked: true, _chunks: chunks.length });
    cache_.put(key, meta, ttl);
    for (var j = 0; j < chunks.length; j++) {
      cache_.put(key + "_chunk_" + j, chunks[j], ttl);
    }
  }

  function getChunked_(key, count) {
    var keys = [];
    for (var i = 0; i < count; i++) {
      keys.push(key + "_chunk_" + i);
    }
    var parts = cache_.getAll(keys);
    var json = "";
    for (var j = 0; j < count; j++) {
      var part = parts[key + "_chunk_" + j];
      if (!part) return null; // chunk expired
      json += part;
    }
    try {
      return JSON.parse(json);
    } catch (e) {
      return null;
    }
  }

  return {
    get: get,
    put: put,
    remove: remove,
    clearAll: clearAll,
  };
})();
