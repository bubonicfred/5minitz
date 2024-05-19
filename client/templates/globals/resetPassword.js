import { handleError } from "/client/helpers/handleError";
import { Accounts } from "meteor/accounts-base";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { Template } from "meteor/templating";
import { i18n } from "meteor/universe:i18n";

import { FlashMessage } from "../../helpers/flashMessage";

Template.resetPassword.events({
  "submit #at-pwd-form"(event) {
    event.preventDefault();
    const token = FlowRouter.getParam("token");
    Accounts.resetPassword(
      token,
      document.getElementById("at-field-password").value,
      (error) => {
        if (error) {
          handleError(error.reason);
        } else {
          FlowRouter.go("/");
          new FlashMessage(
            i18n.__("FlashMessages.ok"),
            i18n.__("FlashMessages.passwordResetOK"),
            "alert-success",
          ).show();
        }
      },
    );
  },
});
