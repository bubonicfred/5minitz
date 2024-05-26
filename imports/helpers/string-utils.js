/**
 * Utility class for performing string manipulation operations.
 */
export class StringUtils {
  /**
   * Creates a custom `toString` function for the given instance.
   * The `toString` function returns a string representation of the instance,
   * including the class name and the JSON representation of the instance.
   * @todo This function is not used in the current codebase and should be
   * @todo Write unit tests for this function.
   * @param {Object} instance - The instance for which to create the `toString`
   *     function.
   * @returns {Function} The custom `toString` function.
   */

  static createToString = (instance) => {
    return function () {
      const className = instance.constructor.name;
      let doc = instance;

      if (className === "InfoItem") {
        doc = instance._infoItemDoc;
      } else if (className === "Topic") {
        doc = instance._topicDoc;
      }

      return `${className}: ${JSON.stringify(doc, null, 4)}`;
    };
  };

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
