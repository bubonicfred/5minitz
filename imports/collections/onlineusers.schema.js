import "./idValidator";

import { Class as SchemaClass } from "meteor/jagi:astronomy";
import { Mongo } from "meteor/mongo";

/**
 * Represents the collection of online users.
 * @type {Mongo.Collection}
 */
const OnlineUsersCollection = new Mongo.Collection("onlineUsers");

/**
 * Represents the schema for the online users collection.
 * @type {SchemaClass}
 */
export const OnlineUsersSchema = SchemaClass.create({
  name: "OnlineUsersSchema",
  collection: OnlineUsersCollection,
  fields: {
    /**
     * The ID of the user.
     * @type {String}
     * @validators meteorId
     */
    userId: { type: String, validators: [{ type: "meteorId" }] },

    /**
     * The active route of the user.
     * @type {String}
     */
    activeRoute: { type: String },

    /**
     * The date and time when the user was last updated.
     * @type {Date}
     */
    updatedAt: { type: Date },
  },
});
