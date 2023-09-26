import { E2EGlobal } from './E2EGlobal'
import { E2EApp } from './E2EApp';


export class E2EAdmin {
    static async getAdminRoute() {
        return 'admin';
    }
    static selectorMap = {
        tabUsers:               '#tabAdminUsers',
        tabMessages:            '#tabAdminMessages',

        btnRegisterNewUser:     '#btnAdminRegisterNewUser',
        inpNewUser_username:    '#id_newUsrName',
        inpNewUser_longname:    '#id_newUsrLongName',
        inpNewUser_email:       '#id_newUsrMail',
        inpNewUser_password1:   '#id_newUsrPassword1',
        inpNewUser_password2:   '#id_newUsrPassword2',
        btnNewUser_Save:        '#btnRegisterUserSave',

        inpFilterUsers:         '#id_adminFilterUsers',
        labShowInactiveUsers:   "label[for='id_adminShowInactive']",
        chkShowInactiveUsers:   '#id_adminShowInactive',
        btnToggleUserInactive:  '#id_ToggleInactive',

        inpNewMessage:          '#id_adminMessage',
        dlgAllMessages:         '#broadcastMessage.modal',
        btnDismissAllMessages:  '#btnDismissBroadcast'

    };

    static async clickAdminMenu() {
        if (await E2EApp.isLoggedIn()) {
            await E2EGlobal.clickWithRetry('#navbar-usermenu');
            if (await browser.isExisting('#navbar-admin')) {
                await E2EGlobal.clickWithRetry('#navbar-admin');
                await E2EGlobal.waitSomeTime();
                return true;
            }
            await E2EGlobal.clickWithRetry('#navbar-usermenu');  // close open menu
        }
        return false;
    }

    static async isOnAdminView() {
        return !!((await browser.getUrl()).includes(await E2EAdmin.getAdminRoute())
                  && (await browser.isVisible(E2EAdmin.selectorMap.btnRegisterNewUser)));
    }

    static async switchToTab(tabName) {
        if (tabName === "Users") {
            await E2EGlobal.clickWithRetry(E2EAdmin.selectorMap.tabUsers)
        } else if (tabName === "Messages") {
            await E2EGlobal.clickWithRetry(E2EAdmin.selectorMap.tabMessages)
        } else {
            throw new Exception("Unknown admin tab: "+tabName);
        }
        await E2EGlobal.waitSomeTime(600);
    }

    static async setShowInactive(showInactive) {
        if (showInactive !== (await E2EGlobal.isCheckboxSelected(E2EAdmin.selectorMap.chkShowInactiveUsers))) {
            // With material design we can only toggle a checkbox via click on it's label
            await E2EGlobal.clickWithRetry(E2EAdmin.selectorMap.labShowInactiveUsers);
            await E2EGlobal.waitSomeTime();
        }
    }

    static async filterForUser(username) {
        await browser.setValue(E2EAdmin.selectorMap.inpFilterUsers, username);
    }

    static async toggleUserActiveState(index) {
        if (index === undefined) {
            index = 1;
        }
        let selector = E2EAdmin.selectorMap.btnToggleUserInactive+':nth-child('+index+')';
        await E2EGlobal.clickWithRetry(selector);
        await E2EGlobal.waitSomeTime();
    }

    static async sendNewBroadcastMessage(message) {
        await E2EAdmin.switchToTab("Messages");
        await browser.setValue(E2EAdmin.selectorMap.inpNewMessage, message);
        await browser.keys(['Enter']);
        await E2EGlobal.waitSomeTime(500);
    }

    static async registerNewUser(username, longname, email, password) {
        await E2EGlobal.clickWithRetry(E2EAdmin.selectorMap.btnRegisterNewUser);
        await E2EGlobal.waitSomeTime(500);

        await browser.setValue(E2EAdmin.selectorMap.inpNewUser_username, username);
        await browser.setValue(E2EAdmin.selectorMap.inpNewUser_longname, longname);
        await browser.setValue(E2EAdmin.selectorMap.inpNewUser_email, email);
        await browser.setValue(E2EAdmin.selectorMap.inpNewUser_password1, password);
        await browser.setValue(E2EAdmin.selectorMap.inpNewUser_password2, password);

        await E2EGlobal.clickWithRetry(E2EAdmin.selectorMap.btnNewUser_Save);
        await E2EGlobal.waitSomeTime(500);
    }
}

