import { Meteor } from "meteor/meteor";

import { UserRoles } from "./../userroles";

/**
 * Publishes a Meteor publication that filters a given collection based on
 * meeting series or minute attributes.
 *
 * @param {string} publishName - The name of the publication.
 * @param {Mongo.Collection} collection - The collection to publish.
 * @param {string} meetingSeriesAttribute - The name of the attribute in the
 *     collection that represents the meeting series.
 * @param {string} minuteAttribute - The name of the attribute in the collection
 *     that represents the minute.
 */
export class extendedPublishSubscribeHandler {
  static publishByMeetingSeriesOrMinute = (
    publishName,
    collection,
    meetingSeriesAttribute,
    minuteAttribute,
  ) => {
    if (Meteor.isServer) {
      Meteor.publish(publishName, function (meetingSeriesId, minuteId) {
        if (meetingSeriesId) {
          const userRole = new UserRoles(this.userId);
          if (userRole.hasViewRoleFor(meetingSeriesId)) {
            const query = minuteId
              ? { [minuteAttribute]: minuteId }
              : { [meetingSeriesAttribute]: meetingSeriesId };
            return collection.find(query).cursor;
          }
        }
        return this.ready();
      });
    }
  };
}
