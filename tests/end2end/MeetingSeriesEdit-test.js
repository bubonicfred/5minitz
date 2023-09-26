require('./helpers/Server');
require('./helpers/wdio_v4_to_v5');

import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EMeetingSeriesEditor } from './helpers/E2EMeetingSeriesEditor';
import { E2EMinutes } from './helpers/E2EMinutes';


describe('MeetingSeries Editor', function () {
    const aProjectName = 'E2E MeetingSeries Editor';
    let aMeetingCounter = 0;
    let aMeetingNameBase = 'Meeting Name #';
    let aMeetingName;

    before('reload page and reset app', function () {
        console.log('Executing: ',await E2EGlobal.getTestSpecFilename());
        await server.connect();
        await E2EGlobal.logTimestamp('Start test suite');
        await E2EApp.resetMyApp();
        await E2EApp.launchApp();
    });

    beforeEach('goto start page and make sure test user is logged in', function () {
        await E2EApp.gotoStartPage();
        expect (await E2EApp.isLoggedIn()).to.be.true;

        aMeetingCounter++;
        aMeetingName = aMeetingNameBase + aMeetingCounter;
        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
    });


    it('can open and close meeting series editor without changing data', function () {
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        // Now dialog should be there
        expect(await browser.isVisible('#btnMeetingSeriesSave')).to.be.true;
        await E2EMeetingSeriesEditor.closeMeetingSeriesEditor(false);  // close with cancel
        // Now dialog should be gone
        expect(await browser.isVisible('#btnMeetingSeriesSave')).to.be.false;
        expect(await E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.false;
    });


    it('can open and cancel meeting series editor without changing data', function () {
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        // Now dialog should be there
        expect(await browser.isVisible('#btnMeetinSeriesEditCancel')).to.be.true;
        await E2EGlobal.clickWithRetry('#btnMeetinSeriesEditCancel');
        await E2EGlobal.waitSomeTime(); // give dialog animation time
        // Now dialog should be gone
        expect(await browser.isVisible('#btnMeetinSeriesEditCancel')).to.be.false;
        expect(await E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.false;
    });


    it('can delete an empty meeting series', function () {
        let countAfterCreate = await E2EMeetingSeries.countMeetingSeries();
        expect(await E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);

        await E2EGlobal.clickWithRetry('#deleteMeetingSeries');
        await E2EApp.confirmationDialogAnswer(true);

        await expect(await E2EMeetingSeries.countMeetingSeries()).to.equal(countAfterCreate -1);
        expect(await E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
    });


    it('can cancel delete of meeting series', function () {
        let countAfterCreate = await E2EMeetingSeries.countMeetingSeries();
        expect(await E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);

        await E2EGlobal.clickWithRetry('#deleteMeetingSeries');
        await E2EApp.confirmationDialogAnswer(false);

        await expect(await E2EMeetingSeries.countMeetingSeries()).to.equal(countAfterCreate);
        expect(await E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;
    });


    it('can clean up child minutes on deleting meeting series', function () {
        let aMeetingName = 'Meeting Name (with Minute)';

        let countDBMeetingSeriesBefore = await server.call('e2e.countMeetingSeriesInMongDB');
        let countDBMinutesBefore = await server.call('e2e.countMinutesInMongoDB');
        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.finalizeCurrentMinutes();
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);

        // One more Meeting series and one more minutes
        await expect(await server.call('e2e.countMeetingSeriesInMongDB')).to.equal(countDBMeetingSeriesBefore +1);
        await expect(await server.call('e2e.countMinutesInMongoDB')).to.equal(countDBMinutesBefore +1);

        // Now delete meeting series with attached Minutes
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        await E2EGlobal.clickWithRetry('#deleteMeetingSeries');
        await E2EApp.confirmationDialogAnswer(true);

        // Meeting series and attached minutes should be gone
        await expect(await server.call('e2e.countMeetingSeriesInMongDB')).to.equal(countDBMeetingSeriesBefore);
        await expect(await server.call('e2e.countMinutesInMongoDB')).to.equal(countDBMinutesBefore);
        expect(await E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
    });


    it('can not save meeting series without project or name', function () {
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        await browser.setValue('input[id="id_meetingproject"]', '');  // empty input
        await browser.setValue('input[id="id_meetingname"]', '');     // empty input
        await E2EGlobal.clickWithRetry('#btnMeetingSeriesSave');     // try to save
        expect(await browser.isVisible('#btnMeetingSeriesSave')).to.be.true;  // dialog still open!

        await browser.setValue('input[id="id_meetingproject"]', 'XXX');
        await browser.setValue('input[id="id_meetingname"]', '');     // empty input
        await E2EGlobal.clickWithRetry('#btnMeetingSeriesSave');     // try to save
        expect(await browser.isVisible('#btnMeetingSeriesSave')).to.be.true;  // dialog still open!

        await browser.setValue('input[id="id_meetingproject"]', '');  // empty input
        await browser.setValue('input[id="id_meetingname"]', 'XXX');
        await E2EGlobal.clickWithRetry('#btnMeetingSeriesSave');     // try to save
        expect(await browser.isVisible('#btnMeetingSeriesSave')).to.be.true;  // dialog still open!

        await E2EMeetingSeriesEditor.closeMeetingSeriesEditor(false);  // close with cancel
        await E2EApp.gotoStartPage();
        expect(await E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).to.be.ok;  // prj/name should be unchanged
    });


    it('can save meeting series with new project name and meeting name', function () {
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        let aNewProjectName = 'E2E New Project';
        let aNewMeetingName = 'New Meeting Name';
        await browser.setValue('input[id="id_meetingproject"]', aNewProjectName);
        await browser.setValue('input[id="id_meetingname"]', aNewMeetingName);
        await E2EMeetingSeriesEditor.closeMeetingSeriesEditor();  // close with save

        await E2EApp.gotoStartPage();
        expect(await E2EMeetingSeries.getMeetingSeriesId(aProjectName, aMeetingName)).not.to.be.ok;
        expect(await E2EMeetingSeries.getMeetingSeriesId(aNewProjectName, aNewMeetingName)).to.be.ok;
    });

    it('can restore fields after close and re-open', function () {
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        await browser.setValue('input[id="id_meetingproject"]', aProjectName+' Changed!');
        await browser.setValue('input[id="id_meetingname"]', aMeetingName + ' Changed!');

        await E2EGlobal.clickWithRetry('#btnEditMSClose');    // Don't store new values!
        await E2EGlobal.waitSomeTime(); // give dialog animation time

        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, 'base', true);
        await expect(await browser.getValue('input[id="id_meetingproject"]')).to.equal(aProjectName);
        await expect(await browser.getValue('input[id="id_meetingname"]')).to.equal(aMeetingName);

        await E2EGlobal.clickWithRetry('#btnEditMSClose');
        await E2EGlobal.waitSomeTime(); // give dialog animation time
    });

    it('can restore fields after cancel and re-open', function () {
        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        await browser.setValue('input[id="id_meetingproject"]', aProjectName+' Changed!');
        await browser.setValue('input[id="id_meetingname"]', aMeetingName + ' Changed!');

        await E2EGlobal.clickWithRetry('#btnMeetinSeriesEditCancel');
        await E2EGlobal.waitSomeTime(); // give dialog animation time

        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName, 'base', true);
        await expect(await browser.getValue('input[id="id_meetingproject"]')).to.equal(aProjectName);
        await expect(await browser.getValue('input[id="id_meetingname"]')).to.equal(aMeetingName);

        await E2EGlobal.clickWithRetry('#btnMeetinSeriesEditCancel');
        await E2EGlobal.waitSomeTime(); // give dialog animation time
    });

    it('can delete a meeting series', function() {
        const initialCount = await E2EMeetingSeries.countMeetingSeries();

        await E2EMeetingSeriesEditor.openMeetingSeriesEditor(aProjectName, aMeetingName);
        await E2EGlobal.clickWithRetry('#deleteMeetingSeries');
        await E2EGlobal.waitSomeTime(); // give dialog animation time
        await E2EApp.confirmationDialogAnswer(true);

        await expect(await E2EMeetingSeries.countMeetingSeries()).to.equal(initialCount - 1);
    });
});

