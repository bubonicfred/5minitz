/**
 * Utility class for performing string manipulation operations.
 */
export class StringUtils {
  /**
   * Removes all occurrences of a substring from a given string.
   *
   * @param {string} string - The original string.
   * @param {string} substring - The substring to be removed.
   * @returns {string} - The modified string with all occurrences of the
   *     substring removed.
   */
  static eraseSubstring(string, substring) {
    string = string.replace(`${substring} `, "");
    string = string.replace(` ${substring}`, "");
    return string.replace(substring, "");
  }
}
