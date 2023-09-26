import { E2EApp } from './helpers/E2EApp';
import { E2ESecurity } from './helpers/E2ESecurity';
import { E2EMinutes } from './helpers/E2EMinutes';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EGlobal } from './helpers/E2EGlobal';

const newMinuteDate = '01.01.2000';

describe('Minutes Method Security', function () {
    beforeEach('goto start page and make sure test user is logged in', function () {
        await E2EApp.gotoStartPage();
        expect(await E2EApp.isLoggedIn()).to.be.true;
    });
    before('reload page and reset app', function () {
        await E2EGlobal.logTimestamp("Start test suite");
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();
    });

    //minute.update
    it('can update a Minute if moderator', function () {
        const name = 'MinuteUpdate as moderator';
        const min = await E2ESecurity.createMeetingSeriesAndMinute(name);
        await E2ESecurity.tryUpdateCurrentMinuteDate(min.min_id, newMinuteDate, newMinuteDate);

    });

    it('can not update a Minute if not logged in', function () {
        const name = 'MinuteUpdate as not logged in';
        const min = await E2ESecurity.createMeetingSeriesAndMinute(name);
        await E2EApp.logoutUser();

        expect(await E2EApp.isNotLoggedIn()).to.be.true;
        await E2ESecurity.tryUpdateCurrentMinuteDate(min.min_id, newMinuteDate, min.date);
        await E2EApp.loginUser();

    });

    it('can not update a Minute if not invited to a Meeting Serie', function () {
        const name = 'MinuteUpdate as not invited to MS';
        const min = await E2ESecurity.createMeetingSeriesAndMinute(name);
        await E2EApp.loginUser(1);
        expect(await E2EApp.isLoggedIn()).to.be.true;

        await E2ESecurity.tryUpdateCurrentMinuteDate(min.min_id, newMinuteDate, min.date);
        await E2EApp.loginUser();

    });

    it('can not update a Minute as an invited user', function () {
        const name = 'MinuteUpdate as Invited';
        const min = await E2ESecurity.createMeetingSeriesAndMinute(name);
        await E2ESecurity.inviteUserToMeetingSerie(name, 'Invited', 1);

        await E2EApp.loginUser(1);
        expect(await E2EApp.isLoggedIn()).to.be.true;

        await E2ESecurity.tryUpdateCurrentMinuteDate(min.min_id, newMinuteDate, min.date);
        await E2EApp.loginUser();

    });

    //addMinute
    it('can not add a new Minute if not logged in', function () {
        const name = 'MinuteAdd as not logged in';
        const ms_id = await E2ESecurity.createMeetingSeries(name);

        const numberOfMinutes = await server.call('e2e.countMinutesInMongoDB');

        await E2EApp.logoutUser();
        expect(await E2EApp.isNotLoggedIn()).to.be.true;
        await E2ESecurity.tryAddNewMinute(ms_id, '29.07.2017', numberOfMinutes, 0);
        await E2EApp.loginUser();
    });

    it('can add a new Minute if a moderator', function () {
        const name = 'MinuteAdd as moderator';
        const ms_id = await E2ESecurity.createMeetingSeries(name);
        const numberOfMinutes = await server.call('e2e.countMinutesInMongoDB');

        await E2ESecurity.tryAddNewMinute(ms_id, '29.07.2017', numberOfMinutes+1, 0);
    });

    it('can not add a new Minute as an invited user', function () {
        const name = 'MinuteAdd as invited user';
        const ms_id = await E2ESecurity.createMeetingSeries(name);
        const numberOfMinutes = await server.call('e2e.countMinutesInMongoDB');
        await E2ESecurity.inviteUserToMeetingSerie(name, 'Invited', 1);

        await E2EApp.loginUser(1);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2ESecurity.tryAddNewMinute(ms_id, '29.07.2017', numberOfMinutes, 1);
        await E2EApp.loginUser();
    });

    it('can not add a new Minute if not invited to a Meeting Serie', function () {
        const name = 'MinuteAdd as not invited to MS';
        const ms_id = await E2ESecurity.createMeetingSeries(name);
        const numberOfMinutes = await server.call('e2e.countMinutesInMongoDB');

        await E2EApp.loginUser(1);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2ESecurity.tryAddNewMinute(ms_id, '29.07.2017', numberOfMinutes, 1);
        await E2EApp.loginUser();
    });

    //workflow.removeMinute
    it('can delete a Minute if a moderator', function () {
        const name = 'MinuteDelete as moderator';
        const min = await E2ESecurity.createMeetingSeriesAndMinute(name);
        const numberOfMinutes = await server.call('e2e.countMinutesInMongoDB');

        await E2ESecurity.tryRemoveMinute(min.min_id, numberOfMinutes-1);
    });

    it('can not delete a Minute if not logged in', function () {
        const name = 'MinuteDelete as not logged in';
        const min = await E2ESecurity.createMeetingSeriesAndMinute(name);
        const numberOfMinutes = await server.call('e2e.countMinutesInMongoDB');

        await E2EApp.logoutUser();
        await E2ESecurity.tryRemoveMinute(min.min_id, numberOfMinutes);
        await E2EApp.loginUser();
    });

    it('can not delete a Minute if not invited to a Meeting Serie', function () {
        const name = 'MinuteDelete as not invited to MS';
        const min = await E2ESecurity.createMeetingSeriesAndMinute(name);
        const numberOfMinutes = await server.call('e2e.countMinutesInMongoDB');

        await E2EApp.loginUser(1);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2ESecurity.tryRemoveMinute(min.min_id, numberOfMinutes)
        await E2EApp.loginUser();
    });

    it('can not delete a Minute as an invited user', function () {
        const name = 'MinuteDelete as an invited user';
        const min = await E2ESecurity.createMeetingSeriesAndMinute(name);
        const numberOfMinutes = await server.call('e2e.countMinutesInMongoDB');
        await E2ESecurity.inviteUserToMeetingSerie(name, 'Invited', 1);

        await E2EApp.loginUser(1);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2ESecurity.tryRemoveMinute(min.min_id, numberOfMinutes);
        await E2EApp.loginUser();
    });

    //workflow.finalizeMinute
    it('can finalize a Minute if Moderator', function () {
        const name = 'MinuteFinalize as moderator';
        const min = await E2ESecurity.createMeetingSeriesAndMinute(name);

        await E2ESecurity.tryFinalizeMinute(min.min_id, true);
    });

    it('can not finalize a Minute if not logged in', function () {
        const name = 'MinuteFinalize as not logged in';
        const min = await E2ESecurity.createMeetingSeriesAndMinute(name);

        await E2EApp.logoutUser();
        expect(await E2EApp.isNotLoggedIn()).to.be.true;
        await E2ESecurity.tryFinalizeMinute(min.min_id, false);
        await E2EApp.loginUser();
    });

    it('can not finalize a Minute if not invited to a Meeting Serie', function () {
        const name = 'MinuteFinalize as not invited to MS';
        const min = await E2ESecurity.createMeetingSeriesAndMinute(name);

        await E2EApp.loginUser(1);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2ESecurity.tryFinalizeMinute(min.min_id, false);
        await E2EApp.loginUser();
    });

    it('can not finalize a Minute as an invited user', function () {
        const name = 'MinuteFinalize as an invited user';
        const min = await E2ESecurity.createMeetingSeriesAndMinute(name);
        await E2ESecurity.inviteUserToMeetingSerie(name, 'Invited', 1);

        await E2EApp.loginUser(1);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2ESecurity.tryFinalizeMinute(min.min_id, false);
        await E2EApp.loginUser();
    });

    //workflow.unfinalizeMinute
    it('can unfinalize a Minute if Moderator', function () {
        const name = 'MinuteUnfinalize as moderator';
        const min = await E2ESecurity.createMeetingSeriesAndMinute(name);

        await E2ESecurity.executeMethod(E2ESecurity.finalizeMinute, min.min_id);
        await E2ESecurity.tryUnfinalizeMinute(min.min_id, false);
    });

    it('can not unfinalize a Minute if not logged in', function () {
        const name = 'MinuteUnfinalize as not logged in';
        const min = await E2ESecurity.createMeetingSeriesAndMinute(name);

        await E2ESecurity.executeMethod(E2ESecurity.finalizeMinute, min.min_id);
        await E2EApp.logoutUser();
        expect(await E2EApp.isNotLoggedIn()).to.be.true;
        await E2ESecurity.tryUnfinalizeMinute(min.min_id, true);
        await E2EApp.loginUser();
    });

    it('can not unfinalize a Minute if not invited to a Meeting Serie', function () {
        const name = 'MinuteUnfinalize as not invited to MS';
        const min = await E2ESecurity.createMeetingSeriesAndMinute(name);

        await E2ESecurity.executeMethod(E2ESecurity.finalizeMinute, min.min_id);
        await E2EApp.loginUser(1);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2ESecurity.tryUnfinalizeMinute(min.min_id, true);
        await E2EApp.loginUser();
    });

    it('can not unfinalize a Minute as an invited user', function () {
        const name = 'MinuteUnfinalize as an invited user';
        const min = await E2ESecurity.createMeetingSeriesAndMinute(name);

        await E2ESecurity.inviteUserToMeetingSerie(name, 'Invited', 1);
        await E2ESecurity.executeMethod(E2ESecurity.finalizeMinute, min.min_id);

        await E2EApp.loginUser(1);
        expect(await E2EApp.isLoggedIn()).to.be.true;
        await E2ESecurity.tryUnfinalizeMinute(min.min_id, true);
        await E2EApp.loginUser();
    });

    it('can not unfinalize a Minute as a Moderator if it is not the last one', function () {
        const name = 'MinuteUnfinalize for not last Minute';
        const minute_1 = await E2ESecurity.createMeetingSeriesAndMinute(name);

        await E2ESecurity.executeMethod(E2ESecurity.finalizeMinute, minute_1.min_id);
        await E2EMinutes.addMinutesToMeetingSeries(name, name);
        await E2EMinutes.gotoLatestMinutes();
        const minuteID_2 =  await E2EMinutes.getCurrentMinutesId();
        await E2ESecurity.executeMethod(E2ESecurity.finalizeMinute, minuteID_2);

        await E2ESecurity.tryUnfinalizeMinute(minute_1.min_id, true);
    });

});

