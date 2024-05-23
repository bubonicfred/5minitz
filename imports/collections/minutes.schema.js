/**
 * Importing the "idValidator" module.
 */
import "./idValidator";

import { Class as SchemaClass } from "meteor/jagi:astronomy";
import { Mongo } from "meteor/mongo";

import { Minutes } from "../minutes";

import { TopicSchema } from "./topic.schema";

/**
 * The collection for storing minutes.
 */
const MinutesCollection = new Mongo.Collection("minutes", {
  /**
   * Transform function to convert documents into instances of the "Minutes"
   * class.
   * @param {Object} doc - The document to transform.
   * @returns {Minutes} - The transformed instance of the "Minutes" class.
   */
  transform(doc) {
    return new Minutes(doc);
  },
});

/**
 * Schema for the participants of a meeting.
 */
const ParticipantsSchema = SchemaClass.create({
  name: "ParticipantsSchema",
  fields: {
    /**
     * The ID of the user.
     * @type {String}
     * @validators meteorId
     */
    userId: { type: String, validators: [{ type: "meteorId" }] },
    /**
     * Indicates whether the participant is present or not.
     * @type {Boolean}
     * @default false
     */
    present: { type: Boolean, default: false },
    /**
     * Indicates whether the participant is the minute keeper or not.
     * @type {Boolean}
     * @default false
     */
    minuteKeeper: { type: Boolean, default: false },
  },
});

/**
 * Schema for the minutes of a meeting.
 */
export const MinutesSchema = SchemaClass.create({
  name: "MinutesSchema",
  collection: MinutesCollection,
  fields: {
    /**
     * The ID of the meeting series.
     * @type {String}
     * @validators meteorId
     */
    meetingSeries_id: { type: String, validators: [{ type: "meteorId" }] },
    /**
     * The date of the meeting.
     * @type {String}
     * @todo Make this of type date.
     */
    date: { type: String },
    /**
     * The global note for the minutes.
     * @type {String}
     * @default ""
     * @optional
     */
    globalNote: { type: String, default: "", optional: true },
    /**
     * Indicates whether the global note is pinned or not.
     * @type {Boolean}
     * @default false
     * @optional
     */
    globalNotePinned: { type: Boolean, default: false, optional: true },
    /**
     * The topics discussed in the meeting.
     * @type {Array<TopicSchema>}
     * @default []
     */
    topics: { type: [TopicSchema], default: [] },
    /**
     * The creation date of the minutes.
     * @type {Date}
     */
    createdAt: { type: Date },
    /**
     * The user who created the minutes.
     * @type {String}
     * @optional
     */
    createdBy: { type: String, optional: true },
    /**
     * The date when the agenda was sent.
     * @type {Date}
     * @optional
     */
    agendaSentAt: { type: Date, optional: true },
    /**
     * The users who can see the minutes.
     * @type {Array<String>}
     * @validators meteorId
     */
    visibleFor: { type: [String], validators: [{ type: "meteorId" }] },
    /**
     * The users who have been informed about the minutes.
     * @type {Array<String>}
     * @validators meteorId
     * @default []
     */
    informedUsers: {
      type: [String],
      validators: [{ type: "meteorId" }],
      default: [],
    },
    /**
     * The participants of the meeting.
     * @type {Array<ParticipantsSchema>}
     * @default []
     */
    participants: { type: [ParticipantsSchema], default: [] },
    /**
     * Additional information about the participants.
     * @type {String}
     * @default ""
     * @optional
     */
    participantsAdditional: { type: String, default: "", optional: true },
    /**
     * Indicates whether the minutes are finalized or not.
     * @type {Boolean}
     * @default false
     */
    isFinalized: { type: Boolean, default: false },
    /**
     * The date when the minutes were finalized.
     * @type {Date}
     * @optional
     */
    finalizedAt: { type: Date, optional: true },
    /**
     * The user who finalized the minutes.
     * @type {String}
     * @optional
     */
    finalizedBy: { type: String, optional: true },
    /**
     * The version number of the finalized minutes.
     * @type {Number}
     * @optional
     * @default 0
     */
    finalizedVersion: { type: Number, optional: true, default: 0 },
    /**
     * The history of finalized versions of the minutes.
     * @type {Array<String>}
     * @optional
     * @default []
     */
    finalizedHistory: { type: [String], optional: true, default: [] },
  },
});
