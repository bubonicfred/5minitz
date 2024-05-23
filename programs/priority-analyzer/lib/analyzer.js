/**
 * Represents an Analyzer object that analyzes action items and updates token
 * counters based on their priority.
 */
export class Analyzer {
  constructor() {
    this.tokens = {};
  }

  /**
   * Analyzes an action item and updates the token counter based on its
   * priority.
   * @param {Object} item - The action item to be analyzed.
   */
  analyzeActionItem(item) {
    const priority = item.priority;
    if (!priority) {
      return;
    }
    const token = this.getToken(priority);
    if (token) {
      token.counter++;
    } else {
      this.addToken(priority);
    }
  }

  /**
   * Retrieves the token associated with the given priority.
   *
   * @param {string} priority - The priority for which to retrieve the token.
   * @returns {string} The token associated with the given priority.
   */
  getToken(priority) {
    return this.tokens[priority.toUpperCase()];
  }

  /**
   * Adds a token with the specified priority.
   * @param {string} priority - The priority of the token.
   */
  addToken(priority) {
    this.tokens[priority.toUpperCase()] = { counter: 1 };
  }
}
