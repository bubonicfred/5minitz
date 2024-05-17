/**
 * Utility class for performing string manipulation operations.
 */
export class StringUtils {
  static eraseSubstring(string, substring) {
    string = string.replace(`${substring} `, "");
    string = string.replace(` ${substring}`, "");
    return string.replace(substring, "");
  }
}
