import { E2EGlobal } from './helpers/E2EGlobal'
import { E2EApp } from './helpers/E2EApp'
import { E2EUser } from './helpers/E2EUser'


describe('User Profile/Password editing', function () {

    const waitUntilTimeout = 10000;

    before("reload page and reset app", function () {
        await E2EGlobal.logTimestamp("Start test suite");
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();
    });

    beforeEach("goto start page and make sure test user is logged in", function () {
        await E2EApp.gotoStartPage();
        expect(await E2EApp.isLoggedIn()).to.be.true;
    });


    it('Buttons Change Password and Edit Profile are not visible for an LDAP user', function () {
        await E2EApp.logoutUser();
        expect(await E2EApp.isNotLoggedIn()).to.be.true;

        await E2EApp.loginLdapUserWithCredentials('ldapUser1', 'ldapPwd1', false);
        expect(await E2EApp.isLoggedIn()).to.be.true;

        if (await E2EApp.isLoggedIn()) {
            await E2EGlobal.clickWithRetry('#navbar-usermenu');
            await browser.waitUntil(async _ => !(await browser.isVisible('#navbar-dlgChangedPassword')));
            expect(await browser.isVisible('#navbar-dlgEditProfile')).to.be.false;
        }
        await E2EGlobal.clickWithRetry('#navbar-usermenu');

        await E2EApp.logoutUser();
        expect(await E2EApp.isNotLoggedIn()).to.be.true;
        await E2EApp.loginUser();
    });

    it('User can successfully change his password', function () {
        expect(await E2EApp.isLoggedIn()).to.be.true;
        let newPassword = 'Test12';
        let oldPassword = E2EGlobal.SETTINGS.e2eTestPasswords[0];

        let changePassword = async (oldPassword, newPassword) => {
            await E2EGlobal.clickWithRetry('#navbar-usermenu');
            await E2EGlobal.waitSomeTime();
            await E2EGlobal.clickWithRetry('#navbar-dlgChangePassword');
            await E2EGlobal.waitSomeTime();
            await E2EUser.changePassword(oldPassword, newPassword, newPassword);
        };
        //change password to new one
        await changePassword(oldPassword, newPassword);

        await browser.waitUntil(async _ => !(await browser.isVisible('#frmDlgChangePassword')), waitUntilTimeout);

        //try ty to log in with new password
        await E2EApp.logoutUser();
        expect(await E2EApp.isNotLoggedIn()).to.be.true;
        await E2EApp.loginUserWithCredentials(E2EGlobal.SETTINGS.e2eTestUsers[0], newPassword, false);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        //reset password to the old one
        await changePassword(newPassword, oldPassword);

        await browser.waitUntil(async _ => !(await browser.isVisible('#frmDlgChangePassword')), waitUntilTimeout);
    });

    it('User can not change his password, if new Passwords are not equal', function () {
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2EGlobal.clickWithRetry('#navbar-usermenu');
        await E2EGlobal.waitSomeTime();
        await E2EGlobal.clickWithRetry('#navbar-dlgChangePassword');
        await E2EGlobal.waitSomeTime();
        let oldPassword = E2EGlobal.SETTINGS.e2eTestPasswords[0];
        await E2EUser.changePassword(oldPassword, 'TTest12', 'Test12');

        await browser.waitUntil(async _ => await browser.isVisible('#frmDlgChangePassword'), waitUntilTimeout);
        await E2EGlobal.clickWithRetry('#btnChangePasswordCancel');
    });

    it('User can not change his password, if he typed his old password incorrect', function () {
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2EGlobal.clickWithRetry('#navbar-usermenu');
        await E2EGlobal.waitSomeTime();
        await E2EGlobal.clickWithRetry('#navbar-dlgChangePassword');
        await E2EGlobal.waitSomeTime();
        let oldPassword = '4Minitz!';
        await E2EUser.changePassword(oldPassword, 'Test12', 'Test12');
        await browser.waitUntil(async _ => await browser.isVisible('#frmDlgChangePassword'), waitUntilTimeout);
        await E2EGlobal.clickWithRetry('#btnChangePasswordCancel');
        await E2EGlobal.waitSomeTime();
    });

    it('User can not change his password, if his new password is not valid due to guidelines', function () {
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2EGlobal.clickWithRetry('#navbar-usermenu');
        await E2EGlobal.waitSomeTime();
        await E2EGlobal.clickWithRetry('#navbar-dlgChangePassword');
        await E2EGlobal.waitSomeTime();
        let oldPassword = E2EGlobal.SETTINGS.e2eTestPasswords[0];
        await E2EUser.changePassword(oldPassword, 'test12', 'test12');
        await browser.waitUntil(async _ => await browser.isVisible('#frmDlgChangePassword'), waitUntilTimeout);
        await E2EGlobal.clickWithRetry('#btnChangePasswordCancel');
        await E2EGlobal.waitSomeTime();
    });

    it('User can successefully change his profile', function () {
        expect(await E2EApp.isLoggedIn()).to.be.true;
        let longName = 'longname';
        let email = 'test@test.de';
        await E2EGlobal.clickWithRetry('#navbar-usermenu');
        await E2EGlobal.waitSomeTime();
        await E2EGlobal.clickWithRetry('#navbar-dlgEditProfile');
        await E2EGlobal.waitSomeTime();
        await E2EUser.editProfile(longName, email);
        await browser.waitUntil(async _ => !(await browser.isVisible('#frmDlgEditProfile')), waitUntilTimeout);
        expect((await E2EUser.checkProfileChanged(longName, email)).value).to.be.true;
    });

    it('User can not save his profile with an invalid Email', function () {
        expect(await E2EApp.isLoggedIn()).to.be.true;
        let longName = 'longname';
        let email = 'testtest.de';
        await E2EGlobal.clickWithRetry('#navbar-usermenu');
        await E2EGlobal.waitSomeTime();
        await E2EGlobal.clickWithRetry('#navbar-dlgEditProfile');
        await E2EGlobal.waitSomeTime();
        await E2EUser.editProfile(longName, email);
        await browser.waitUntil(async _ => await browser.isVisible('#frmDlgEditProfile'), waitUntilTimeout);
        expect((await E2EUser.checkProfileChanged(longName, email)).value).to.be.false;
    });

    it('User profile is not changed, if pressing Cancel', function () {
        expect(await E2EApp.isLoggedIn()).to.be.true;
        let longName = 'cancellongname';
        let email = 'canceltest@test.de';
        await E2EGlobal.clickWithRetry('#navbar-usermenu');
        await E2EGlobal.waitSomeTime();
        await E2EGlobal.clickWithRetry('#navbar-dlgEditProfile');
        await E2EGlobal.waitSomeTime();
        await E2EUser.editProfile(longName, email, false);

        await E2EGlobal.clickWithRetry('#btnEditProfileCancel');
        await browser.waitUntil(async _ => !(await E2EUser.checkProfileChanged(longName,email)).value, waitUntilTimeout);
    });

    it('User can save his profile with an empty LongName', function () {
        expect(await E2EApp.isLoggedIn()).to.be.true;
        let longName = '';
        let email = 'test@test.de';
        await E2EGlobal.clickWithRetry('#navbar-usermenu');
        await E2EGlobal.waitSomeTime();
        await E2EGlobal.clickWithRetry('#navbar-dlgEditProfile');
        await E2EGlobal.waitSomeTime();
        await E2EUser.editProfile(longName, email);
        await browser.waitUntil(async _ => (await E2EUser.checkProfileChanged(longName,email)).value, waitUntilTimeout);
    });

    it('User can not save his profile with an empty Email', function () {
        expect(await E2EApp.isLoggedIn()).to.be.true;
        let longName = 'longname';
        let email = '';
        await E2EGlobal.clickWithRetry('#navbar-usermenu');
        await E2EGlobal.waitSomeTime();
        await E2EGlobal.clickWithRetry('#navbar-dlgEditProfile');
        await E2EGlobal.waitSomeTime();
        await E2EUser.editProfile(longName, email);
        await E2EGlobal.waitUntil(async _ => !(await E2EUser.checkProfileChanged(longName,email)).value, waitUntilTimeout);
    });


    it('User can change his longname without editing his Email', function () {
        expect(await E2EApp.isLoggedIn()).to.be.true;
        let longName = 'longnameChanged';
        let email = await E2EUser.getUserEmail();
        await E2EGlobal.clickWithRetry('#navbar-usermenu');
        await E2EGlobal.waitSomeTime();
        await E2EGlobal.clickWithRetry('#navbar-dlgEditProfile');
        await E2EGlobal.waitSomeTime();
        await E2EUser.editProfile(longName, email);
        await E2EGlobal.waitUntil(async _ => !(await E2EUser.checkProfileChanged(longName,email)).value, waitUntilTimeout);
    });

    it('Clicking the back button closes the password change dialog', function () {
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2EGlobal.clickWithRetry('#navbar-usermenu');
        await browser.waitForVisible('#navbar-dlgEditProfile');

        await E2EGlobal.clickWithRetry('#navbar-dlgEditProfile');
        await browser.waitForVisible('#dlgEditProfile');

        await browser.back();

        const waitForInvisible = true;
        await browser.waitForVisible('#dlgEditProfile', 10000, waitForInvisible);

    });
});
