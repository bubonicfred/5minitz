import { Meteor } from "meteor/meteor";
import { i18n } from "meteor/universe:i18n";

import { GlobalSettings } from "../config/GlobalSettings";

import { MailFactory } from "./MailFactory";

/**
 * Handles sending an email to an admin when a new user is registered.
 *
 * @class AdminRegisterUserMailHandler
 * @param {string} newUserId - The ID of the new user that was registered.
 * @param {boolean} includePassword - Whether to include the user's password in
 *     the email.
 * @param {string} password - The password of the new user.
 */
export class AdminRegisterUserMailHandler {
  constructor(newUserId, includePassword, password) {
    this._includePassword = includePassword;
    this._password = password;
    this._user = Meteor.users.findOne(newUserId);
    if (!this._user) {
      throw new Meteor.Error(
        "Send Admin Mail",
        `Could not find user: ${newUserId}`,
      );
    }
  }

  /**
   * Sends an email to the admin when a new user is registered by an admin.
   * The email includes the new user's name, username, and optionally their
   * password. The email is sent from the default email sender address
   * configured in GlobalSettings.
   */
  send() {
    const emails = Meteor.user().emails;
    const adminFrom =
      emails && emails.length > 0
        ? emails[0].address
        : GlobalSettings.getDefaultEmailSenderAddress();

    if (this._user.emails && this._user.emails.length > 0) {
      const mailParams = {
        userLongName: this._user.profile.name,
        rootURL: GlobalSettings.getRootUrl(),
        userName: this._user.username,
        passwordParagraph: this._includePassword
          ? i18n.__("Mail.AdminRegisterNewUser.passwordParagraph", {
              password: this._password,
            })
          : i18n.__("Mail.AdminRegisterNewUser.passwordNotSend"),
        url4Minitz: "https://github.com/4minitz/4minitz",
      };

      const mailer = MailFactory.getMailer(
        adminFrom,
        this._user.emails[0].address,
      );
      mailer.setSubject(
        `[4Minitz] ${i18n.__("Mail.AdminRegisterNewUser.subject")}`,
      );
      mailer.setText(i18n.__("Mail.AdminRegisterNewUser.body", mailParams));
      mailer.send();
      return;
    }
    console.error(
      `Could not send admin register mail. User has no mail address: ${this._user._id}`,
    );
  }
}
