/**
 * @fileoverview Defines the LabelSchema for the 4minitz application.
 * This schema represents the structure and validation rules for the Label
 * collection.
 * @module LabelSchema
 */

import "./idValidator";

import { Class as SchemaClass } from "meteor/jagi:astronomy";

/**
 * Represents the LabelSchema class.
 * @class
 */
export const LabelSchema = SchemaClass.create({
  /**
   * The name of the schema.
   * @member {string}
   */
  name: "LabelSchema",
  /**
   * The fields of the schema.
   * @member {object}
   */
  fields: {
    /**
     * The unique identifier of the label.
     * @member {string}
     */
    _id: { type: String, validators: [{ type: "meteorId" }] },
    /**
     * Indicates if the label is the default label.
     * @member {boolean}
     * @default false
     */
    isDefaultLabel: { type: Boolean, default: false },
    /**
     * Indicates if the label is disabled.
     * @member {boolean}
     * @default false
     */
    isDisabled: { type: Boolean, default: false },
    /**
     * The name of the label.
     * @member {string}
     */
    name: { type: String },
    /**
     * The color of the label.
     * @member {string}
     * @default "#e6e6e6"
     */
    color: { type: String, default: "#e6e6e6" },
  },
});
