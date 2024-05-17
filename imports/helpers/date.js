/**
 * Formats a given date object as an ISO 8601 string with the time component.
 *
 * @param {Date} aDate - The date object to format.
 * @param {boolean} [timeZoneCorrection=true] - Whether to apply the time zone
 *     offset to the date.
 * @returns {string} The formatted date string in the format "YYYY-MM-DD
 *     hh:mm:ss".
 */
export const formatDateISO8601Time = (aDate, timeZoneCorrection = true) => {
  try {
    const tzoffset = timeZoneCorrection
      ? aDate.getTimezoneOffset() * 60_000
      : 0; // offset in milliseconds
    return new Date(aDate - tzoffset)
      .toISOString()
      .substring(0, 19)
      .replace("T", " "); // YYYY-MM-DD hh:mm:ss
  } catch (e) {
    return "NaN-NaN-NaN 00:00:00";
  }
};

// removes leading "00:" if there are no hours
/**
 * Converts a millisecond value to a formatted time string in the format
 * "HH:MM:SS".
 *
 * @param {number} ms - The number of milliseconds to convert.
 * @returns {string} The formatted time string.
 */
export const msToHHMMSS = (ms) => {
  const date = new Date(ms);
  const timeString = formatDateISO8601Time(date, false).slice(-8);
  return timeString.replace(/^00:/, "");
};

/**
 * Formats a given date as an ISO 8601 date string (YYYY-MM-DD) with the
 * timezone offset removed.
 *
 * @param {Date} aDate - The date to format.
 * @returns {string} The formatted date string, or "NaN-NaN-NaN" if an error
 *     occurs.
 */
export const formatDateISO8601 = (aDate) => {
  aDate.setHours(0, -aDate.getTimezoneOffset(), 0, 0); // removing the timezone offset.
  try {
    return aDate.toISOString().substring(0, 10); // YYYY-MM-DD
  } catch (e) {
    return "NaN-NaN-NaN";
  }
};

/**
 * Calculates the date that is a specified number of days from the current date
 * or a provided date.
 *
 * @param {number} deltaDays - The number of days to add or subtract from the
 *     current date or provided date.
 * @param {Date} [currentDate] - The date to use as the starting point. If not
 *     provided, the current date will be used.
 * @returns {string} The date in ISO 8601 format (YYYY-MM-DD).
 */
export const currentDatePlusDeltaDays = (deltaDays, currentDate) => {
  const aDate = currentDate ? currentDate : new Date();
  if (deltaDays) {
    aDate.setDate(aDate.getDate() + deltaDays);
  }
  return formatDateISO8601(aDate);
};

/**
 * Extracts a date string from the given input string.
 *
 * @param {string} string - The input string to search for a date.
 * @returns {string|boolean} - The extracted date string if found, or `false` if
 *     not found.
 */
export const extractDateFromString = (string) => {
  const regEx = /[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])/g;
  const match = regEx.exec(string);
  return match !== null ? match[0] : false;
};
