import {E2EGlobal} from './E2EGlobal'


export class E2EUser {
    static async changePassword(oldPassword, newPassword1, newPassword2) {
        await E2EGlobal.setValueSafe('input#id_oldPassword', oldPassword);
        await E2EGlobal.setValueSafe('input#id_newPassword1', newPassword1);
        await E2EGlobal.setValueSafe('input#id_newPassword2', newPassword2);

        await browser.keys(['Enter']);
    }

    static async editProfile(longName, eMail, saveParameter = true) {
        await E2EGlobal.setValueSafe('input#id_longName', longName);
        await E2EGlobal.setValueSafe('input#id_emailAddress', eMail);
        if (saveParameter) {
            await browser.keys(['Enter']);
        }
        await E2EGlobal.waitSomeTime();
    }

    static async checkProfileChanged(longName, email) {
        return browser.execute(function (longName, email) {
            let profileChanged = false;

            if (((!Meteor.user().profile) ||
                (Meteor.user().profile.name === longName)) &&
                (Meteor.user().emails[0].address === email)) {
                profileChanged = true;
            }
            return profileChanged;
        }, longName, email);
    }

    static async getUserEmail() {
         return (await browser.execute(function () {
             return (await Meteor.user()).emails[0].address;
        })).value;
    }

}


