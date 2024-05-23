/**
 * Helper object for working with sub-elements.
 * @namespace subElementsHelper
 */
export const subElementsHelper = {
  /**
   * Finds the index of an element in an array based on its ID.
   *
   * @param {string} id - The ID of the element to find.
   * @param {Array} elements - The array of elements to search in.
   * @param {string} [attributeName="_id"] - The name of the attribute that
   *     holds the ID.
   * @returns {number|undefined} - The index of the element if found, otherwise
   *     undefined.
   */
  findIndexById(id, elements, attributeName) {
    if (!attributeName) {
      attributeName = "_id";
    }
    let i;
    for (i = 0; i < elements.length; i++) {
      if (id === elements[i][attributeName]) {
        return i;
      }
    }
    return undefined;
  },

  /**
   * Retrieves an element from an array of elements by its ID.
   *
   * @param {string} id - The ID of the element to retrieve.
   * @param {Array} elements - The array of elements to search in.
   * @param {string} attributeName - The name of the attribute that contains the
   *     ID.
   * @returns {Object|undefined} - The element with the specified ID, or
   *     undefined if not found.
   */
  getElementById(id, elements, attributeName) {
    const i = subElementsHelper.findIndexById(id, elements, attributeName);
    if (i !== undefined) {
      return elements[i];
    }
    return undefined;
  },
};
