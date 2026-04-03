/**
 * WORLD_BANK_Cache.gs — Caching layer using CacheService.
 *
 * Metadata (countries, regions, topics, …) is cached for 6 hours.
 * Large payloads are automatically chunked across multiple cache keys
 * to work within the 100 KB per-key limit.
 */

var WB_CACHE_TTL = 21600; // 6 hours in seconds
var WB_CACHE_CHUNK_SIZE = 90000; // ~90 KB safe limit per key (leave headroom)

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Retrieve a value from cache.
 * @param {string} key
 * @return {*} Parsed object, or null if not cached.
 */
function wb_cacheGet(key) {
  var cache = CacheService.getScriptCache();
  var raw = cache.get(key);
  if (raw === null) return null;

  try {
    var envelope = JSON.parse(raw);

    // Single-chunk value
    if (!envelope._chunked) {
      return envelope.v;
    }

    // Multi-chunk: reassemble
    var chunkCount = envelope._chunks;
    var keys = [];
    for (var i = 0; i < chunkCount; i++) {
      keys.push(key + "_chunk_" + i);
    }
    var chunks = cache.getAll(keys);

    var parts = [];
    for (var j = 0; j < chunkCount; j++) {
      var part = chunks[key + "_chunk_" + j];
      if (part === null || part === undefined) {
        // A chunk expired or is missing — cache is stale
        return null;
      }
      parts.push(part);
    }
    return JSON.parse(parts.join(""));
  } catch (e) {
    return null;
  }
}

/**
 * Store a value in cache.
 * @param {string} key
 * @param {*} value  — any JSON-serialisable value
 * @param {number} [ttl]  — seconds (default: WB_CACHE_TTL)
 */
function wb_cacheSet(key, value, ttl) {
  ttl = ttl || WB_CACHE_TTL;
  var cache = CacheService.getScriptCache();
  var json = JSON.stringify(value);

  if (json.length <= WB_CACHE_CHUNK_SIZE) {
    // Fits in a single key
    cache.put(key, JSON.stringify({ v: value }), ttl);
    return;
  }

  // Split across multiple keys
  var chunks = [];
  for (var i = 0; i < json.length; i += WB_CACHE_CHUNK_SIZE) {
    chunks.push(json.substring(i, i + WB_CACHE_CHUNK_SIZE));
  }

  var bulkPut = {};
  for (var j = 0; j < chunks.length; j++) {
    bulkPut[key + "_chunk_" + j] = chunks[j];
  }

  // Store the header key
  cache.put(
    key,
    JSON.stringify({ _chunked: true, _chunks: chunks.length }),
    ttl,
  );
  // Store chunks
  cache.putAll(bulkPut, ttl);
}

/**
 * Remove a value from cache (including any chunks).
 * @param {string} key
 */
function wb_cacheRemove(key) {
  var cache = CacheService.getScriptCache();
  var raw = cache.get(key);
  if (raw) {
    try {
      var envelope = JSON.parse(raw);
      if (envelope._chunked) {
        var keys = [];
        for (var i = 0; i < envelope._chunks; i++) {
          keys.push(key + "_chunk_" + i);
        }
        cache.removeAll(keys);
      }
    } catch (_) {}
  }
  cache.remove(key);
}
