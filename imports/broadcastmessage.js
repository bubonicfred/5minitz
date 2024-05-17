import { Meteor } from "meteor/meteor";

import { BroadcastMessageSchema } from "./collections/broadcastmessages.schema";
import { formatDateISO8601Time } from "./helpers/date";

// Dear admin,
// This class can be used via the 'meteor shell' command from the server
// backend. Once launched, you can handle broadcast messages like so:
//
// import { BroadcastMessage  } from '/imports/broadcastmessage'
// BroadcastMessage.show("Warning: 4Minitz will be down for maintenance in *4
// Minute*. Just submit open dialogs. Then nothing is lost. You may finalize
// meetings later.") BroadcastMessage.listAll()
// BroadcastMessage.remove('abcdefghijkl')
// BroadcastMessage.removeAll()

/**
 * Provides static methods for managing broadcast messages in the application.
 *
 * The `BroadcastMessage` class provides a set of static methods for interacting
 * with broadcast messages. These methods allow you to find, show, dismiss,
 * remove, and list all broadcast messages.
 *
 * The `show`, `removeAll`, and `remove` methods are server-only and can only be
 * called from the server-side code.
 */
export class BroadcastMessage {
  static find(...args) {
    return BroadcastMessageSchema.find(...args);
  }

  static findOne(...args) {
    return BroadcastMessageSchema.findOne(...args);
  }

  static dismissForMe() {
    Meteor.call("broadcastmessage.dismiss");
  }

  // ************************
  // * static server-only methods
  // ************************
  static show(message, active = true) {
    if (Meteor.isServer) {
      Meteor.call("broadcastmessage.show", message, active);
    }
  }

  static removeAll() {
    if (Meteor.isServer) {
      console.log("Remove All BroadcastMessages.");
      BroadcastMessageSchema.remove({});
    }
  }

  static remove(id) {
    if (!id || id === "") {
      return;
    }
    if (Meteor.isServer) {
      console.log(`Remove BroadcastMessage: ${id}`);
      BroadcastMessageSchema.remove({ _id: id });
    }
  }

  static listAll() {
    if (!Meteor.isServer) {
      return;
    }
    console.log("List All BroadcastMessages.");
    const allMsgs = [];
    BroadcastMessageSchema.find({ isActive: true }).forEach((msg) => {
      const oneMsg = `Message: ${msg._id} ${formatDateISO8601Time(
        msg.createdAt,
      )} dismissed:${msg.dismissForUserIDs.length}\n${msg.text}`;
      console.log(oneMsg);
      allMsgs.push(oneMsg);
    });
    console.log("---");
    return allMsgs;
  }
}
