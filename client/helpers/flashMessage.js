const DEFAULT_MESSAGE = "Sorry, an unexpected error has occurred.";

const TYPES = {
  SUCCESS: "success",
  INFO: "info",
  WARNING: "warning",
  DANGER: "danger",
};

/**
 * Represents a flash message that can be displayed to the user.
 */
export class FlashMessage {
  /**
   *
   * @return {{SUCCESS: string, INFO: string, WARNING: string, DANGER: string}}
   */
  static TYPES() {
    return TYPES;
  }

  constructor(title, message, type = TYPES.DANGER, duration = 5000) {
    this._setValues(title, message, type, duration);
    this.currentNotification = null;
  }

  /**
   * Replaces the currently shown flash message
   * with a new one, immediately.
   *
   * @param title
   * @param message
   * @param type
   * @param duration
   */
  replace(title, message, type = TYPES.DANGER, duration = 5000) {
    this._setValues(title, message, type, duration);
    this._updateNotification();
  }

  /**
   * Updates the current notification with the latest title, message, type, and
   * delay.
   */
  _updateNotification() {
    this.currentNotification.update("title", this.title);
    this.currentNotification.update("message", this.message);
    this.currentNotification.update("type", this.type);
    this.currentNotification.update("delay", this.duration);
  }

  /**
   * Sets the values for the flash message.
   *
   * @param {string} title - The title of the flash message.
   * @param {string} message - The message content of the flash message.
   * @param {string} [type=TYPES.DANGER] - The type of the flash message (e.g.
   *     'success', 'error', 'info').
   * @param {number} [duration=5000] - The duration in milliseconds for which
   *     the flash message should be displayed. If set to -1, the flash message
   *     will not automatically close.
   */
  _setValues(title, message, type = TYPES.DANGER, duration = 5000) {
    if (duration === -1) duration = 0;
    this.title = `<strong>${title}</strong>`;
    this.message = message || DEFAULT_MESSAGE;
    this.type = type.replace("alert-", "");
    this.duration = duration;
  }

  /**
   * Displays the flash message. If there
   * are queued flash messages they will be shown
   * in a delay of |queue| * MIN_DURATION_TIME.
   *
   * @returns {FlashMessage}
   */
  show() {
    this.currentNotification = window.Noty.overrideDefaults({
      callbacks: {
        onClosed: () => {
          this.currentNotification = null;
        },
      },
    }).show(this._createOptions(), this._createSettings());
    return this;
  }

  /**
   * Creates the options object for the FlashMessage notification.
   * @returns {Object} The options object with the following properties:
   *   - title: The title of the notification.
   *   - message: The message content of the notification.
   */
  _createOptions() {
    return {
      title: this.title,
      message: this.message,
    };
  }

  /**
   * Creates the settings object for the FlashMessage notification.
   * @returns {Object} The settings object with the following properties:
   *   - delay: The duration in milliseconds for which the notification should
   * be displayed.
   *   - type: The type of notification (e.g. 'success', 'error', 'info').
   *   - z_index: The z-index value to ensure the notification is displayed on
   * top.
   *   - onClosed: A callback function that is executed when the notification is
   * closed.
   */
  _createSettings() {
    return {
      delay: this.duration,
      type: this.type,
      z_index: 5031,
      onClosed: () => {
        this.currentNotification = null;
      },
    };
  }

  /**
   * Hides the current FlashMessage object immediately.
   */
  hideMe() {
    if (this.currentNotification === null) return;
    this.currentNotification.close();
  }
}
