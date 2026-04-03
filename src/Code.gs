/**
 * Economy Data — unified Google Sheets add-on.
 *
 * Aggregates BIS, ECB, FRED, IMF, OECD, World Bank, WTO and
 * UN Comtrade data APIs behind a single menu bar.
 */

/* ───────────────────────────── Menu ───────────────────────────── */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("Economy Data")
    .addItem("BIS Data", "showBisSidebar")
    .addItem("ECB Data", "showEcbSidebar")
    .addItem("FRED Data", "showFredSidebar")
    .addItem("IMF Data", "showImfSidebar")
    .addItem("OECD Data", "showOecdSidebar")
    .addItem("UN Comtrade Data", "showComtradeSidebar")
    .addItem("World Bank Data", "showWorldBankSidebar")
    .addItem("WTO Data", "showWtoSidebar")
    .addSeparator()
    .addItem("Settings", "openSettings")
    .addToUi();
}

function onInstall(e) {
  onOpen(e);
}

/* ───────────────────── HTML template helper ───────────────────── */

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* ───────────────────── Sidebar launchers ──────────────────────── */

function showBisSidebar() {
  var html = HtmlService.createTemplateFromFile("BIS_Sidebar")
    .evaluate()
    .setTitle("BIS Data")
    .setWidth(320);
  SpreadsheetApp.getUi().showSidebar(html);
}

function showEcbSidebar() {
  var html = HtmlService.createHtmlOutputFromFile("ECB_Sidebar")
    .setTitle("ECB Data")
    .setWidth(320);
  SpreadsheetApp.getUi().showSidebar(html);
}

function showFredSidebar() {
  var html = HtmlService.createHtmlOutputFromFile("FRED_Sidebar")
    .setTitle("FRED Data")
    .setWidth(320);
  SpreadsheetApp.getUi().showSidebar(html);
}

function showImfSidebar() {
  var html = HtmlService.createHtmlOutputFromFile("IMF_Sidebar")
    .setTitle("IMF Data")
    .setWidth(320);
  SpreadsheetApp.getUi().showSidebar(html);
}

function showOecdSidebar() {
  var html = HtmlService.createHtmlOutputFromFile("OECD_Sidebar")
    .setTitle("OECD Data")
    .setWidth(320);
  SpreadsheetApp.getUi().showSidebar(html);
}

function showWorldBankSidebar() {
  var html = HtmlService.createHtmlOutputFromFile("WORLD_BANK_Sidebar")
    .setTitle("World Bank Data")
    .setWidth(320);
  SpreadsheetApp.getUi().showSidebar(html);
}

function showWtoSidebar() {
  var html = HtmlService.createTemplateFromFile("WTO_Sidebar")
    .evaluate()
    .setTitle("WTO Data")
    .setWidth(320);
  SpreadsheetApp.getUi().showSidebar(html);
}

function showComtradeSidebar() {
  var html = HtmlService.createTemplateFromFile("UN_COMTRADE_Sidebar")
    .evaluate()
    .setTitle("UN Comtrade Data")
    .setWidth(320);
  SpreadsheetApp.getUi().showSidebar(html);
}

/* ──────────────────────── Settings dialog ─────────────────────── */

function openSettings() {
  var html = HtmlService.createHtmlOutputFromFile("Settings")
    .setWidth(480)
    .setHeight(520);
  SpreadsheetApp.getUi().showModalDialog(html, "Economy Data — Settings");
}

function getSettingsData() {
  var props = PropertiesService.getScriptProperties();
  return {
    fredKey: props.getProperty("FRED_API_KEY") ? true : false,
    wtoKey: props.getProperty("WTO_API_KEY") ? true : false,
    comtradeKey: props.getProperty("COMTRADE_API_KEY") ? true : false,
  };
}

function saveSettings(keys) {
  var props = PropertiesService.getScriptProperties();
  if (keys.fredKey !== undefined && keys.fredKey !== null)
    props.setProperty("FRED_API_KEY", keys.fredKey.trim());
  if (keys.wtoKey !== undefined && keys.wtoKey !== null)
    props.setProperty("WTO_API_KEY", keys.wtoKey.trim());
  if (keys.comtradeKey !== undefined && keys.comtradeKey !== null)
    props.setProperty("COMTRADE_API_KEY", keys.comtradeKey.trim());
  return getSettingsData();
}
