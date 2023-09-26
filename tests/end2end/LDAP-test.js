import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';

describe('LDAP', function () {
    const aProjectName = "E2E LDAP";
    let aMeetingCounter = 0;
    let aMeetingNameBase = "Meeting Name #";
    let aMeetingName;

    let getNewMeetingName = async () => {
        aMeetingCounter++;
        return aMeetingNameBase + aMeetingCounter;
    };

    before("reload page and reset app", function () {
        await E2EGlobal.logTimestamp("Start test suite");
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();
    });

    beforeEach("make sure test user is logged out and on the start page", function () {
        await E2EApp.logoutUser();
        expect(await E2EApp.isNotLoggedIn()).to.be.true;
    });

    after("clear database and login user", function () {
        await E2EApp.launchApp();
        await E2EApp.loginUser();
        expect(await E2EApp.isLoggedIn()).to.be.true;
    });

    xit('import cronjob does not produce errors', function () {
        const numberOfUsersWithoutLdap = await server.call('e2e.removeLdapUsersFromDb');

        await server.call('e2e.importLdapUsers');

        const numberOfUsersAfterImport = await server.call('e2e.countUsers');
        await expect(numberOfUsersAfterImport).to.be.greaterThan(numberOfUsersWithoutLdap);
    });

    it('ldap user can login with his credentials', function () {
        await E2EApp.loginLdapUserWithCredentials('ldapUser1', 'ldapPwd1', false);

        expect(await E2EApp.isLoggedIn()).to.be.true;
    });

    it('ldap user can NOT reset password', function () {
        await E2EApp.loginLdapUserWithCredentials('ldapUser1', 'ldapPwd1', false);
        await E2EApp.logoutUser();

        await E2EGlobal.clickWithRetry('#tab_standard');
        await E2EGlobal.waitSomeTime(600);
        if (await browser.isVisible('#at-forgotPwd')) {
            await E2EApp.resetPassword('ldapUser1@example.com');
            await E2EGlobal.waitSomeTime(1500);
            expect(await browser.isVisible('.at-error'), 'Error should be visible').to.be.true;
        }
        else {
            expect(await browser.isVisible('#at-forgotPwd'), 'Change password should be invisible').to.be.false;
        }
    });

    it('ldap user can create meeting series', function () {
        await E2EApp.loginLdapUserWithCredentials('ldapUser1', 'ldapPwd1', false);

        let initialCount = await E2EMeetingSeries.countMeetingSeries();

        aMeetingName = await getNewMeetingName();
        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);

        await expect(await E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount + 1);
        expect(await E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
    });

    it('ldap user will be rejected if the password is wrong', function () {
        let loginUnexpectedlySucceeded = false;
        try {
            await E2EApp.loginLdapUserWithCredentials('ldapUser1', 'wrongPassword', false);
            loginUnexpectedlySucceeded = true;
        } catch (e) {
            await expect(e.toString()).to.include('Unknown user or wrong password.');
        }

        expect(loginUnexpectedlySucceeded).to.be.false;
        expect(await E2EApp.isNotLoggedIn()).to.be.true;
    });

    it('ldap user can not log in with the standard login form', function () {
        let message = 'Login failed for user ldapUser1 with ldapPwd1\nwith Error: Unknown user or wrong password.';

        let login = async () => {
            await E2EApp.loginUserWithCredentials('ldapUser1', 'ldapPwd1', false);
        };

        await expect(login).to.throw(message);

        expect(await E2EApp.isNotLoggedIn()).to.be.true;
    });
});