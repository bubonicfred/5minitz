import { TopicSchema } from "/imports/collections/topic.schema";

/**
 * Class representing a TopicsFinder.
 */
export class TopicsFinder {
  static allTopicsOfMeetingSeries(meetingSeriesId) {
    return TopicSchema.getCollection()
      .find({ parentId: meetingSeriesId }, { sort: { updatedAt: -1 } })
      .fetch();
  }

  static allOpenTopicsOfMeetingSeries(meetingSeriesId) {
    return TopicSchema.getCollection()
      .find(
        { parentId: meetingSeriesId, isOpen: true },
        { sort: { sortOrder: 1 } },
      )
      .fetch(); // restore the sort order of the previous meeting minutes
  }

  /**
   * Retrieves all topics of a meeting series that have at least one info item
   * created in a specific minute.
   *
   * @param {string} meetingSeriesId - The ID of the meeting series.
   * @param {string} minutesId - The ID of the minute.
   * @returns {Array} - An array of topics that match the criteria.
   */
  static allTopicsOfMeetingSeriesWithAtLeastOneItemCreatedInMinutes(
    meetingSeriesId,
    minutesId,
  ) {
    return TopicSchema.getCollection()
      .find({
        parentId: meetingSeriesId,
        "infoItems.createdInMinute": minutesId,
      })
      .fetch();
  }

  /**
   * Retrieves a topic by its ID within a specific meeting series.
   *
   * @param {string} topicId - The ID of the topic to retrieve.
   * @param {string} meetingSeriesId - The ID of the meeting series containing
   *     the topic.
   * @returns {Object|null} The topic object if found, or null if not found.
   */
  static getTopicById(topicId, meetingSeriesId) {
    return TopicSchema.getCollection().findOne({
      parentId: meetingSeriesId,
      _id: topicId,
    });
  }

  static allTopicsIdentifiedById(ids) {
    return TopicSchema.getCollection()
      .find({ _id: { $in: ids } })
      .fetch();
  }
}
