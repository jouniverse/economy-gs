// ---------------------------------------------------------------------------
// API key (stored in Script Properties; can be set from the sidebar)
// ---------------------------------------------------------------------------

function fred_saveApiKey(key) {
  if (!key || typeof key !== "string" || key.trim().length === 0) {
    throw new Error("Please provide a valid API key.");
  }
  PropertiesService.getScriptProperties().setProperty(
    "FRED_API_KEY",
    key.trim(),
  );
  return "API key saved.";
}

function fred_getApiKeyStatus() {
  var key =
    PropertiesService.getScriptProperties().getProperty("FRED_API_KEY");
  return { saved: !!key };
}