describe('Minute Publish & Subscribe Security', function () {
    beforeEach('goto start page and make sure test user is logged in', function () {
        await E2EApp.gotoStartPage();
        expect(await E2EApp.isLoggedIn()).to.be.true;
    });

    before('reload page and reset app', function () {
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();
    });

    it('Non-logged in users have no unexpected Minutes published', function () {
        const name = 'Publish Minutes Project #1';
        const min = await E2ESecurity.createMeetingSeriesAndMinute(name);
        await E2ESecurity.tryFinalizeMinute(min.min_id, true);

        await E2EMinutes.addMinutesToMeetingSeries(name, name);

        await expect(await E2ESecurity.countRecordsInMiniMongo('minutes'),
            'Moderator should have 2 Minutes published').to.equal(2);

        await E2EApp.logoutUser();
        expect (await E2EApp.isNotLoggedIn()).to.be.true;
        await expect(await E2ESecurity.countRecordsInMiniMongo('minutes'),
            'Not logged in user should not have Minutes published').to.equal(0);

        await E2EApp.loginUser();
    });

    it('Invited users should have Minutes published', function () {
        expect(await E2EApp.isLoggedIn()).to.be.true;
        const name = 'Publish Minutes Project #2';

        const min = await E2ESecurity.createMeetingSeriesAndMinute(name);
        await E2ESecurity.inviteUserToMeetingSerie(name, 'Invited', 1);
        await E2ESecurity.tryFinalizeMinute(min.min_id, true);

        await E2EMinutes.addMinutesToMeetingSeries(name, name);
        await expect(await E2ESecurity.countRecordsInMiniMongo('minutes'), 'Moderator should have 2 Minutes published').to.equal(2);

        await E2EApp.loginUser(1);
        expect (await E2EApp.isLoggedIn()).to.be.true;
        await expect(await E2ESecurity.countRecordsInMiniMongo('minutes'),
            'Invited user should have no Minutes published when not within a Meeting Series').to.equal(0);
        await E2EMeetingSeries.gotoMeetingSeries(name, name);
        await E2EGlobal.waitSomeTime();
        await expect(await E2ESecurity.countRecordsInMiniMongo('minutes'),
            'Invited user should have 2 Minutes published').to.equal(2);

        await E2EApp.loginUser();
    });
});
