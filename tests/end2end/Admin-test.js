import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMails } from './helpers/E2EMails'

import { E2EAdmin } from './helpers/E2EAdmin';


describe('Admin View', function () {
    before('reload page and reset app', function () {
        await E2EGlobal.logTimestamp("Start test suite");
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();
    });

    beforeEach('goto start page and make sure test user is logged in', function () {
        await server.call('e2e.removeAllBroadcasts');
        await E2EApp.launchApp();
        await E2EApp.loginUser(0);
        expect(await E2EApp.isLoggedIn()).to.be.true;
    });

    after('log in user1', function () {
        await server.call('e2e.removeAllBroadcasts');
        await E2EApp.launchApp();
        await E2EApp.loginUser(0, true);
    });

    it('can not access admin menu or route for non-admin user', function () {
        expect(await E2EAdmin.clickAdminMenu(), 'click admin menu').to.be.false;

        await browser.url((await browser.getUrl())+(await E2EAdmin.getAdminRoute()));
        await E2EGlobal.waitSomeTime();
        expect(await E2EAdmin.isOnAdminView(), "! isOnAdminView").to.be.false;
    });


    it('can access admin menu for admin user', function () {
        await E2EApp.loginUser(4, true);
        expect(await E2EAdmin.clickAdminMenu(), 'click admin menu').to.be.true;
        expect(await E2EAdmin.isOnAdminView(), "isOnAdminView").to.be.true;
        await E2EApp.loginUser(0, true);
    });


    // #Security: Inactive users shall not be able to log in.
    it('can toggle a user to in-active. In-active user cannot sign in.', function () {
        await E2EApp.loginUser("admin", true);
        await E2EAdmin.clickAdminMenu();
        await E2EAdmin.switchToTab("Users");
        await E2EAdmin.setShowInactive(true);

        let testUser = "user2";
        await E2EAdmin.filterForUser(testUser+"@4min");   // the '@' actually searches in mail address. This prevents 'ldapuser1' to show up
        await expect (await browser.getText('#id_adminUserTable tbody tr')).to.contain('Active');
        await E2EAdmin.toggleUserActiveState(1);   // toggle 1st visible user!
        await expect (await browser.getText('#id_adminUserTable tbody tr')).to.contain('Inactive');

        let loginSuccess = false;
        try {
            await E2EApp.loginUser(testUser, true);
            loginSuccess = true;
        } catch (e) {
            await expect(e+"").to.contain("wrong password");
        }
        expect(loginSuccess, "loginSuccess should be false, as user is in-active").to.be.false;
    });


    it('can toggle a user back to active. Active user can sign in, again.', function () {
        await E2EApp.loginUser("admin", true);
        await E2EAdmin.clickAdminMenu();
        await E2EAdmin.switchToTab("Users");
        await E2EAdmin.setShowInactive(true);

        let testUser = "user2";
        await E2EAdmin.filterForUser(testUser+"@4min");   // the '@' actually searches in mail address. This prevents 'ldapuser1' to show up
        await expect (await browser.getText('#id_adminUserTable tbody tr')).to.contain('Inactive');
        await E2EAdmin.toggleUserActiveState(1);   // toggle 1st visible user!
        await expect (await browser.getText('#id_adminUserTable tbody tr')).to.contain('Active');

        await E2EApp.loginUser(testUser, true);
        expect(await E2EApp.isLoggedIn(), "user is logged in").to.be.true;
    });


    it('can broadcast a message and dismiss it', function () {
        await E2EApp.loginUser("admin", true);
        await E2EAdmin.clickAdminMenu();

        // admin sends broadcast message
        let message = 'Hello from admin!';
        expect(await browser.isVisible(E2EAdmin.selectorMap.dlgAllMessages)
            , "message dialog should be invisible for admin").to.be.false;
        await E2EAdmin.sendNewBroadcastMessage(message);
        await browser.waitForVisible(E2EAdmin.selectorMap.dlgAllMessages, 2000);
        expect(await browser.isVisible(E2EAdmin.selectorMap.dlgAllMessages)
            , "message dialog should be visible for admin").to.be.true;
        await expect(await browser.getText(E2EAdmin.selectorMap.dlgAllMessages)
            , "check broadcast message text").to.contain(message);

        // Dismiss by admin user
        await E2EGlobal.clickWithRetry(E2EAdmin.selectorMap.btnDismissAllMessages);
        const isNotVisible = true;
        await browser.waitForVisible(E2EAdmin.selectorMap.dlgAllMessages, 2000, isNotVisible);
        expect(await browser.isVisible(E2EAdmin.selectorMap.dlgAllMessages)
            , "message dialog should be invisible for admin after dismiss").to.be.false;

        // Now check display & dismiss by normal user
        await E2EApp.loginUser("user1", true);
        await browser.waitForVisible(E2EAdmin.selectorMap.dlgAllMessages, 3000);
        await E2EGlobal.clickWithRetry(E2EAdmin.selectorMap.btnDismissAllMessages);
        const waitForInvisible = true;
        await browser.waitForVisible(E2EAdmin.selectorMap.dlgAllMessages, 3000, waitForInvisible);
        expect(await browser.isVisible(E2EAdmin.selectorMap.dlgAllMessages)
            , "message dialog should be visible for admin").to.be.false;
    });


    it('can register a new user', function () {
        await E2EApp.loginUser("admin", true);
        await E2EAdmin.clickAdminMenu();

        let username = "newuser";
        let longname = "New User";
        let email = "newuser@4minitz.com";
        let password = "NewNew1";
        await E2EAdmin.registerNewUser(username, longname, email, password);

        // check EMail sent to new user
        let sentMails = await E2EMails.getAllSentMails();
        expect(sentMails, 'one mail should be sent').to.have.length(1);
        let sentMail = sentMails[0];
        await expect(sentMail.to, 'the email should contain to: mail').to.equal(email);
        await expect(sentMail.text, 'the email should contain username').to.contain(username);
        await expect(sentMail.text, 'the email should contain long name').to.contain(longname);
        await expect(sentMail.text, 'the email should contain password').to.contain(password);

        // check if new user can sign in
        await E2EApp.loginUserWithCredentials(username, password, true);
        expect(await E2EApp.isLoggedIn(), "user is logged in").to.be.true;
    });
});
