import { Class as SchemaClass } from "meteor/jagi:astronomy";
import { Meteor } from "meteor/meteor";
import { Mongo } from "meteor/mongo";
import { i18n } from "meteor/universe:i18n";

import { Attachment } from "./attachment";
import { MeetingSeriesSchema } from "./collections/meetingseries.schema";
import { MinutesSchema } from "./collections/minutes.schema";

const StatisticsCollection = new Mongo.Collection("statistics");

if (Meteor.isServer) {
  Meteor.publish("statistics", () => StatisticsCollection.find());
}
if (Meteor.isClient) {
  Meteor.subscribe("statistics");
}

/**
 * Represents a row in the statistics table.
 *
 * @class StatisticsRow
 */
const StatisticsRow = SchemaClass.create({
  name: "StatisticsRow",
  fields: {
    description: { type: String },
    value: { type: String },
  },
});

export const Statistics = SchemaClass.create({
  name: "Statistics",
  collection: StatisticsCollection,
  fields: {
    result: { type: [StatisticsRow] },
  },
  meteorMethods: {
    async update() {
      const numberOfMeetingSeries = await MeetingSeriesSchema.find().countAsync();
      const numberOfMinutes = await MinutesSchema.find().countAsync();
      const numberOfUsers = await Meteor.users.find().countAsync();
      const numberOfActiveUsers = await Meteor.users
        .find({
          $or: [{ isInactive: { $exists: false } }, { isInactive: false }],
        })
        .countAsync();
      const numberOfAttachments = Attachment.countAll();
      const numberOfAttachmentMB = `${Math.floor(
        Attachment.countAllBytes() / 1024 / 1024,
      )} MB`;

      await StatisticsCollection.removeAsync({});

      this.result = [
        {
          description: i18n.__("About.ServerStatistics.rowNumUser"),
          value: `${numberOfUsers} (${numberOfActiveUsers})`,
        },
        {
          description: i18n.__("About.ServerStatistics.rowNumMeetingSeries"),
          value: numberOfMeetingSeries.toString(),
        },
        {
          description: i18n.__("About.ServerStatistics.rowNumMeetingMinutes"),
          value: numberOfMinutes.toString(),
        },
        {
          description: i18n.__("About.ServerStatistics.rowNumAttachments"),
          value: numberOfAttachments.toString(),
        },
        {
          description: i18n.__("About.ServerStatistics.rowSizeAttachments"),
          value: numberOfAttachmentMB.toString(),
        },
      ];

      this.save();
    },
  },
});

/**
 * Calculates and logs various statistics related to meeting series, minutes,
 * topics, items, and details.
 *
 * @param {number} [minMinutesCount=2] - The minimum number of minutes required
 *     for a meeting series to be considered.
 * @param {number} [minTopicsCount=5] - The minimum number of topics required
 *     for a meeting series to be considered.
 */
const statisticsDetails = async (minMinutesCount = 2, minTopicsCount = 5) => {
  // eslint-disable-line
  const MS = MeetingSeriesSchema.find();
  let MScount = 0;
  let MinutesCount = 0;
  let TopicCount = 0;
  let TopicMax = 0;
  let ItemCount = 0;
  let ItemMax = 0;
  let DetailCount = 0;
  let DetailMax = 0;

  await MS.forEachAsync((ms) => {
    if (
      !(
        ms.minutes &&
        ms.minutes.length >= minMinutesCount &&
        ms.topics &&
        ms.topics.length >= minTopicsCount
      )
    ) {
      return;
    }
    MScount++;
    TopicCount += ms.topics.length;
    if (ms.topics.length > TopicMax) {
      TopicMax = ms.topics.length;
    }
    MinutesCount += ms.minutes.length;

    ms.topics.forEach((top) => {
      ItemCount += top.infoItems.length;
      if (top.infoItems.length > ItemMax) {
        ItemMax = top.infoItems.length;
      }
      top.infoItems.forEach((item) => {
        if (item.details) {
          DetailCount += item.details.length;
          if (item.details.length > DetailMax) {
            DetailMax = item.details.length;
          }
        }
      });
    });
  });
  console.log("# MeetingSeries: ", MScount);
  console.log("# Minutes      : ", MinutesCount);
  console.log(
    "# Topics       : ",
    TopicCount,
    "  max: ",
    TopicMax,
    "  mean: ",
    (TopicCount / MScount).toFixed(1),
  );
  console.log(
    "# Items        : ",
    ItemCount,
    "  max: ",
    ItemMax,
    "  mean: ",
    (ItemCount / TopicCount).toFixed(1),
  );
  console.log(
    "# Details      : ",
    DetailCount,
    "  max: ",
    DetailMax,
    "  mean: ",
    (DetailCount / ItemCount).toFixed(1),
  );
};

if (Meteor.isServer) {
  // statisticsDetails()
}
