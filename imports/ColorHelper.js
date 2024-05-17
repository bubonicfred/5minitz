/**
 * Provides utility functions for working with colors.
 */
export class ColorHelper {
  /**
   * Converts a hexadecimal color string to an RGB object.
   *
   * @param {string} hex - The hexadecimal color string to convert, e.g.
   *     "#FF0000" for red.
   * @returns {object|null} - An object with `r`, `g`, and `b` properties
   *     representing the RGB values, or `null` if the input is invalid.
   */
  static hex2rgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  /**
   * Determines whether a given color is considered a "dark" color.
   *
   * @param {string|{r: number, g: number, b: number}} color - The color to
   *     check, either as a hexadecimal string or an RGB object.
   * @returns {boolean} `true` if the color is considered dark, `false`
   *     otherwise.
   */
  static isDarkColor(color) {
    if (typeof color === "string") {
      color = ColorHelper.hex2rgb(color);
    }
    const o = Math.round(
      (parseInt(color.r) * 299 +
        parseInt(color.g) * 587 +
        parseInt(color.b) * 114) /
        1000,
    );
    return o < 125;
  }

  /**
   * Checks if the provided hex color string is valid.
   * @param {string} hexString - The hex color string to validate.
   * @returns {boolean} - True if the hex color string is valid, false
   *     otherwise.
   */
  static isValidHexColorString(hexString) {
    if (hexString === null || hexString === "" || hexString === "#")
      return false;
    return ColorHelper.hex2rgb(hexString) !== null;
  }
}
