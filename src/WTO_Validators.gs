/**
 * Validate WTO timeseries fetch parameters.
 */

var WTO_MAX_RECORDS_CAP = 50000;

function wto_validateFetchParams(params) {
  if (!params || typeof params !== "object") {
    return { valid: false, error: "Missing parameters." };
  }
  if (!params.i || String(params.i).trim() === "") {
    return { valid: false, error: "Select an indicator (code)." };
  }
  var max = params.max != null ? parseInt(String(params.max), 10) : 500;
  if (isNaN(max) || max < 1) {
    return { valid: false, error: "Max records must be at least 1." };
  }
  if (max > WTO_MAX_RECORDS_CAP) {
    return {
      valid: false,
      error: "Max records cannot exceed " + WTO_MAX_RECORDS_CAP + ".",
    };
  }
  return { valid: true };
}

function wto_normalizeFetchParams_(params) {
  return {
    i: String(params.i).trim(),
    r: params.r != null && params.r !== "" ? String(params.r) : "all",
    p: params.p != null && params.p !== "" ? String(params.p) : "default",
    ps: params.ps != null && params.ps !== "" ? String(params.ps) : "default",
    pc: params.pc != null && params.pc !== "" ? String(params.pc) : "default",
    spc: params.spc === true || params.spc === "true",
    fmt: "json",
    mode: params.mode || "full",
    dec: params.dec != null ? String(params.dec) : "default",
    off: params.off != null ? parseInt(String(params.off), 10) || 0 : 0,
    max: Math.min(
      WTO_MAX_RECORDS_CAP,
      params.max != null ? parseInt(String(params.max), 10) || 500 : 500,
    ),
    head: params.head === "M" ? "M" : "H",
    lang: params.lang != null ? parseInt(String(params.lang), 10) || 1 : 1,
    meta: params.meta === true,
  };
}
