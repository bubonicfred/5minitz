import { check } from "meteor/check";
import { Meteor } from "meteor/meteor";

import { MeetingSeriesSchema } from "../collections/meetingseries.schema";
import { MinutesSchema } from "../collections/minutes.schema";
import { MeetingSeries } from "../meetingseries";
import { Minutes } from "../minutes";
import { Topic } from "../topic";

/**
 * Sets the "isEdited" properties of a meeting series.
 * @param {string} msId - The ID of the meeting series.
 */
function setIsEditedMeetingSerie(msId) {
  const ms = new MeetingSeries(msId);

  ms.isEditedBy = Meteor.userId();
  ms.isEditedDate = new Date();

  ms.save();
}

/**
 * Removes the "isEdited" flag from a meeting series.
 * If the ignoreLock parameter is true, the flag is removed regardless of the
 * current user's ownership. If the ignoreLock parameter is false or not
 * provided, the flag is only removed if the current user owns the meeting
 * series.
 *
 * @param {string} msId - The ID of the meeting series.
 * @param {boolean} [ignoreLock=false] - Optional. If true, the flag is removed
 *     regardless of ownership. Defaults to false.
 */
function removeIsEditedMeetingSerie(msId, ignoreLock) {
  let unset = false;
  const ms = new MeetingSeries(msId);

  if (ignoreLock === true) {
    unset = true;
  } else if (ms.isEditedBy === Meteor.userId()) {
    unset = true;
  }

  if (unset !== true) {
    return;
  }
  ms.isEditedBy = null;
  ms.isEditedDate = null;
  ms.save();
}

/**
 * Removes the "isEdited" flag from a minute and its associated topics, info
 * items, and details.
 * @param {string} minuteId - The ID of the minute to remove the "isEdited" flag
 *     from.
 * @param {boolean} ignoreLock - If true, the "isEdited" flag will be removed
 *     regardless of the lock status.
 */
function removeIsEditedMinute(minuteId, ignoreLock) {
  const minute = new Minutes(minuteId);
  for (const topic of minute.topics) {
    if (ignoreLock === true) {
      topic.isEditedBy = null;
      topic.isEditedDate = null;
    } else if (topic.isEditedBy === Meteor.userId()) {
      topic.isEditedBy = null;
      topic.isEditedDate = null;
    }
    for (const infoItem of topic.infoItems) {
      if (ignoreLock === true) {
        infoItem.isEditedBy = null;
        infoItem.isEditedDate = null;
      } else if (infoItem.isEditedBy === Meteor.userId()) {
        infoItem.isEditedBy = null;
        infoItem.isEditedDate = null;
      }
      for (const detail of infoItem.details) {
        if (ignoreLock === true) {
          detail.isEditedBy = null;
          detail.isEditedDate = null;
        } else if (detail.isEditedBy === Meteor.userId()) {
          detail.isEditedBy = null;
          detail.isEditedDate = null;
        }
      }
    }
  }
  minute.save();
}

/**
 * Sets the edited status for a topic.
 *
 * @param {string} minutesId - The ID of the minutes containing the topic.
 * @param {string} topicId - The ID of the topic to set as edited.
 */
function setIsEditedTopic(minutesId, topicId) {
  const topic = new Topic(minutesId, topicId);

  topic._topicDoc.isEditedBy = Meteor.userId();
  topic._topicDoc.isEditedDate = new Date();

  topic.save();
}

/**
 * Removes the "isEdited" flag from a topic.
 *
 * @param {string} minutesId - The ID of the minutes containing the topic.
 * @param {string} topicId - The ID of the topic to remove the flag from.
 * @param {boolean} ignoreLock - Whether to ignore the lock and remove the flag
 *     regardless of ownership.
 */
function removeIsEditedTopic(minutesId, topicId, ignoreLock) {
  let unset = false;
  const topic = new Topic(minutesId, topicId);

  if (ignoreLock === true) {
    unset = true;
  } else if (topic._topicDoc.isEditedBy === Meteor.userId()) {
    unset = true;
  }

  if (unset !== true) {
    return;
  }
  topic._topicDoc.isEditedBy = null;
  topic._topicDoc.isEditedDate = null;
  topic.save();
}

/**
 * Sets the "isEdited" information for an info item.
 *
 * @param {string} minutesId - The ID of the minutes.
 * @param {string} topicId - The ID of the topic.
 * @param {string} infoItemId - The ID of the info item.
 */
function setIsEditedInfoItem(minutesId, topicId, infoItemId) {
  const topic = new Topic(minutesId, topicId);
  const infoItem = topic.findInfoItem(infoItemId);

  infoItem._infoItemDoc.isEditedBy = Meteor.userId();
  infoItem._infoItemDoc.isEditedDate = new Date();

  infoItem.save();
}

