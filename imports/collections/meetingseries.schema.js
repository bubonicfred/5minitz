/**
 * @fileoverview Defines the MeetingSeriesSchema and MeetingSeriesCollection.
 * This file contains the schema definition for the MeetingSeries collection
 * and the corresponding MongoDB collection.
 */

import "./idValidator";

import { Class as SchemaClass } from "meteor/jagi:astronomy";
import { Mongo } from "meteor/mongo";

import { MeetingSeries } from "../meetingseries";

import { LabelSchema } from "./label.schema";

/**
 * Represents the MongoDB collection for MeetingSeries.
 * @type {Mongo.Collection}
 */
const MeetingSeriesCollection = new Mongo.Collection("meetingSeries", {
  /**
   * Transforms the MongoDB document into a MeetingSeries instance.
   * @param {Object} doc - The MongoDB document.
   * @returns {MeetingSeries} The transformed MeetingSeries instance.
   */
  transform(doc) {
    return new MeetingSeries(doc);
  },
});

/**
 * Represents the schema for the MeetingSeries collection.
 * @type {SchemaClass}
 * @typedef {Object} MeetingSeriesSchema
 * @property {string} project - The project associated with the meeting series.
 * @property {string} name - The name of the meeting series.
 * @property {Date} createdAt - The date when the meeting series was created.
 * @property {string[]} visibleFor - An array of user IDs or email addresses
 * that the meeting series is visible for.
 * @property {string[]} informedUsers - An array of user IDs or email addresses
 * of users who are informed about the meeting series. (Optional)
 * @property {Date} lastMinutesDate - The date of the last meeting minutes.
 * @property {boolean} lastMinutesFinalized - Indicates whether the last meeting
 * minutes are finalized or not.
 * @property {string} lastMinutesId - The ID of the last meeting minutes.
 * (Optional)
 * @property {string[]} minutes - An array of meeting minutes associated with
 * the meeting series.
 * @property {LabelSchema[]} availableLabels - An array of available labels for
 * the meeting series.
 * @property {string[]} additionalResponsibles - An array of additional users
 * responsible for the meeting series.
 * @property {string} isEditedBy - The user who last edited the meeting series.
 * (Optional)
 * @property {Date} isEditedDate - The date when the meeting series was last
 * edited. (Optional)
 */
export const MeetingSeriesSchema = SchemaClass.create({
  name: "MeetingSeriesSchema",
  collection: MeetingSeriesCollection,
  fields: {
    project: { type: String },
    name: { type: String },
    createdAt: { type: Date },
    visibleFor: { type: [String], validators: [{ type: "meteorId" }] },
    // element may be userID or EMail address
    informedUsers: { type: [String], optional: true },
    lastMinutesDate: { type: Date },
    lastMinutesFinalized: { type: Boolean, default: false },
    lastMinutesId: {
      type: String,
      optional: true,
      validators: [
        { type: "or", param: [{ type: "null" }, { type: "meteorId" }] },
      ],
    },
    minutes: { type: [String], default: [] },
    availableLabels: { type: [LabelSchema], default: [] },
    additionalResponsibles: { type: [String], default: [] },
    isEditedBy: { type: String, optional: true },
    isEditedDate: { type: Date, optional: true },
  },
});
