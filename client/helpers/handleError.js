import { i18n } from "meteor/universe:i18n";

import { FlashMessage } from "./flashMessage";

/**
 * Handles an error by displaying a flash message with the given title and error
 * reason.
 *
 * @param {Error} error - The error object to handle.
 * @param {string} [title=i18n.__("FlashMessages.error")] - The title of the
 *     flash message. Defaults to "FlashMessages.error".
 */
export function handleError(error, title = i18n.__("FlashMessages.error")) {
  if (!error) {
    return;
  }
  new FlashMessage(title, error.reason).show();
}