/**
 * Removes the "isEdited" information from an info item.
 * @param {string} minutesId - The ID of the minutes.
 * @param {string} topicId - The ID of the topic.
 * @param {string} infoItemId - The ID of the info item.
 * @param {boolean} ignoreLock - Whether to ignore the lock and force removal.
 */
function removeIsEditedInfoItem(minutesId, topicId, infoItemId, ignoreLock) {
  let unset = false;
  const topic = new Topic(minutesId, topicId);
  const infoItem = topic.findInfoItem(infoItemId);

  if (typeof infoItem === "undefined") {
    return;
  }

  if (ignoreLock === true) {
    unset = true;
  } else if (infoItem._infoItemDoc.isEditedBy === Meteor.userId()) {
    unset = true;
  }

  if (unset !== true) {
    return;
  }
  infoItem._infoItemDoc.isEditedBy = null;
  infoItem._infoItemDoc.isEditedDate = null;
  infoItem.save();
}

/**
 * Sets the "isEditedBy" and "isEditedDate" properties of a detail in an info
 * item.
 * @param {string} minutesId - The ID of the minutes.
 * @param {string} topicId - The ID of the topic.
 * @param {string} infoItemId - The ID of the info item.
 * @param {number} detailIdx - The index of the detail in the info item.
 */
function setIsEditedDetail(minutesId, topicId, infoItemId, detailIdx) {
  const topic = new Topic(minutesId, topicId);
  const infoItem = topic.findInfoItem(infoItemId);

  infoItem._infoItemDoc.details[detailIdx].isEditedBy = Meteor.userId();
  infoItem._infoItemDoc.details[detailIdx].isEditedDate = new Date();

  infoItem.save();
}

/**
 * Removes the "isEdited" details for a specific info item.
 *
 * @param {string} minutesId - The ID of the minutes.
 * @param {string} topicId - The ID of the topic.
 * @param {string} infoItemId - The ID of the info item.
 * @param {number} detailIdx - The index of the detail to remove.
 * @param {boolean} ignoreLock - Whether to ignore the lock and remove the
 *     detail.
 */
function removeIsEditedDetail(
  minutesId,
  topicId,
  infoItemId,
  detailIdx,
  ignoreLock,
) {
  let unset = false;
  const topic = new Topic(minutesId, topicId);
  const infoItem = topic.findInfoItem(infoItemId);

  if (typeof infoItem === "undefined") {
    return;
  }

  if (ignoreLock === true) {
    unset = true;
  } else if (
    infoItem._infoItemDoc.details[detailIdx].isEditedBy === Meteor.userId()
  ) {
    unset = true;
  }

  if (unset !== true) {
    return;
  }
  infoItem._infoItemDoc.details[detailIdx].isEditedBy = null;
  infoItem._infoItemDoc.details[detailIdx].isEditedDate = null;
  infoItem.save();
}

Meteor.methods({
  "workflow.setIsEditedMeetingSerie"(msId) {
    check(msId, String);
    setIsEditedMeetingSerie(msId);
  },

  "workflow.removeIsEditedMeetingSerie"(msId, ignoreLock) {
    check(msId, String);
    check(ignoreLock, Boolean);
    removeIsEditedMeetingSerie(msId, ignoreLock);
  },

  "workflow.removeIsEditedMinute"(minuteId, ignoreLock) {
    check(minuteId, String);
    check(ignoreLock, Boolean);
    removeIsEditedMinute(minuteId, ignoreLock);
  },

  "workflow.setIsEditedTopic"(minutesId, topicId) {
    check(minutesId, String);
    check(topicId, String);
    setIsEditedTopic(minutesId, topicId);
  },

  "workflow.removeIsEditedTopic"(minutesId, topicId, ignoreLock) {
    check(minutesId, String);
    check(topicId, String);
    check(ignoreLock, Boolean);
    removeIsEditedTopic(minutesId, topicId, ignoreLock);
  },

  "workflow.setIsEditedInfoItem"(minutesId, topicId, infoItemId) {
    check(minutesId, String);
    check(topicId, String);
    check(infoItemId, String);
    setIsEditedInfoItem(minutesId, topicId, infoItemId);
  },

  "workflow.removeIsEditedInfoItem"(
    minutesId,
    topicId,
    infoItemId,
    ignoreLock,
  ) {
    check(minutesId, String);
    check(topicId, String);
    check(infoItemId, String);
    check(ignoreLock, Boolean);
    removeIsEditedInfoItem(minutesId, topicId, infoItemId, ignoreLock);
  },

  "workflow.setIsEditedDetail"(minutesId, topicId, infoItemId, detailIdx) {
    check(minutesId, String);
    check(topicId, String);
    check(infoItemId, String);
    check(detailIdx, Number);
    setIsEditedDetail(minutesId, topicId, infoItemId, detailIdx);
  },

  "workflow.removeIsEditedDetail"(
    minutesId,
    topicId,
    infoItemId,
    detailIdx,
    ignoreLock,
  ) {
    check(minutesId, String);
    check(topicId, String);
    check(infoItemId, String);
    check(detailIdx, Number);
    check(ignoreLock, Boolean);
    removeIsEditedDetail(minutesId, topicId, infoItemId, detailIdx, ignoreLock);
  },
});

