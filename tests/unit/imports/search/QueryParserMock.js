/**
 * Mock class for QueryParser.
 */
export class QueryParserMock {
  constructor() {
    this.init();
  }

  /**
   * Initializes the QueryParserMock instance.
   */
  init() {
    this.caseSensitive = false;
    this.searchTokens = [];
    this.filterTokens = [];
    this.labelTokens = [];
  }

  /**
   * Resets the QueryParserMock instance.
   * This method does nothing because it will be called before calling the parse
   * method.
   */
  reset() {
    // do nothing here, because this will be called before calling the parse
    // method
  }

  /**
   * Parses the query.
   */
  parse() {}

  /**
   * Returns the search tokens.
   * @returns {Array} The search tokens.
   */
  getSearchTokens() {
    return this.searchTokens;
  }

  /**
   * Returns the filter tokens.
   * @returns {Array} The filter tokens.
   */
  getFilterTokens() {
    return this.filterTokens;
  }

  /**
   * Returns the label tokens.
   * @returns {Array} The label tokens.
   */
  getLabelTokens() {
    return this.labelTokens.map((token) => {
      return { token, ids: [token] };
    });
  }

  /**
   * Checks if the query has a keyword.
   * @returns {boolean} True if the query has a keyword, false otherwise.
   */
  hasKeyword() {
    return true;
  }

  /**
   * Checks if the query is case sensitive.
   * @returns {boolean} True if the query is case sensitive, false otherwise.
   */
  isCaseSensitive() {
    return this.caseSensitive;
  }
}
