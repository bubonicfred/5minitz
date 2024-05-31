import { Blaze } from "meteor/blaze";
import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";

import { Minutes } from "../minutes";

import { ParticipantsPreparer } from "./ParticipantsPreparer";

/**
 * Performs a search using Select2 plugin.
 *
 * @param {jQuery} selectResponsibles - The jQuery object representing the
 *     select element.
 * @param {number} delayTime - The delay time in milliseconds before making the
 *     search request.
 * @param {function} freeTextValidator - The function used to validate free text
 *     entries.
 * @param {string} minuteID - The ID of the minute.
 * @param {string} topicOrItem - The topic or item to search for.
 */
function select2search(
  selectResponsibles,
  delayTime,
  freeTextValidator,
  minuteID,
  topicOrItem,
) {
  const minute = new Minutes(minuteID);
  const preparer = new ParticipantsPreparer(
    minute,
    topicOrItem,
    Meteor.users,
    freeTextValidator,
  );
  const participants = preparer.getPossibleResponsibles();
  selectResponsibles.select2({
    placeholder: "Select...",
    tags: true, // Allow freetext adding
    tokenSeparators: [",", ";"],
    ajax: {
      delay: delayTime,
      transport(params, success, failure) {
        Meteor.call(
          "responsiblesSearch",
          params.data.q,
          participants,
          (err, results) => {
            if (err) {
              failure(err);
              return;
            }
            success(results);
          },
        );
      },
      processResults(data) {
        const results_participants = [];
        const results_other = [];
        data.results.forEach((result) => {
          if (result.isParticipant) {
            results_participants.push({
              id: result.id,
              text: result.text,
            });
          } else {
            results_other.push({
              id: result._id,
              text: result.fullname,
            });
          }
        });
        // save the return value (when participants/other user are empty -> do
        // not show a group-name
        const returnValues = [];
        if (results_participants.length > 0) {
          returnValues.push({
            text: "Participants",
            children: results_participants,
          });
        }
        if (results_other.length > 0) {
          returnValues.push({ text: "Other Users", children: results_other });
        }

        return {
          results: returnValues,
        };
      },
    },
  });
}

/**
 * Configures the Select2 responsibles element.
 *
 * @param {string} SelectResponsibleElementID - The ID of the Select2
 *     responsibles element.
 * @param {Object} topicOrItemDoc - The topic or item document.
 * @param {function} freeTextValidator - The free text validator function.
 * @param {string} _minutesID - The ID of the minutes.
 * @param {string} topicOrItem - The topic or item.
 */
export function configureSelect2Responsibles(
  SelectResponsibleElementID,
  topicOrItemDoc,
  freeTextValidator,
  _minutesID,
  topicOrItem,
) {
  const selectResponsibles = document.getElementById(
    SelectResponsibleElementID,
  );
  selectResponsibles
    .querySelectorAll("option") // clear all <option>s
    .forEach((option) => option.remove());
  const delayTime = Meteor.settings.public.isEnd2EndTest ? 0 : 50;

  select2search(
    selectResponsibles,
    delayTime,
    freeTextValidator,
    _minutesID,
    topicOrItem,
  );
  const data = { options: [] };
  if (topicOrItemDoc !== undefined) {
    const responsibles = topicOrItemDoc.responsibles || [];
    responsibles.forEach((responsibleId) => {
      let responsibleUser = Meteor.users.findOne(responsibleId);
      if (responsibleUser) {
        Minutes.formatResponsibles(
          responsibleUser,
          "username",
          responsibleUser.profile,
        );
      } else {
        // free text user
        responsibleUser = { fullname: responsibleId };
      }
      data.options.push({
        optionId: responsibleId,
        optionText: responsibleUser.fullname,
      });
    });
    Blaze.renderWithData(
      Template.optionsElement,
      data,
      document.getElementById(SelectResponsibleElementID),
    );
  }
  selectResponsibles.trigger("change");
}