/**
 * Service class for managing the "isEdited" flag for various entities.
 */
export class IsEditedService {
  /**
   * Removes the "isEdited" flag for all meeting series and minutes on logout.
   */
  static removeIsEditedOnLogout() {
    const allMs = MeetingSeriesSchema.getCollection().find();
    allMs.forEach((meetingSerie) => {
      Meteor.callAsync(
        "workflow.removeIsEditedMeetingSerie",
        meetingSerie._id,
        false,
      );
    });

    const allMinutes = MinutesSchema.getCollection().find();
    allMinutes.forEach((minute) => {
      Meteor.callAsync("workflow.removeIsEditedMinute", minute._id, false);
    });
  }

  /**
   * Sets the "isEdited" flag for a specific meeting series.
   *
   * @param {string} msId - The ID of the meeting series.
   */
  static setIsEditedMeetingSerie(msId) {
    Meteor.callAsync("workflow.setIsEditedMeetingSerie", msId);
  }

  /**
   * Removes the "isEdited" flag for a specific meeting series.
   *
   * @param {string} msId - The ID of the meeting series.
   * @param {boolean} ignoreLock - Whether to ignore the lock status.
   */
  static removeIsEditedMeetingSerie(msId, ignoreLock) {
    Meteor.callAsync("workflow.removeIsEditedMeetingSerie", msId, ignoreLock);
  }

  /**
   * Sets the "isEdited" flag for a specific topic within a set of minutes.
   *
   * @param {string} minutesId - The ID of the minutes.
   * @param {string} topicId - The ID of the topic.
   */
  static setIsEditedTopic(minutesId, topicId) {
    Meteor.callAsync("workflow.setIsEditedTopic", minutesId, topicId);
  }

  /**
   * Removes the "isEdited" flag for a specific topic within a set of minutes.
   *
   * @param {string} minutesId - The ID of the minutes.
   * @param {string} topicId - The ID of the topic.
   * @param {boolean} ignoreLock - Whether to ignore the lock status.
   */
  static removeIsEditedTopic(minutesId, topicId, ignoreLock) {
    Meteor.callAsync(
      "workflow.removeIsEditedTopic",
      minutesId,
      topicId,
      ignoreLock,
    );
  }

  /**
   * Sets the "isEdited" flag for a specific info item within a topic.
   *
   * @param {string} minutesId - The ID of the minutes.
   * @param {string} topicId - The ID of the topic.
   * @param {string} infoItemId - The ID of the info item.
   */
  static setIsEditedInfoItem(minutesId, topicId, infoItemId) {
    Meteor.callAsync(
      "workflow.setIsEditedInfoItem",
      minutesId,
      topicId,
      infoItemId,
    );
  }

  /**
   * Removes the "isEdited" flag for a specific info item within a topic.
   *
   * @param {string} minutesId - The ID of the minutes.
   * @param {string} topicId - The ID of the topic.
   * @param {string} infoItemId - The ID of the info item.
   * @param {boolean} ignoreLock - Whether to ignore the lock status.
   */
  static removeIsEditedInfoItem(minutesId, topicId, infoItemId, ignoreLock) {
    Meteor.callAsync(
      "workflow.removeIsEditedInfoItem",
      minutesId,
      topicId,
      infoItemId,
      ignoreLock,
    );
  }

  /**
   * Sets the "isEdited" flag for a specific detail within an info item.
   *
   * @param {string} minutesId - The ID of the minutes.
   * @param {string} topicId - The ID of the topic.
   * @param {string} infoItemId - The ID of the info item.
   * @param {number} detailIdx - The index of the detail.
   */
  static setIsEditedDetail(minutesId, topicId, infoItemId, detailIdx) {
    Meteor.callAsync(
      "workflow.setIsEditedDetail",
      minutesId,
      topicId,
      infoItemId,
      detailIdx,
    );
  }

  /**
   * Removes the "isEdited" flag for a specific detail within an info item.
   *
   * @param {string} minutesId - The ID of the minutes.
   * @param {string} topicId - The ID of the topic.
   * @param {string} infoItemId - The ID of the info item.
   * @param {number} detailIdx - The index of the detail to remove.
   * @param {boolean} ignoreLock - Whether to ignore the lock status.
   */
  static removeIsEditedDetail(
    minutesId,
    topicId,
    infoItemId,
    detailIdx,
    ignoreLock,
  ) {
    Meteor.callAsync(
      "workflow.removeIsEditedDetail",
      minutesId,
      topicId,
      infoItemId,
      detailIdx,
      ignoreLock,
    );
  }
}
