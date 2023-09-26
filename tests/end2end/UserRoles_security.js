import { E2EApp } from './helpers/E2EApp';
import { E2ESecurity } from './helpers/E2ESecurity';
import {E2EGlobal} from "./helpers/E2EGlobal";

const newRoleModerator = '01';

describe('UserRoles Method Security', function () {
    beforeEach('goto start page and make sure test user is logged in', function () {
        await E2EApp.gotoStartPage();
        expect(await E2EApp.isLoggedIn()).to.be.true;
    });

    before('reload page and reset app', function () {
        await E2EGlobal.logTimestamp("Start test suite");
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();
    });

    //userroles.saveRoleForMeetingSeries
    it('a user can not upgrade himself to a moderator of MS', function () {
        const name = 'Update my own Role Project';
        const meetingSeriesID = await E2ESecurity.createMeetingSeries(name);
        await E2ESecurity.inviteUserToMeetingSerie(name, 'Invited', 1);
        const oldRole = await server.call('e2e.getUserRole', meetingSeriesID, 1);

        await E2EApp.loginUser(1);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2ESecurity.tryUpdateRole(meetingSeriesID, 1, newRoleModerator, oldRole);
        await E2EApp.loginUser();
    });

    it('a moderator can change a role of an invited user in Meeting Series', function () {
        const name = 'Update my own Role Moderator Project';
        const meetingSeriesID = await E2ESecurity.createMeetingSeries(name);
        await E2ESecurity.inviteUserToMeetingSerie(name, 'Invited', 1);

        await E2ESecurity.tryUpdateRole(meetingSeriesID, 1, newRoleModerator, newRoleModerator)
    });

    it('a user can not change a Role of another user in a Meeting Serie', function () {
        const name = 'Update other users Role Project';
        const meetingSeriesID = await E2ESecurity.createMeetingSeries(name);

        await E2ESecurity.inviteUserToMeetingSerie(name, 'Invited', 1);
        const oldRoleUser1 = await server.call('e2e.getUserRole', meetingSeriesID, 1);

        await E2EApp.loginUser(2);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2ESecurity.tryUpdateRole(meetingSeriesID, 1, newRoleModerator, oldRoleUser1);
        await E2EApp.loginUser();
    });

    it('a user can not add himself to a Meeting Serie', function () {
        const name = 'RoleUpdate add to MS Project';
        const meetingSeriesID = await E2ESecurity.createMeetingSeries(name);

        await E2EApp.loginUser(1);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2ESecurity.tryUpdateRole(meetingSeriesID, 1, newRoleModerator, null);
        await E2EApp.loginUser();
    });

    //userroles.removeAllRolesForMeetingSeries
    it('a Moderator can delete another user from a Meeting Serie', function () {
        const name = 'RoleDelete Moderator Project';
        const meetingSeriesID = await E2ESecurity.createMeetingSeries(name);
        await E2ESecurity.inviteUserToMeetingSerie(name, 'Invited', 1);

        await E2ESecurity.tryRemoveRole(meetingSeriesID, 1, null);
    });

    it('a user can not delete another user from a Meeting Serie', function () {
        const name = 'RoleDelete invited user Project';
        const meetingSeriesID = await E2ESecurity.createMeetingSeries(name);
        await E2ESecurity.inviteUserToMeetingSerie(name, 'Invited', 1);
        await E2ESecurity.inviteUserToMeetingSerie(name, 'Invited', 2);
        const roleUser1 = await server.call('e2e.getUserRole', meetingSeriesID, 1);

        await E2EApp.loginUser(2);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2ESecurity.tryRemoveRole(meetingSeriesID, 1, roleUser1);
        await E2EApp.loginUser();
    });
});

describe('Users Publish & Subscribe Security', function () {
    beforeEach('goto start page and make sure test user is logged in', function () {
        await E2EApp.gotoStartPage();
        expect(await E2EApp.isLoggedIn()).to.be.true;
    });

    before('reload page and reset app', function () {
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();
    });

    it('Non-logged in users have no users collection published', function () {
        expect((await E2ESecurity.countRecordsInMiniMongo('users')) > 0).to.be.true;

        await E2EApp.logoutUser();
        expect(await E2EApp.isNotLoggedIn()).to.be.true;
        await expect(await E2ESecurity.countRecordsInMiniMongo('users'),
            'Not logged in user should not have users collection published').to.equal(0);
        await E2EApp.loginUser();
    });
});
