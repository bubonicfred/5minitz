/**
 * @fileoverview Defines the DetailsSchema and InfoItemSchema for the 4minitz
 * application. These schemas are used to define the structure and validation
 * rules for the information items.
 */

import "./idValidator";

import { Class as SchemaClass } from "meteor/jagi:astronomy";

/**
 * Represents the DetailsSchema for an information item.
 * @class
 */
export const DetailsSchema = SchemaClass.create({
  name: "DetailsSchema",
  fields: {
    _id: { type: String, validators: [{ type: "meteorId" }] },
    createdAt: { type: Date },
    createdBy: { type: String, optional: true },
    updatedAt: { type: Date },
    updatedBy: { type: String, optional: true },
    createdInMinute: { type: String, validators: [{ type: "meteorId" }] },
    isNew: { type: Boolean, optional: true },
    date: String,
    text: { type: String, default: "", optional: true },
    isEditedBy: { type: String, optional: true },
    isEditedDate: { type: Date, optional: true },
  },
});

/**
 * Represents the InfoItemSchema for an information item.
 * @class
 */
export const InfoItemSchema = SchemaClass.create({
  name: "InfoItemSchema",
  fields: {
    _id: { type: String, validators: [{ type: "meteorId" }] },
    createdAt: { type: Date },
    createdBy: { type: String, optional: true },
    updatedAt: { type: Date },
    updatedBy: { type: String, optional: true },
    itemType: {
      type: String,
      regEx: /^(actionItem)|(infoItem)$/,
      defaultValue: "infoItem",
    },
    isSticky: { type: Boolean, default: false },
    createdInMinute: { type: String, validators: [{ type: "meteorId" }] },
    labels: { type: [String], validators: [{ type: "meteorId" }] },
    subject: { type: String },
    isOpen: { type: Boolean, optional: true }, // action item
    isNew: { type: Boolean, optional: true }, // action item
    responsibles: { type: [String], default: [], optional: true }, // action item
    priority: {
      type: Number,
      optional: true,
      validators: [
        // action item
        { type: "gte", param: 1 },
        { type: "lte", param: 5 },
      ],
    },
    duedate: { type: String, optional: true }, // action item
    details: { type: [DetailsSchema], default: [], optional: true },
    isEditedBy: { type: String, optional: true },
    isEditedDate: { type: Date, optional: true },
  },
});
