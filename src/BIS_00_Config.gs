/**
 * Config.gs — Constants and configuration for BIS Data add-on
 */

var BIS_CONFIG = {
  API_BASE: "https://stats.bis.org/api/v2",
  AGENCY: "BIS",

  ACCEPT_STRUCTURE: "application/vnd.sdmx.structure+json;version=2.0.0",

  CACHE_TTL_METADATA: 21600, // 6 hours in seconds
  CACHE_CHUNK_SIZE: 90000, // ~90KB per chunk (CacheService limit is 100KB)

  DEFAULT_LAST_N_OBS: 100,
  FETCH_TIMEOUT: 30000, // 30s UrlFetchApp timeout

  SIDEBAR_TITLE: "BIS Data",
  SIDEBAR_WIDTH: 320,

  CATEGORIES: {
    "International banking": [
      { id: "LBS", name: "Locational banking statistics", topic: "LBS" },
      { id: "CBS", name: "Consolidated banking statistics", topic: "CBS" },
    ],
    "Debt securities": [
      { id: "DSS", name: "Debt securities statistics", topic: "DSS" },
      { id: "IDS", name: "International debt securities", topic: "IDS" },
    ],
    Credit: [
      {
        id: "TC",
        name: "Credit to the non-financial sector",
        topic: "TOTAL_CREDIT",
      },
      { id: "CREDIT_GAP", name: "Credit-to-GDP gaps", topic: "CREDIT_GAP" },
      { id: "DSR", name: "Debt service ratios", topic: "DSR" },
    ],
    "Global liquidity": [
      { id: "GLI", name: "Global liquidity indicators", topic: "GLI" },
    ],
    Derivatives: [
      { id: "XTD_DER", name: "Exchange-traded derivatives", topic: "XTD_DER" },
      { id: "OTC_DER", name: "OTC derivatives outstanding", topic: "OTC_DER" },
      { id: "DER", name: "Triennial Survey", topic: "DER" },
    ],
    "Property prices": [
      { id: "SPP", name: "Selected residential property prices", topic: "RPP" },
      { id: "CPP", name: "Commercial property prices", topic: "CPP" },
    ],
    "Consumer prices": [
      { id: "LONG_CPI", name: "Consumer prices", topic: "CPI" },
    ],
    "Exchange rates": [
      { id: "XRU", name: "Bilateral exchange rates (USD)", topic: "XRU" },
      { id: "EER", name: "Effective exchange rates", topic: "EER" },
    ],
    "Central bank statistics": [
      { id: "CBTA", name: "Central bank total assets", topic: "CBTA" },
      { id: "CBPOL", name: "Central bank policy rates", topic: "CBPOL" },
    ],
    "Payment statistics": [
      { id: "CPMI_CT", name: "Retail payments & currency", topic: "CPMI_CT" },
      {
        id: "CPMI_FMI",
        name: "Financial market infrastructures",
        topic: "CPMI_FMI",
      },
    ],
  },
};
