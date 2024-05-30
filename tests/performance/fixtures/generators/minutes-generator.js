import moment from "moment/moment";

import { DateHelper } from "../lib/date-helper";
import { Random } from "../lib/random";

/**
 * Represents a MinutesGenerator object.
 * @constructor
 * @param {Object} config - The configuration object.
 * @param {string} parentSeriesId - The ID of the parent series.
 * @param {string} user - The user associated with the generator.
 * @param {Date} [nextMinutesDate=null] - The next minutes date. Defaults to the
 *     current date if not provided.
 */
export class MinutesGenerator {
  /**
   * Represents a MinutesGenerator object.
   * @constructor
   * @param {Object} config - The configuration object.
   * @param {string} parentSeriesId - The ID of the parent series.
   * @param {string} user - The user associated with the generator.
   * @param {Date} [nextMinutesDate=null] - The next minutes date. Defaults to
   *     the current date if not provided.
   */
  constructor(config, parentSeriesId, user, nextMinutesDate = null) {
    if (nextMinutesDate === null) {
      nextMinutesDate = new Date();
    }
    this.config = config;
    this.parentSeriesId = parentSeriesId;
    this.user = user;
    this.nextMinutesDate = nextMinutesDate;
  }

  /**
   * Generates an array of minutes using the provided topics generator.
   * @param {TopicsGenerator} topicsGenerator - The topics generator to use.
   * @returns {Array} - An array of generated minutes.
   */
  generate(topicsGenerator) {
    const result = [];
    let lastMin = false;
    for (let i = 0; i < this.config.minutesCount; i++) {
      const isLastOne = i + 1 === this.config.minutesCount;
      lastMin = this.generateOne(topicsGenerator, isLastOne);
      result.push(lastMin);
      this._tickOneDay();
    }

    return result;
  }

  /**
   * Generates a new minute object.
   *
   * @param {Object} topicsGenerator - The topics generator object.
   * @param {boolean} [isLastOne=false] - Indicates if this is the last minute
   *     object.
   * @returns {Object} - The generated minute object.
   */
  generateOne(topicsGenerator, isLastOne = false) {
    const id = Random.generateId();
    const min = {
      _id: id,
      meetingSeries_id: this.parentSeriesId,
      date: this.constructor._formatDate(this.nextMinutesDate),
      topics: topicsGenerator.generateNextListForMinutes(
        id,
        this.nextMinutesDate,
        isLastOne,
      ),
      visibleFor: [this.user._id],
      participants: [
        { userId: this.user._id, present: false, minuteKeeper: false },
      ],
      createdAt: new Date(),
      createdBy: this.user.username,
      isFinalized: !isLastOne,
      globalNote: "",
      participantsAdditional: "",
      finalizedVersion: isLastOne ? 0 : 1,
      finalizedHistory: [],
      agenda: "",
    };

    if (!isLastOne) {
      min.finalizedAt = this.nextMinutesDate;
      min.finalizedBy = this.user.username;
      const dateTime = this.constructor._formatDateTime(this.nextMinutesDate);

      // #I18N: We will leave this is English, as it is published to the
      // database!
      min.finalizedHistory.push(
        `Version 1. Finalized on ${dateTime} by ${this.user.username}`,
      );
    }
    return min;
  }

  /**
   * Increments the `nextMinutesDate` property by one day.
   */
  _tickOneDay() {
    this.nextMinutesDate = moment(this.nextMinutesDate).add(1, "days").toDate();
  }

  /**
   * @borrows DateHelper.formatDateISO8601 as _formatDate
   */
  static _formatDate(date) {
    return DateHelper.formatDateISO8601(date);
  }

  /**
   * @borrows DateHelper.formatDateISO8601Time as _formatDateTime
   * @param {Date} date
   */
  static _formatDateTime(date) {
    return DateHelper.formatDateISO8601Time(date);
  }
}
