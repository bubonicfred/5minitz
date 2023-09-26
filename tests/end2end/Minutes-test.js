import { E2EGlobal } from './helpers/E2EGlobal';
import { E2EApp } from './helpers/E2EApp';
import { E2EMeetingSeries } from './helpers/E2EMeetingSeries';
import { E2EMinutes } from './helpers/E2EMinutes';
import { E2ETopics } from './helpers/E2ETopics';

describe('Minutes', function () {

    before("reload page and reset app", function () {
        await E2EGlobal.logTimestamp("Start test suite");
        await E2EApp.resetMyApp(true);
        await E2EApp.launchApp();
    });

    beforeEach("goto start page and make sure test user is logged in", function () {
        await E2EApp.gotoStartPage();
        expect (await E2EApp.isLoggedIn()).to.be.true;
    });


    it('can add first minutes to meeting series', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #1";

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await expect(await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(0);

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.finalizeCurrentMinutes();
        await expect(await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
    });


    it('can add further minutes to meeting series', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #2";

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        let countInitialMinutes = await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName);

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.finalizeCurrentMinutes();
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await expect(await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(countInitialMinutes +2);
    });


    it('can add minutes for specific date', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #3";
        let myDate = "2015-03-17";  // date of first project commit ;-)

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);

        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await expect(await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
        expect(await E2EMinutes.getMinutesId(myDate)).to.be.ok;
    });


    it('can delete unfinalized minutes', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #4";
        let myDate = "2015-03-17";  // date of first project commit ;-)

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);

        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await expect(await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
        expect(await E2EMinutes.getMinutesId(myDate)).to.be.ok;

        // Now delete it!
        await E2EMinutes.gotoMinutes(myDate);
        await E2EGlobal.clickWithRetry("#btn_deleteMinutes");
        await E2EApp.confirmationDialogAnswer(true);
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await expect(await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(0);
        expect(await E2EMinutes.getMinutesId(myDate)).not.to.be.ok;
    });


    it('can cancel delete of unfinalized minutes', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #5";
        let myDate = "2015-03-17";  // date of first project commit ;-)

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName, myDate);

        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await expect(await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
        expect(await E2EMinutes.getMinutesId(myDate)).to.be.ok;

        // Now trigger delete!
        await E2EMinutes.gotoMinutes(myDate);
        await E2EGlobal.clickWithRetry("#btn_deleteMinutes");
        await E2EApp.confirmationDialogAnswer(false);
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        await expect(await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(1);
        expect(await E2EMinutes.getMinutesId(myDate)).to.be.ok;
    });

    it('displays an error message if the minute is not linked to the parent series', function() {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #6";

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMeetingSeries.gotoMeetingSeries(aProjectName, aMeetingName);
        let urlArr = (await browser.getUrl()).split('/');
        let msId = urlArr[(urlArr.length) - 1];

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        await E2EGlobal.waitSomeTime(2000); // wait until parent check will be enabled

        let messageSelector = '[data-notify="container"]';

        expect(await browser.isVisible(messageSelector), 'flash message should not be visible before un-linking the minute').to.be.false;

        await server.call('e2e.updateMeetingSeries', msId, {minutes: []});

        await browser.waitForVisible(messageSelector);
        let dialogMsgElement = (await browser.element(messageSelector)).value.ELEMENT;
        let dialogMsgText = (await browser.elementIdText(dialogMsgElement)).value;
        await expect(dialogMsgText, 'error message should be displayed').to.have.string('Unfortunately the minute is not linked to its parent series correctly');
    });

    it('can persist global notes', function() {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #6";
        const aGlobalNote = "Amazing global note";

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        await browser.setValue('textarea[id="editGlobalNotes"]', aGlobalNote);
        await E2EGlobal.clickWithRetry('#btnParticipantsExpand');

        let result = await browser.getValue('textarea[id="editGlobalNotes"]');
        await expect(result).to.equal(aGlobalNote);

        await browser.refresh();
        await E2EGlobal.waitSomeTime(2500); // phantom.js needs some time here...


        result = await browser.getValue('textarea[id="editGlobalNotes"]');
        await expect(result).to.equal(aGlobalNote);
    });

    it('hide closed topics', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #7";

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);

        await E2ETopics.addTopicToMinutes("topic #1");
        await E2ETopics.addTopicToMinutes("topic #2");
        await E2ETopics.addTopicToMinutes("topic #3");
        await E2ETopics.addTopicToMinutes("topic #4");

        await E2EGlobal.waitSomeTime(700);

        await E2ETopics.toggleTopic(1);
        await E2ETopics.toggleTopic(2);

        await E2EGlobal.clickWithRetry("#checkHideClosedTopicsLabel");

        await expect(await E2ETopics.countTopicsForMinute()).to.equal(2);


    });
    
    it('can navigate to previous and next minutes within a minutes', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name PrevNext";

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.finalizeCurrentMinutes();
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        await E2EMinutes.finalizeCurrentMinutes();
        const secondDate = await E2EMinutes.getCurrentMinutesDate();
        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);
        const thirdDate = await E2EMinutes.getCurrentMinutesDate();
        
        await expect(await E2EMinutes.countMinutesForSeries(aProjectName, aMeetingName)).to.equal(3);
        
        await E2EMinutes.gotoLatestMinutes();
        await E2EGlobal.clickWithRetry("#btnPreviousMinutesNavigation");
        let currentdate = await E2EMinutes.getCurrentMinutesDate();
        await expect(currentdate).to.equal(secondDate);
        
        await E2EGlobal.clickWithRetry("#btnNextMinutesNavigation");
        currentdate = await E2EMinutes.getCurrentMinutesDate();
        await expect(currentdate).to.equal(thirdDate);
    });

    it('hide closed topics by click', function () {
        let aProjectName = "E2E Minutes";
        let aMeetingName = "Meeting Name #8";

        await E2EMeetingSeries.createMeetingSeries(aProjectName, aMeetingName);

        await E2EMinutes.addMinutesToMeetingSeries(aProjectName, aMeetingName);


        await E2ETopics.addTopicToMinutes("topic #1");
        await E2ETopics.addTopicToMinutes("topic #2");
        await E2ETopics.addTopicToMinutes("topic #3");
        await E2ETopics.addTopicToMinutes("topic #4");

        await E2EGlobal.clickWithRetry("#checkHideClosedTopicsLabel");
        await expect(await E2ETopics.countTopicsForMinute()).to.equal(4);

        await E2ETopics.toggleTopic(1);
        await expect(await E2ETopics.countTopicsForMinute()).to.equal(3);
    });
});
