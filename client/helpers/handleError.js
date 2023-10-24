import {i18n} from "meteor/universe:i18n";

import {FlashMessage} from "./flashMessage";

export function handleError(error, title = i18n.__("FlashMessages.error")) {
  if (!error) {
    return;
  }
  new FlashMessage(title, error.reason).show();
}
