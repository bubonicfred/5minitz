/**
 * Represents a ParticipantsPreparer object.
 * @constructor
 * @param {Object} minutes - The minutes object.
 * @param {Object} currentTopicOrItem - The current topic or item object.
 * @param {Object} usersCollection - The users collection object.
 * @param {Function} [freeTextValidator] - The optional free text validator
 *     function.
 */
export class ParticipantsPreparer {
  /**
   * @typedef {{id: string, text: string}} ResponsibleObject
   */

  /**
   * Represents a ParticipantsPreparer object.
   * @constructor
   * @param {Object} minutes - The minutes object.
   * @param {Object} currentTopicOrItem - The current topic or item object.
   * @param {Object} usersCollection - The users collection object.
   * @param {Function} [freeTextValidator] - The optional free text validator
   *     function.
   */
  constructor(
    minutes,
    currentTopicOrItem,
    usersCollection,
    freeTextValidator = undefined,
  ) {
    this.minutes = minutes;
    this.parentSeries = minutes.parentMeetingSeries();
    this.currentElement = currentTopicOrItem;
    this.usersCollection = usersCollection;
    this.freeTextValidator = freeTextValidator;
    this._init();
    this._prepareResponsibles();
  }

  /**
   * Initializes the ParticipantsPreparer object.
   * Sets up the initial state of the object by initializing the properties.
   */
  _init() {
    this.possibleResponsibles = []; // sorted later on
    this.possibleResponsiblesUnique = {}; // ensure uniqueness
    this.buffer = []; // userIds and names from different sources, may have doubles
  }

  /**
   * Get the possible responsible participants.
   *
   * @returns {Array}
   */
  getPossibleResponsibles() {
    return this.possibleResponsibles;
  }

  /**
   * Retrieves the remaining users.
   *
   * @return {ResponsibleObject[]} The remaining users.
   */
  getRemainingUsers() {
    return this.remainingUsers;
  }

  /**
   * Prepares the responsibles for the participants.
   * Calls the _preparePossibleResponsibles method.
   * @see @_preparePossibleResponsibles
   */
  _prepareResponsibles() {
    this._preparePossibleResponsibles();
  }

  /**
   * Prepares the possible responsibles by adding regular participants from the
   * current minutes, additional participants from minutes as freetext, former
   * responsibles from the parent series, responsibles from the current element,
   * and then prunes duplicates and prepares the result.
   */
  _preparePossibleResponsibles() {
    this._addRegularParticipantsFromCurrentMinutes();
    this._addAdditionalParticipantsFromMinutesAsFreetext();
    this._addFormerResponsiblesFromParentSeries();
    this._addResponsiblesFromCurrentElement();
    this._pruneDuplicatesAndPrepareResult();
  }

  /**
   * Adds regular participants from the current minutes to the buffer.
   * @private
   */
  _addRegularParticipantsFromCurrentMinutes() {
    this.minutes.participants.forEach((participant) => {
      this.buffer.push(participant.userId);
    });
  }

  /**
   * Adds additional participants from the minutes as freetext.
   *
   * @private
   */
  _addAdditionalParticipantsFromMinutesAsFreetext() {
    const participantsAdditional = this.minutes.participantsAdditional;
    if (participantsAdditional) {
      participantsAdditional.split(/[,;]/).forEach((freeText) => {
        this._addFreeTextElementToBuffer(freeText.trim());
      });
    }
  }

  /**
   * Adds former responsibles from the parent series to the buffer.
   * If a freeTextValidator is available, adds each responsible as a free text
   * element to the buffer. Otherwise, concatenates the additional responsibles
   * to the buffer.
   */
  _addFormerResponsiblesFromParentSeries() {
    if (!this.parentSeries.additionalResponsibles) {
      return;
    }
    if (this.freeTextValidator) {
      this.parentSeries.additionalResponsibles.forEach((resp) => {
        this._addFreeTextElementToBuffer(resp);
      });
    } else {
      this.buffer = this.buffer.concat(
        this.parentSeries.additionalResponsibles,
      );
    }
  }

  /**
   * Adds responsibles from the current element to the buffer.
   * If the current element has responsibles, they are concatenated to the
   * buffer.
   */
  _addResponsiblesFromCurrentElement() {
    if (this.currentElement?.hasResponsibles()) {
      this.buffer = this.buffer.concat(this.currentElement.getResponsibles());
    }
  }

  /**
   * Prunes duplicates from the buffer and prepares the result.
   *
   * @private
   */
  _pruneDuplicatesAndPrepareResult() {
    this.buffer.forEach((userIdOrFreeText) => {
      if (!this.possibleResponsiblesUnique[userIdOrFreeText]) {
        this.possibleResponsiblesUnique[userIdOrFreeText] = true;
        this.possibleResponsibles.push(
          this._createResponsibleObject(userIdOrFreeText),
        );
      }
    });
  }

  /**
   * Creates a responsible object based on the provided userId, free text, or
   * user object.
   *
   * @param {string|Object} userIdOrFreeTextOrUserObject - The userId, free
   *     text, or user object.
   * @returns {ResponsibleObject} The responsible object with id and text
   *     properties.
   * @private
   */
  _createResponsibleObject(userIdOrFreeTextOrUserObject) {
    let user = userIdOrFreeTextOrUserObject;
    if (typeof userIdOrFreeTextOrUserObject === "string") {
      user = this.usersCollection.findOne(userIdOrFreeTextOrUserObject);
      if (!user) {
        return {
          id: userIdOrFreeTextOrUserObject,
          text: userIdOrFreeTextOrUserObject,
        };
      }
    }

    return { id: user._id, text: ParticipantsPreparer._formatUser(user) };
  }

  /**
   * Formats the user information.
   * @param {Object} user - The user object.
   * @returns {string} The formatted user information.
   */
  static _formatUser(user) {
    let usertext = user.username;
    if (user.profile?.name && user.profile.name !== "") {
      usertext += ` - ${user.profile.name}`;
    }
    return usertext;
  }

  /**
   * Adds a free text element to the buffer.
   *
   * @param {string} text - The text to be added to the buffer.
   * @returns {void}
   */
  _addFreeTextElementToBuffer(text) {
    if (!this.freeTextValidator || this.freeTextValidator(text)) {
      this.buffer.push(text);
    }
  }

  /**
   * Checks if the given value might be a valid responsible ID.
   *
   * @param {any} value - The value to check.
   * @returns {boolean} - Returns true if the value might be a valid responsible
   *     ID, false otherwise.
   */
  static _responsibleMightBeID(value) {
    return value.id && value.id.length > 15; // Meteor _ids default to 17 chars
  }
}
