require('./helpers/Server');
require('./helpers/wdio_v4_to_v5');

import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';


describe('MeetingSeries', function () {
    before('reload page and reset app', function () {
        console.log('Executing: '+(await E2EGlobal.getTestSpecFilename()));
        await server.connect();
        await E2EGlobal.logTimestamp('Start test suite');
        await E2EApp.resetMyApp();
        await E2EApp.launchApp();
    });

    beforeEach('goto start page and make sure test user is logged in', function () {
        await E2EApp.gotoStartPage();
        expect (await E2EApp.isLoggedIn()).to.be.true;
    });

    it('can create a first meeting series', function () {
        const aProjectName = 'E2E Project';
        const aMeetingName = 'Meeting Name #1';
        const initialCount = await E2EMeetingSeries.countMeetingSeries();
        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await expect(await E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount + 1);
        expect(await E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
    });


    it('can create a further meeting series', function () {
        const aProjectName = 'E2E Project';
        const aMeetingName = 'Meeting Name #2';
        const initialCount = await E2EMeetingSeries.countMeetingSeries();
        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await expect(await E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount + 1);
        expect(await E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
    });


    it('can submit the form by pressing enter in the meetingname input', function () {
        const aProjectName = 'E2E Project';
        const aMeetingName = 'Meeting Name #2.7182818284';
        const initialCount = await E2EMeetingSeries.countMeetingSeries();

        await E2EMeetingSeries.editMeetingSeriesForm(aProjectName, aMeetingName + '\n');
        await E2EGlobal.waitSomeTime(500);
        await E2EGlobal.clickWithRetry('#btnMeetinSeriesEditCancel');

        await expect(await E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount + 1);
        expect(await E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
    });


    it('can not create meeting series with empty project', function () {
        const aProjectName = '';
        const aMeetingName = 'Meeting Name #2.1';
        const initialCount = await E2EMeetingSeries.countMeetingSeries();
        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await expect(await E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount);
        expect(await E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
    });

    it('can not create meeting series with empty name', function () {
        const aProjectName = 'E2E Project - Unknown series';
        const aMeetingName = '';
        const initialCount = await E2EMeetingSeries.countMeetingSeries();
        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await expect(await E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount);
        expect(await E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
    });

    it('can goto meeting series details', function () {
        const aProjectName = 'E2E Project';
        const aMeetingName = 'Meeting Name #4';
        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        expect(await E2EApp.isOnStartPage()).to.be.false;
    });
});
