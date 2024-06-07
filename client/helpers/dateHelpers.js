import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";

import { formatDateISO8601Time } from "../../imports/helpers/date";

/**
 * Registers a helper function to format a date in ISO8601 time format.
 * @borrows formatDateISO8601Time from imports/helpers/date.js
 */
Template.registerHelper("formatDateISO8601Time", (/** @type {Date} */ date) => {
  return formatDateISO8601Time(date);
});

/**
 * Registers a helper function to format the updated hint tooltip.
 * @param {Date} dateCreate - The creation date of the topic.
 * @param {string} userCreate - The user who created the topic.
 * @param {Date} dateUpd - The update date of the topic.
 * @param {string} userUpd - The user who updated the topic.
 * @returns {string} The formatted tooltip string.
 */
Template.registerHelper(
  "formateUpdatedHint",
  (
    /** @type {Date} */ dateCreate,
    /** @type {any} */ userCreate,
    /** @type {Date} */ dateUpd,
    /** @type {any} */ userUpd,
  ) => {
    const dateCreateStr = formatDateISO8601Time(dateCreate);
    const dateUpdStr = formatDateISO8601Time(dateUpd);

    const tooltip = `${i18n.__("Topic.TooltipCreated.date", {
      dateCreateStr,
    })} ${
      userCreate ? i18n.__("Topic.TooltipCreated.user", { userCreate }) : ""
    }`;
    if (dateUpd && dateUpdStr > dateCreateStr) {
      return `${tooltip}\n${i18n.__("Topic.TooltipUpdated.date", {
        dateUpdStr,
      })} ${userUpd ? i18n.__("Topic.TooltipUpdated.user", { userUpd }) : ""}`;
    }
    return tooltip;
  },
);
