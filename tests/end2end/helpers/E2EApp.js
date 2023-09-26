
import { E2EGlobal } from './E2EGlobal';


export class E2EApp {
    static titlePrefix = '4Minitz!';

    // Calls the server method to clean database and create fresh test users
    static async resetMyApp(skipUsers) {
        try {
            await server.call('e2e.resetMyApp', skipUsers);  // call meteor server method
        } catch (e) {
            console.log('Exception: '+e);
            console.log('Did you forget to run the server with \'--settings settings-test-end2end.json\'?');
        }
    }

    static async isLoggedIn() {
        try {
            await browser.waitForExist('#navbar-usermenu', 5000);         // browser = WebdriverIO instance
        } catch (e) {
            // give browser some time, on fresh login
            await E2EGlobal.saveScreenshot('isLoggedIn_failed');
        }
        return browser.isExisting('#navbar-usermenu');
    }

    // We need a separate isNotLoggedIn() as the isLoggedIn() returns too quick on "!isLoggedIn()"
    static async isNotLoggedIn() {
        try {
            await browser.waitForExist('#tab_standard', 5000);         // browser = WebdriverIO instance
        } catch (e) {
            // give browser some time, on fresh login
            await E2EGlobal.saveScreenshot('isNotLoggedIn_failed');
        }
        return browser.isExisting('#tab_standard');
    }


    static async logoutUser() {
        if (await E2EApp.isLoggedIn()) {
            await E2EGlobal.clickWithRetry('#navbar-usermenu');
            await E2EGlobal.clickWithRetry('#navbar-signout');
            await E2EGlobal.waitSomeTime();
        }
        E2EApp._currentlyLoggedInUser = '';
        await E2EGlobal.waitSomeTime(600); // give title change time to settle
        await expect(await browser.getTitle()).to.equal(E2EApp.titlePrefix);
    }

    static async loginLdapUserWithCredentials(username, password, autoLogout) {
        await this.loginUserWithCredentials(username, password, autoLogout, '#tab_ldap');
    }

    static async loginFailed() {
        const standardLoginErrorAlertExists = await browser.isExisting('.at-error.alert.alert-danger'),
            generalAlertExists = await browser.isExisting('.alert.alert-danger');
        let generalAlertShowsLoginFailure = false;

        try {
            if (generalAlertExists) {
                generalAlertShowsLoginFailure = (await browser.getHTML('.alert.alert-danger')).includes('403');
            }
        } catch (e) {
            const expectedError = 'An element could not be located on the page using the given search parameters (".alert.alert-danger")';
            if (!e.toString().includes(expectedError)) {
                throw e;
            }
        }

        return standardLoginErrorAlertExists ||
            (generalAlertExists && generalAlertShowsLoginFailure);
    }

    static async loginUserWithCredentials(username, password, autoLogout = true, tab = '#tab_standard') {
        if (autoLogout) {
            await E2EApp.logoutUser();
        }

        try {
            await browser.waitForVisible(tab, 5000);
            await E2EGlobal.clickWithRetry(tab);

            await browser.waitUntil(async _ => {
                let tabIsStandard = await browser.isExisting('#at-field-username_and_email');
                let userWantsStandard = tab === '#tab_standard';
                let tabIsLdap = await browser.isExisting('#id_ldapUsername');
                let userWantsLdap = tab === '#tab_ldap';

                return (tabIsStandard && userWantsStandard) || (tabIsLdap && userWantsLdap);
            }, 7500, 'The login screen could not been loaded in time');

            let tabIsStandard = await browser.isExisting('#at-field-username_and_email');
            let tabIsLdap = await browser.isExisting('#id_ldapUsername');

            if (tabIsStandard) {
                await E2EGlobal.setValueSafe('input[id="at-field-username_and_email"]', username);
                await E2EGlobal.setValueSafe('input[id="at-field-password"]', password);
            }

            if (tabIsLdap) {
                await E2EGlobal.setValueSafe('input[id="id_ldapUsername"]', username);
                await E2EGlobal.setValueSafe('input[id="id_ldapPassword"]', password);
            }

            await browser.keys(['Enter']);

            await browser.waitUntil(async _ => {
                const userMenuExists = await browser.isExisting('#navbar-usermenu');
                return userMenuExists || (await E2EApp.loginFailed());
            }, 20000, 'The login could not been processed in time');

            if (await E2EApp.loginFailed()) {
                throw new Error ('Unknown user or wrong password.');
            }

            if (! (await E2EApp.isLoggedIn())) {
                console.log('loginUserWithCredentials: no success via UI... trying Meteor.loginWithPassword()');
                await browser.execute( function() {
                    Meteor.loginWithPassword(username, password);
                });
                await browser.waitUntil(async _ => {
                    const userMenuExists = await browser.isExisting('#navbar-usermenu');
                    return userMenuExists || (await E2EApp.loginFailed());
                }, 5000);
            }

            E2EApp._currentlyLoggedInUser = username;
        } catch (e) {
            await E2EGlobal.saveScreenshot('loginUserWithCredentials_failed');
            throw new Error (`Login failed for user ${username} with ${password}\nwith ${e}`);
        }
    }

