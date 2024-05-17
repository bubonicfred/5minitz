import { Meteor } from "meteor/meteor";

import { ColorHelper } from "./ColorHelper";
import { MeetingSeries } from "./meetingseries";

/**
 * Represents a label object with various properties and methods.
 *
 * The `Label` class is used to create and manage label objects, which can be
 * associated with various entities (e.g., meeting series) in the application.
 * It provides methods to create, retrieve, and update label information.
 *
 * @class Label
 * @param {Object} source - The source object containing the initial label data.
 * @param {string} source.name - The name of the label.
 * @param {string} source.color - The color of the label in hexadecimal format.
 * @param {boolean} [source.isDefaultLabel=false] - Indicates whether the label
 *     is a default label.
 * @param {boolean} [source.isDisabled=false] - Indicates whether the label is
 *     disabled.
 * @throws {Meteor.Error} If the source object is not provided.
 */
export class Label {
  constructor(source) {
    if (!source) {
      throw new Meteor.Error(
        "It is not allowed to create a Label without the source",
      );
    }

    this._labelDoc = Object.assign(
      {},
      {
        isDefaultLabel: false,
        isDisabled: false,
        color: "#e6e6e6",
      },
      source,
    );

    const nameAndColor = Label._separateNameAndColor(source.name);
    if (typeof nameAndColor !== "string") {
      this._labelDoc.name = nameAndColor.name;
      this._labelDoc.color = nameAndColor.color;
    }

    this._checkLabelColor();
  }

  /**
   * Separates a string containing a name and a color into an object with `name`
   * and `color` properties.
   *
   * The input string is expected to be in the format `"<name>#<color>"`, where
   * `<name>` is a string and `<color>` is a hexadecimal color code (e.g. `"My
   * Label#ff0000"`).
   *
   * @param {string} nameAndColorStr - The input string containing the name and
   *     color.
   * @returns {Object|string} - If the input string matches the expected format,
   *     an object with `name` and `color` properties is returned. Otherwise,
   *     the original input string is returned.
   */
  static _separateNameAndColor(nameAndColorStr) {
    const nameAndColor = nameAndColorStr.match(
      /(.*)(#([a-f\d][a-f\d][a-f\d]){1,2})$/,
    );
    if (nameAndColor && nameAndColor.length > 2) {
      return {
        name: nameAndColor[1],
        color: nameAndColor[2],
      };
    }

    return nameAndColorStr;
  }

  /**
   * Creates a new Label instance from the given parent MeetingSeries and label
   * ID.
   *
   * @param {MeetingSeries} parentMeetingSeries - The parent MeetingSeries for
   *     the label.
   * @param {string} labelId - The ID of the label to create.
   * @returns {Label|null} - The created Label instance, or null if the label
   *     does not exist.
   */
  static createLabelById(parentMeetingSeries, labelId) {
    parentMeetingSeries = Label._createParentMeetingSeries(parentMeetingSeries);

    const labelDoc = parentMeetingSeries.findLabel(labelId);
    if (labelDoc) return new Label(labelDoc);
    return null;
  }

  /**
   * Creates a new Label instance by the given label name.
   *
   * @param {Object} parentMeetingSeries - The parent meeting series for the
   *     label.
   * @param {string} labelName - The name of the label to create.
   * @returns {Label|null} - The created Label instance, or null if not found.
   */
  static createLabelByName(parentMeetingSeries, labelName) {
    const nameAndColor = Label._separateNameAndColor(labelName);
    if (typeof nameAndColor !== "string") {
      labelName = nameAndColor.name;
    }

    parentMeetingSeries = Label._createParentMeetingSeries(parentMeetingSeries);

    const labelDoc = parentMeetingSeries.findLabelByName(labelName);
    if (labelDoc) return new Label(labelDoc);
    return null;
  }

  /**
   * Finds a label in the given parent meeting series that contains the
   * specified substring in its name, optionally case-sensitive.
   *
   * @param {Object} parentMeetingSeries - The parent meeting series to search
   *     for the label.
   * @param {string} name - The substring to search for in the label name.
   * @param {boolean} [caseSensitive=false] - Whether the search should be
   *     case-sensitive.
   * @returns {Object|null} - The label document if found, or null if not found.
   */
  static findLabelsContainingSubstring(
    parentMeetingSeries,
    name,
    caseSensitive,
  ) {
    parentMeetingSeries = Label._createParentMeetingSeries(parentMeetingSeries);

    const labelDoc = parentMeetingSeries.findLabelContainingSubstr(
      name,
      caseSensitive,
    );
    if (labelDoc) return labelDoc;
    return null;
  }

  /**
   * Creates a new `MeetingSeries` instance from the provided
   * `parentMeetingSeries` object.
   *
   * @param {string|Object} parentMeetingSeries - The parent meeting series,
   *     either as a string or an object with a `findLabel` method.
   * @returns {MeetingSeries} - A new `MeetingSeries` instance.
   * @throws {Meteor.Error} - If the `parentMeetingSeries` is invalid.
   */
  static _createParentMeetingSeries(parentMeetingSeries) {
    if (typeof parentMeetingSeries === "string") {
      return new MeetingSeries(parentMeetingSeries);
    } else if (
      Object.prototype.hasOwnProperty.call(parentMeetingSeries, "findLabel")
    ) {
      return parentMeetingSeries;
    }

    throw new Meteor.Error("Invalid parent meeting series");
  }

  /**
   * Returns the unique identifier (ID) of the label document.
   * @returns {string} The ID of the label document.
   */
  getId() {
    return this._labelDoc._id;
  }

  /**
   * Sets the name of the label.
   * @param {string} name - The new name for the label.
   */
  setName(name) {
    this._labelDoc.name = name;
  }

  /**
   * Returns the name of the label.
   * @returns {string} The name of the label.
   */
  getName() {
    return this._labelDoc.name;
  }

  /**
   * Returns the color of the label.
   * @returns {string} The color of the label.
   */
  getColor() {
    return this._labelDoc.color;
  }

  /**
   * Sets the color of the label.
   * @param {string} color - The new color to set for the label.
   */
  setColor(color) {
    this._labelDoc.color = color;
  }

  /**
   * Determines if the current label has a dark background color.
   * @returns {boolean} True if the label has a dark background color, false
   *     otherwise.
   */
  hasDarkBackground() {
    return ColorHelper.isDarkColor(this.getColor());
  }

  /**
   * Returns the label document.
   * @returns {Object} The label document.
   */
  getDocument() {
    return this._labelDoc;
  }

  /**
   * Saves the parent meeting series with the label.
   * @param {Object} parentMeetingSeries - The parent meeting series to save.
   */
  save(parentMeetingSeries) {
    parentMeetingSeries = Label._createParentMeetingSeries(parentMeetingSeries);

    parentMeetingSeries.upsertLabel(this._labelDoc);
    parentMeetingSeries.save();
  }

  /**
   * Checks if the label color is a valid hex color string.
   * If the color is invalid, throws a Meteor.Error with the code
   * "invalid-color" and the message "Label color must be a valid hex code".
   */
  _checkLabelColor() {
    if (!ColorHelper.isValidHexColorString(this.getColor())) {
      throw new Meteor.Error(
        "invalid-color",
        "Label color must be a valid hex code",
      );
    }
  }
}
