/**
 * BIS_Analytics.gs — Custom sheet functions for BIS data analysis
 *
 * These functions can be called directly from cells, e.g. =BIS_GROWTH_RATE(B2:B100, 1)
 */

/**
 * Calculate period-over-period growth rate (%).
 *
 * @param {Range} range  A single column of numeric values.
 * @param {number} [periods=1]  Number of periods for the growth calculation.
 * @return {Array<Array>} Growth rates as percentages.
 * @customfunction
 */
function BIS_GROWTH_RATE(range, periods) {
  periods = periods || 1;
  var values = bis_flattenRange_(range);
  var result = [];

  for (var i = 0; i < values.length; i++) {
    if (
      i < periods ||
      values[i - periods] === 0 ||
      values[i - periods] === ""
    ) {
      result.push([""]);
    } else {
      result.push([
        ((values[i] - values[i - periods]) / Math.abs(values[i - periods])) *
          100,
      ]);
    }
  }
  return result;
}

/**
 * Calculate simple moving average.
 *
 * @param {Range} range  A single column of numeric values.
 * @param {number} window  Window size for the moving average.
 * @return {Array<Array>} Moving average values.
 * @customfunction
 */
function BIS_MOVING_AVG(range, window) {
  if (!window || window < 1) throw new Error("Window must be >= 1");
  var values = bis_flattenRange_(range);
  var result = [];

  for (var i = 0; i < values.length; i++) {
    if (i < window - 1) {
      result.push([""]);
    } else {
      var sum = 0;
      var count = 0;
      for (var j = i - window + 1; j <= i; j++) {
        if (values[j] !== "" && !isNaN(values[j])) {
          sum += values[j];
          count++;
        }
      }
      result.push([count > 0 ? sum / count : ""]);
    }
  }
  return result;
}

/**
 * Calculate summary statistics for a range.
 *
 * @param {Range} range  A range of numeric values.
 * @return {Array<Array>} Table with [Statistic, Value] rows: Count, Min, Max, Mean, Median, Std Dev.
 * @customfunction
 */
function BIS_SUMMARY(range) {
  var values = bis_flattenRange_(range).filter(function (v) {
    return v !== "" && !isNaN(v);
  });
  var n = values.length;

  if (n === 0) return [["No numeric data"]];

  values.sort(function (a, b) {
    return a - b;
  });

  var sum = 0;
  for (var i = 0; i < n; i++) sum += values[i];
  var mean = sum / n;

  var median;
  if (n % 2 === 0) {
    median = (values[n / 2 - 1] + values[n / 2]) / 2;
  } else {
    median = values[Math.floor(n / 2)];
  }

  var variance = 0;
  for (var j = 0; j < n; j++) {
    variance += (values[j] - mean) * (values[j] - mean);
  }
  var stdDev = Math.sqrt(variance / (n > 1 ? n - 1 : 1));

  return [
    ["Count", n],
    ["Min", values[0]],
    ["Max", values[n - 1]],
    ["Mean", mean],
    ["Median", median],
    ["Std Dev", stdDev],
  ];
}

/**
 * Calculate year-over-year change (%).
 * Assumes data is in chronological order with consistent frequency.
 *
 * @param {Range} range  A single column of numeric values.
 * @param {number} [periodsPerYear=4]  Observations per year (4=quarterly, 12=monthly, 1=annual).
 * @return {Array<Array>} Year-over-year percentage changes.
 * @customfunction
 */
function BIS_YOY_CHANGE(range, periodsPerYear) {
  periodsPerYear = periodsPerYear || 4;
  return BIS_GROWTH_RATE(range, periodsPerYear);
}

function bis_flattenRange_(range) {
  if (!Array.isArray(range)) return [range];

  var flat = [];
  for (var i = 0; i < range.length; i++) {
    if (Array.isArray(range[i])) {
      flat.push(range[i][0]);
    } else {
      flat.push(range[i]);
    }
  }

  for (var j = 0; j < flat.length; j++) {
    if (flat[j] === "" || flat[j] === null || flat[j] === undefined) {
      flat[j] = "";
    } else if (typeof flat[j] !== "number") {
      var n = Number(flat[j]);
      flat[j] = isNaN(n) ? "" : n;
    }
  }
  return flat;
}