    /**
     * Logout current user, if necessary, then login a specific test user
     * @param indexOrUsername of test user from setting. optional.
     * @param autoLogout perform logout before login the test user. optional.
     */
    static async loginUser(indexOrUsername, autoLogout) {
        if (!indexOrUsername) {
            indexOrUsername = 0;
        }
        if (typeof indexOrUsername === 'string') {
            let orgUserName = indexOrUsername;
            indexOrUsername = E2EGlobal.SETTINGS.e2eTestUsers.indexOf(indexOrUsername);
            if (indexOrUsername === -1) {
                console.log('Error {E2EApp.loginUser} : Could not find user '+orgUserName+'. Fallback: index=0.');
                indexOrUsername = 0;
            }
        }

        let aUser = E2EGlobal.SETTINGS.e2eTestUsers[indexOrUsername];
        let aPassword = E2EGlobal.SETTINGS.e2eTestPasswords[indexOrUsername];

        await this.loginUserWithCredentials(aUser, aPassword, autoLogout);
    }

    static async getCurrentUser() {
        return E2EApp._currentlyLoggedInUser;
    }
    
    static async launchApp() {
        await browser.url(E2EGlobal.SETTINGS.e2eUrl);

        await E2EGlobal.waitSomeTime(600); // give title change time to settle
        const title = await browser.getTitle();
        if (title !== E2EApp.titlePrefix) {
            throw new Error(`App not loaded. Unexpected title ${title}. Please run app with 'meteor npm run test:end2end:server'`);
        }
    }

    static async isOnStartPage() {
        // post-condition
        try {
            await browser.waitForExist('#btnNewMeetingSeries', 2000);
        } catch (e) {
            return false;
        }
        return true;
    }

    // We can't use "launchApp" here, as this resets the browser
    // so we click on the "Logo" icon
    static async gotoStartPage() {
        await browser.keys(['Escape']);   // close eventually open modal dialog
        await E2EGlobal.waitSomeTime();
        try {
            await browser.waitForExist('a.navbar-brand', 2500);
        } catch (e) {
            await E2EApp.launchApp();
        }
        // Just in case we have not already a user logged in, we do it here!
        if (! (await E2EApp.isLoggedIn())) {
            await E2EApp.loginUser(0, false);
        }
        await E2EGlobal.clickWithRetry('a.navbar-brand', 6000);
        await E2EGlobal.waitSomeTime();
        // check post-condition
        if (! (await E2EApp.isOnStartPage())) {
            await E2EGlobal.clickWithRetry('a.navbar-brand');
            await E2EGlobal.waitSomeTime(1500);
        }
        if (! (await E2EApp.isOnStartPage())) {
            await E2EGlobal.saveScreenshot('gotoStartPage2');
        }

        // give title change time to settle
        try {
            await browser.waitUntil(async function() {
                return ((await browser.getTitle()) === E2EApp.titlePrefix);
            },5000,'Timeout! Title did not change! Will try to re-launchApp().',250);
        } catch (e) {
            await E2EApp.launchApp();
            await E2EGlobal.waitSomeTime();
        }
        await expect(await browser.getTitle()).to.equal(E2EApp.titlePrefix);
        expect(await E2EApp.isOnStartPage(), 'gotoStartPage()').to.be.true;
    }

    static async confirmationDialogCheckMessage(containedText) {
        await E2EGlobal.waitSomeTime();
        await expect(await browser.getText('div#confirmDialog'), 'Check confirmation messagebox contains text')
            .to.contain(containedText);
    }

    static async confirmationDialogAnswer(pressOK) {
        await E2EGlobal.waitSomeTime(1250); // give dialog animation time
        await browser.waitForVisible('#confirmationDialogOK', 1000);
        if (pressOK) {
            await E2EGlobal.clickWithRetry('#confirmationDialogOK');
        } else {
            await E2EGlobal.clickWithRetry('#confirmationDialogCancel');
        }
        await E2EGlobal.waitSomeTime(1250); // give dialog animation time
    }

    static async resetPassword(emailAdress) {
        await E2EGlobal.clickWithRetry('#at-forgotPwd');
        await browser.setValue('#at-field-email', emailAdress);
        await E2EGlobal.clickWithRetry('#at-btn');
    }

    static async gotoActionItemsTab() {
        let selector = '#tab_actionItems';
        try {
            await browser.waitForExist(selector);
        } catch (e) {
            return false;
        }
        await E2EGlobal.clickWithRetry(selector);
        await E2EGlobal.waitSomeTime();
    }
}

E2EApp._currentlyLoggedInUser = '';
