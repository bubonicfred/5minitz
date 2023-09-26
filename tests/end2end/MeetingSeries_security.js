import { E2EApp } from './helpers/E2EApp';
import { E2ESecurity } from './helpers/E2ESecurity';
import {E2EGlobal} from "./helpers/E2EGlobal";

const newName = 'Changed Hacker Project #3';


describe('MeetingSeries Methods Security', function () {
    beforeEach('goto start page and make sure test user is logged in', function () {
        await E2EApp.gotoStartPage();
        expect(await E2EApp.isLoggedIn()).to.be.true;
    });

    before('reload page and reset app', function () {
        await E2EGlobal.logTimestamp("Start test suite");
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();
    });

    it('can not insert a new MeetingSerie if not logged in', function () {
        const name = 'Insert a MeetingSerie';
        const meetingSeriesCount = await server.call('e2e.countMeetingSeriesInMongDB');
        await E2EApp.logoutUser();
        expect(await E2EApp.isNotLoggedIn()).to.be.true;
        await E2ESecurity.tryInsertMeetingSeries(name, meetingSeriesCount, 'Meeting Series can not be added if user is not logged in');

        await E2EApp.loginUser();
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2ESecurity.tryInsertMeetingSeries(name, meetingSeriesCount+1, 'Meeting Series can be added if user is logged in');
    });

    it('can not delete a new MeetingSerie if not logged in', function () {
        const name = 'DeleteMeetingSerie';
        const ms_id = await E2ESecurity.createMeetingSeries(name);
        const meetingSeriesCount = await server.call('e2e.countMeetingSeriesInMongDB');
        await E2ESecurity.inviteUserToMeetingSerie(name, 'Invited', 2);

        await E2EApp.logoutUser();
        expect(await E2EApp.isNotLoggedIn()).to.be.true;
        await E2ESecurity.tryDeleteMeetingSeries(ms_id, meetingSeriesCount, 'Meeting Series can not be deleted if user is not logged in');

        await E2EApp.loginUser(1);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2ESecurity.tryDeleteMeetingSeries(ms_id, meetingSeriesCount, 'Meeting Series can not be deleted if user is not invited to a MS');

        await E2EApp.loginUser(2);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2ESecurity.tryDeleteMeetingSeries(ms_id, meetingSeriesCount, 'Meeting Series can not be deleted by invited user');

        await E2EApp.loginUser(0);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2ESecurity.tryDeleteMeetingSeries(ms_id, meetingSeriesCount-1, 'Meeting Series can be deleted if user is moderator');
    });

    it('can not update a MeetingSerie if not logged in', function () {
        const name = 'UpdateMeetingSerie';
        const ms_id = await E2ESecurity.createMeetingSeries(name);
        const oldName = ((await (server.call('e2e.findMeetingSeries', ms_id)))).name;
        await E2ESecurity.inviteUserToMeetingSerie(name, 'Invited', 2);

        await E2EApp.logoutUser();
        expect(await E2EApp.isNotLoggedIn()).to.be.true;
        await E2ESecurity.tryUpdateMeetingSeriesName(ms_id, newName, oldName, 'Meeting Series can not be updated if user is not logged in');

        await E2EApp.loginUser(1);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2ESecurity.tryUpdateMeetingSeriesName(ms_id, newName, oldName, 'Meeting Series can not be updated if user is not a moderator');

        await E2EApp.loginUser(2);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2ESecurity.tryUpdateMeetingSeriesName(ms_id, newName, oldName, 'Meeting Series can not be updated by invited user');

        await E2EApp.loginUser();
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2ESecurity.tryUpdateMeetingSeriesName(ms_id, newName, newName, 'Meeting Series can be updated if user is logged in and a moderator');
    });
});

describe('MeetingSeries Publish & Subscribe Security', function () {
    beforeEach('goto start page and make sure test user is logged in', function () {
        await E2EApp.gotoStartPage();
        expect(await E2EApp.isLoggedIn()).to.be.true;
    });

    before('reload page and reset app', function () {
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();
    });

    it('Non-logged in users have no unexpected MS published', function () {
        const msUser1 = await E2ESecurity.countRecordsInMiniMongo('meetingSeries');
        const name = 'Publish MS Project #1';
        await E2ESecurity.createMeetingSeries(name);

        await expect(await E2ESecurity.countRecordsInMiniMongo('meetingSeries'),
            'Moderator should have a MS published').to.equal(msUser1+1);

        await E2EApp.logoutUser();
        expect(await E2EApp.isNotLoggedIn()).to.be.true;
        await expect(await E2ESecurity.countRecordsInMiniMongo('meetingSeries'),
            'Not logged in user should not have a MS published').to.equal(0);
        await E2EApp.loginUser();
    });

    it('Invited users have no unexpected MS published', function () {
        await E2EApp.loginUser(1);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        const msUser2 = await E2ESecurity.countRecordsInMiniMongo('meetingSeries');

        await E2EApp.loginUser();
        const name = 'Publish MS Project #2';
        const name2 = 'Publish MS Project #22';
        await E2ESecurity.createMeetingSeries(name);
        await E2ESecurity.createMeetingSeries(name2);

        await E2ESecurity.inviteUserToMeetingSerie(name, 'Invited', 1);

        await E2EApp.loginUser(1);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await expect(await E2ESecurity.countRecordsInMiniMongo('meetingSeries'),
            'Invited user should have a MS published').to.equal(msUser2+1);
        await E2EApp.loginUser();
    });

    it('Informed users have no unexpected MS published', function () {
        await E2EApp.loginUser(2);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        const msUser3 = await E2ESecurity.countRecordsInMiniMongo('meetingSeries');

        await E2EApp.loginUser();
        const name = 'Publish MS Project #3';
        await E2ESecurity.createMeetingSeries(name);
        await E2ESecurity.inviteUserToMeetingSerie(name, 'Informed', 2);

        await E2EApp.loginUser(2);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await expect(await E2ESecurity.countRecordsInMiniMongo('meetingSeries'),
            'Informed user should not have a MS published').to.equal(msUser3);
        await E2EApp.loginUser();
    });
});
