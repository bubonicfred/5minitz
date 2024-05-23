import { TopicSchema } from "/imports/collections/topic.schema";
import { Meteor } from "meteor/meteor";

import { Minutes } from "../../minutes";
import { TopicsFinder } from "../topicsFinder";

/**
 * Represents a Meeting Series Topics Updater.
 * @class
 */
export class MeetingSeriesTopicsUpdater {
  /**
   * @param meetingSeriesId
   * @param topicsVisibleFor array of user_ids states which user should be able
   *     to see these topics
   */
  constructor(meetingSeriesId, topicsVisibleFor) {
    this.meetingSeriesId = meetingSeriesId;
    this.topicsVisibleFor = topicsVisibleFor;
  }

  /**
   * Invalidates the isNew flag of topics presented in minutes.
   *
   * @param {string} minutesId - The ID of the minutes.
   */
  invalidateIsNewFlagOfTopicsPresentedInMinutes(minutesId) {
    const minutes = new Minutes(minutesId);
    const topicIds = minutes.topics.map((topicDoc) => {
      return topicDoc._id;
    });
    TopicsFinder.allTopicsIdentifiedById(topicIds).forEach((topicDoc) => {
      topicDoc.isNew = false;
      topicDoc.infoItems.forEach((itemDoc) => {
        itemDoc.isNew = false;
        itemDoc.details = itemDoc.details || [];
        itemDoc.details.forEach((detail) => {
          detail.isNew = false;
        });
      });
      this.upsertTopic(topicDoc);
    });
  }

  /**
   * Retrieves a topic by its ID.
   *
   * @param {string} topicId - The ID of the topic to retrieve.
   * @returns {Object} The topic object.
   */
  getTopicById(topicId) {
    return TopicsFinder.getTopicById(topicId, this.meetingSeriesId);
  }

  /**
   * Upserts a topic document for the meeting series.
   * @param {Object} topicDoc - The topic document to upsert.
   */
  upsertTopic(topicDoc) {
    topicDoc.parentId = this.meetingSeriesId;
    const topicId = topicDoc._id;
    topicDoc.visibleFor = this.topicsVisibleFor;
    TopicSchema.upsert(
      { parentId: this.meetingSeriesId, _id: topicId },
      topicDoc,
    );
  }

  /**
   * Removes topics created in a specific minute from the topic collection.
   *
   * @param {string} minutesId - The ID of the minute.
   * @returns {void}
   */
  removeTopicsCreatedInMinutes(minutesId) {
    TopicSchema.remove({
      parentId: this.meetingSeriesId,
      createdInMinute: minutesId,
    });
  }

  /**
   * Removes topic items that were created in a specific set of minutes.
   *
   * @param {string} minutesId - The ID of the minutes from which to remove the
   *     topic items.
   */
  removeTopicItemsCreatedInMinutes(minutesId) {
    TopicsFinder.allTopicsOfMeetingSeriesWithAtLeastOneItemCreatedInMinutes(
      this.meetingSeriesId,
      minutesId,
    ).forEach((topicDoc) => {
      topicDoc.infoItems = topicDoc.infoItems.filter((infoItemDoc) => {
        return infoItemDoc.createdInMinute !== minutesId;
      });
      this.upsertTopic(topicDoc);
    });
  }

  removeAllTopics() {
    TopicSchema.remove({ parentId: this.meetingSeriesId });
  }

  reOpenTopic(topicId) {
    try {
      const affectedDocuments = TopicSchema.update(
        { parentId: this.meetingSeriesId, _id: topicId },
        { $set: { isOpen: true } },
      );
      if (affectedDocuments !== 1) {
        throw new Meteor.Error("runtime-error", "Could not re-open topic.");
      }
    } catch (e) {
      console.log("Error in reOpenTopic ", topicId);
      console.log(JSON.stringify(e));
      throw new Meteor.Error("runtime-error", "Could not re-open topic.");
    }
  }
}
