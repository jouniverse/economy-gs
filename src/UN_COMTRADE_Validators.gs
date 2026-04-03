/**
 * UN Comtrade Data Fetcher for Google Sheets
 * UN_COMTRADE_Validators.gs — Input validation before API calls
 */

/**
 * Validate all parameters before making an API call.
 * @param {Object} p - Parameters from the sidebar.
 * @returns {Object} {valid: boolean, error: string|null}
 */
function comtrade_validateParams(p) {
  if (!p) return comtrade_fail_("No parameters provided.");

  // Mode
  var validModes = ["summary", "balance", "partners", "products", "bilateral"];
  if (validModes.indexOf(p.mode) === -1) {
    return comtrade_fail_("Invalid query mode: " + p.mode);
  }

  // Data type
  if (p.typeCode !== "C" && p.typeCode !== "S") {
    return comtrade_fail_("Data type must be Goods (C) or Services (S).");
  }

  // Frequency
  if (p.freqCode !== "A" && p.freqCode !== "M") {
    return comtrade_fail_("Frequency must be Annual (A) or Monthly (M).");
  }
  if (p.typeCode === "S" && p.freqCode === "M") {
    return comtrade_fail_("Services data is only available at Annual frequency.");
  }

  // Reporter
  if (!p.reporterCode || String(p.reporterCode).trim() === "") {
    return comtrade_fail_("Please select a reporter country.");
  }

  // Partner (mode-specific)
  if (p.mode === "bilateral") {
    if (
      !p.partnerCode ||
      String(p.partnerCode).trim() === "" ||
      String(p.partnerCode) === "0"
    ) {
      return comtrade_fail_(
        "Bilateral mode requires a specific partner country (not World).",
      );
    }
  }

  // Period
  if (!p.period || String(p.period).trim() === "") {
    return comtrade_fail_("Please select at least one period.");
  }
  var periods = String(p.period).split(",");
  for (var i = 0; i < periods.length; i++) {
    var pr = periods[i].trim();
    if (!/^\d{4}(\d{2})?$/.test(pr)) {
      return comtrade_fail_('Invalid period format: "' + pr + '". Use YYYY or YYYYMM.');
    }
  }

  // Flow
  if (!p.flowCode || String(p.flowCode).trim() === "") {
    return comtrade_fail_("Please select at least one trade flow direction.");
  }

  // Classification
  if (!p.clCode || String(p.clCode).trim() === "") {
    return comtrade_fail_("Please select a classification system.");
  }

  // Commodity code
  if (!p.cmdCode || String(p.cmdCode).trim() === "") {
    return comtrade_fail_("Please select a commodity level.");
  }

  // ─── Scope Guards ───────────────────────────────────────────────────────

  // Guard: 4-digit commodities + all partners is too large
  if (
    p.cmdCode === "AG4" &&
    (!p.partnerCode || String(p.partnerCode) === "0")
  ) {
    // Allow only if mode is NOT partners (which fetches ALL partners)
    if (p.mode === "partners") {
      return comtrade_fail_(
        "4-digit commodity breakdown with all partners would return too much data. Please use 2-digit or Total commodity level, or select a specific partner.",
      );
    }
  }

  // Guard: Monthly + all partners is very large
  if (p.freqCode === "M" && p.mode === "partners") {
    return comtrade_fail_(
      "Monthly frequency with all partners would return too much data. Please use Annual frequency, or switch to a mode with a specific partner.",
    );
  }

  // Guard: URL length estimate (rough check)
  var estimatedUrlLength =
    200 + // base URL
    String(p.reporterCode).length +
    String(p.partnerCode || "").length +
    String(p.period).length +
    String(p.flowCode).length +
    String(p.cmdCode).length;
  if (estimatedUrlLength > 3800) {
    return comtrade_fail_(
      "Too many parameters selected. The request URL would be too long. Please narrow your selection.",
    );
  }

  return { valid: true, error: null };
}

/** @private */
function comtrade_fail_(msg) {
  return { valid: false, error: msg };
}
